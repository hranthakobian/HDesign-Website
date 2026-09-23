import { NextResponse } from 'next/server';
import { PDFDocument, rgb, TextRenderingMode, setTextRenderingMode } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface PageInput {
  imageData: string; // data URL or base64
  text?: string;
  blocks?: Array<{
    text: string;
    box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  }>;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pages, docTitle } = body as { pages: PageInput[]; docTitle?: string };

    if (!Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: 'Ոչ մի էջ չի տրամադրվել (No pages provided)' }, { status: 400 });
    }

    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);

    if (docTitle) {
      doc.setTitle(docTitle);
    }
    doc.setCreator('HDesign Gemini Flash Lite OCR');
    doc.setProducer('HDesign Searchable PDF Generator');

    // Load Armenian Unicode font
    const fontPath = path.join(process.cwd(), 'public', 'HDesign.ttf');
    let customFont: any = null;
    if (fs.existsSync(fontPath)) {
      try {
        const fontBytes = fs.readFileSync(fontPath);
        customFont = await doc.embedFont(fontBytes);
      } catch (fontErr) {
        console.warn('Failed to embed custom HDesign font, using standard font:', fontErr);
      }
    }

    for (let i = 0; i < pages.length; i++) {
      const pageData = pages[i];
      if (!pageData.imageData) continue;

      let imageBuffer: Buffer;
      let isPng = false;

      const matches = pageData.imageData.match(/^data:([A-Za-z0-9\-\+\/]+);base64,(.+)$/);
      if (matches && matches[2]) {
        if (matches[1] && matches[1].includes('png')) {
          isPng = true;
        }
        imageBuffer = Buffer.from(matches[2], 'base64');
      } else {
        imageBuffer = Buffer.from(pageData.imageData, 'base64');
      }

      let embeddedImg: any = null;
      try {
        if (isPng) {
          embeddedImg = await doc.embedPng(imageBuffer);
        } else {
          embeddedImg = await doc.embedJpg(imageBuffer);
        }
      } catch (embedFirstErr) {
        // Fallback: try other format
        try {
          if (isPng) {
            embeddedImg = await doc.embedJpg(imageBuffer);
          } else {
            embeddedImg = await doc.embedPng(imageBuffer);
          }
        } catch (embedSecondErr) {
          console.error(`Failed to embed image for page ${i + 1}:`, embedSecondErr);
          continue;
        }
      }

      if (!embeddedImg) continue;

      const imgWidth = embeddedImg.width;
      const imgHeight = embeddedImg.height;

      const page = doc.addPage([imgWidth, imgHeight]);

      // 1. Draw original scanned image
      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: imgWidth,
        height: imgHeight,
      });

      // 2. Overlay Invisible Text Layer for instant Ctrl+F search & mouse selection
      if (customFont) {
        page.pushOperators(setTextRenderingMode(TextRenderingMode.Invisible));

        const blocks = Array.isArray(pageData.blocks) ? pageData.blocks : [];

        if (blocks.length > 0) {
          for (const block of blocks) {
            const rawText = (block.text || '').replace(/[\r\n\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ').trim();
            if (!rawText) continue;

            const [ymin, xmin, ymax, xmax] = block.box;
            const x = (xmin / 1000) * imgWidth;
            const boxHeight = Math.max(6, ((ymax - ymin) / 1000) * imgHeight);
            const y = imgHeight - (ymax / 1000) * imgHeight;
            const fontSize = Math.max(6, Math.min(boxHeight * 0.85, 48));

            try {
              page.drawText(rawText, {
                x: Math.max(0, x),
                y: Math.max(0, y),
                size: fontSize,
                font: customFont,
                color: rgb(0, 0, 0),
              });
            } catch (drawErr) {
              // Ignore single glyph rendering issues
            }
          }
        } else if (pageData.text && pageData.text.trim()) {
          // If no coordinate blocks, distribute lines across page
          const lines = pageData.text.split('\n').map(l => l.trim()).filter(Boolean);
          const lineHeight = Math.min(24, Math.max(10, imgHeight / (lines.length + 4)));
          let currentY = imgHeight - lineHeight * 2;

          for (const line of lines) {
            if (currentY < lineHeight) break;
            try {
              page.drawText(line, {
                x: 40,
                y: currentY,
                size: Math.max(8, lineHeight * 0.8),
                font: customFont,
                color: rgb(0, 0, 0),
              });
            } catch (_) {}
            currentY -= lineHeight;
          }
        }

        // Reset text mode back to Fill
        page.pushOperators(setTextRenderingMode(TextRenderingMode.Fill));
      }
    }

    if (doc.getPageCount() === 0) {
      return NextResponse.json({ error: 'Ոչ մի էջ հնարավոր չեղավ ավելացնել PDF-ում' }, { status: 400 });
    }

    const pdfBytes = await doc.save();
    const filename = `searchable_document_${Date.now()}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBytes.length),
      },
    });
  } catch (error: any) {
    console.error('Searchable PDF Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Searchable PDF ստեղծումը ձախողվեց' },
      { status: 500 }
    );
  }
}

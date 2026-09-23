import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';

export const maxDuration = 60; // Allow sufficient time for OCR processing

export async function POST(request: Request) {
  let worker: any = null;
  try {
    const contentType = request.headers.get('content-type') || '';
    let imageBuffer: Buffer | null = null;
    let selectedLang = 'eng+hye';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image') as File | null;
      const langParam = formData.get('lang') as string | null;
      if (langParam) selectedLang = langParam;

      if (!file) {
        return NextResponse.json({ error: 'No image provided in form data' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      const body = await request.json();
      const { image, lang } = body;
      if (lang) selectedLang = lang;

      if (!image) {
        return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
      }

      // Handle base64 / data URL format
      if (typeof image === 'string') {
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const base64Data = matches && matches[2] ? matches[2] : image;
        imageBuffer = Buffer.from(base64Data, 'base64');
      }
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty image buffer' }, { status: 400 });
    }

    // Determine language list for tesseract
    let langs: string[] = ['eng', 'hye'];
    if (selectedLang === 'hye') {
      langs = ['hye'];
    } else if (selectedLang === 'eng') {
      langs = ['eng'];
    }

    const path = await import('path');
    const workerPath = path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js');

    worker = await createWorker(langs, 1, {
      workerPath
    });
    const result = await worker.recognize(imageBuffer);
    const rawText = result.data?.text || '';

    // Clean up text
    const cleanText = rawText
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .join('\n')
      .trim();

    // Extract individual words (longer than 2 characters) for search matching
    const words = Array.from(
      new Set(
        cleanText
          .split(/[\s,.;:!?()[\]{}"'«»—–\/\\]+/)
          .map((w: string) => w.trim())
          .filter((w: string) => w.length >= 2)
      )
    );

    return NextResponse.json({
      success: true,
      text: cleanText,
      confidence: result.data?.confidence || 0,
      words: words.slice(0, 30),
      lines: result.data?.lines?.map((l: any) => l.text.trim()).filter(Boolean) || []
    });
  } catch (error: any) {
    console.error('OCR processing error:', error);
    return NextResponse.json(
      { error: error.message || 'OCR processing failed' },
      { status: 500 }
    );
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (err) {
        console.warn('Failed to terminate worker:', err);
      }
    }
  }
}

import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';

export const maxDuration = 60; // Allow sufficient time for processing

export interface OcrDetectedBlock {
  text: string;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
}

interface GeminiOcrResult {
  fullText: string;
  blocks: OcrDetectedBlock[];
}

/**
 * Perform high-accuracy visual text recognition using Google Gemini Flash API (Free Tier).
 */
async function recognizeWithGemini(imageBuffer: Buffer, mimeType: string = 'image/jpeg'): Promise<GeminiOcrResult | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const base64Image = imageBuffer.toString('base64');
  const models = [
    'gemini-flash-lite-latest',
    'gemini-2.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-flash-latest'
  ];

  const prompt = `Locate and extract every visible text element, logo, title, and subtitle in this image.
For each detected text segment, provide:
- "text": the detected text verbatim
- "box": [ymin, xmin, ymax, xmax] as normalized coordinates from 0 to 1000 representing the exact bounding box around the text in the image.

Return ONLY a valid JSON array of objects in this format:
[
  {"text": "...", "box": [ymin, xmin, ymax, xmax]}
]`;

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (rawText.trim().length > 0) {
          // Parse JSON array from raw response
          try {
            const cleaned = rawText
              .replace(/^```json/i, '')
              .replace(/^```/i, '')
              .replace(/```$/i, '')
              .trim();
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const blocks: OcrDetectedBlock[] = parsed.map((item: any) => ({
                text: String(item.text || '').trim(),
                box: Array.isArray(item.box) && item.box.length === 4 ? item.box : [0, 0, 1000, 1000]
              })).filter(b => b.text.length > 0);

              const fullText = blocks.map(b => b.text).join('\n');
              return { fullText, blocks };
            }
          } catch (jsonErr) {
            // Fallback if not valid json array
            return { fullText: rawText.trim(), blocks: [] };
          }
        }
      }
    } catch (err) {
      console.warn(`Gemini OCR attempt failed on model ${model}:`, err);
    }
  }

  return null;
}

export async function POST(request: Request) {
  let worker: any = null;
  try {
    const contentType = request.headers.get('content-type') || '';
    let imageBuffer: Buffer | null = null;
    let mimeType = 'image/jpeg';
    let selectedLang = 'eng+hye';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image') as File | null;
      const langParam = formData.get('lang') as string | null;
      if (langParam) selectedLang = langParam;

      if (!file) {
        return NextResponse.json({ error: 'No image provided in form data' }, { status: 400 });
      }

      mimeType = file.type || 'image/jpeg';
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
        if (matches && matches[1]) {
          mimeType = matches[1];
        }
        const base64Data = matches && matches[2] ? matches[2] : image;
        imageBuffer = Buffer.from(base64Data, 'base64');
      }
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty image buffer' }, { status: 400 });
    }

    let extractedText: string = '';
    let detectedBlocks: OcrDetectedBlock[] = [];
    let provider = 'tesseract';

    // 1. Try Gemini Vision AI first (free tier, perfect accuracy for stylized text & Armenian fonts)
    const geminiResult = await recognizeWithGemini(imageBuffer, mimeType);
    if (geminiResult && geminiResult.fullText && geminiResult.fullText.trim().length > 0) {
      extractedText = geminiResult.fullText.trim();
      detectedBlocks = geminiResult.blocks || [];
      provider = 'gemini-vision';
    } else {
      // 2. Fallback to Tesseract OCR
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
      extractedText = result.data?.text || '';
    }

    // Clean up text
    const cleanText = extractedText
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .join('\n')
      .trim();

    // Extract individual words (longer than 1 character) and stripped tokens for search matching
    const rawTokens = cleanText
      .split(/[\s,.;:!?()[\]{}"'«»—–\/\\]+|[։՝՜՛՞]+/)
      .map((w: string) => w.trim())
      .filter((w: string) => w.length >= 2);

    const wordsSet = new Set<string>();
    for (const token of rawTokens) {
      wordsSet.add(token);
      const stripped = token.replace(/^[#@_]+|[#@_]+$/g, '').trim();
      if (stripped.length >= 2) {
        wordsSet.add(stripped);
      }
    }
    const words = Array.from(wordsSet);

    const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);

    return NextResponse.json({
      success: true,
      provider,
      text: cleanText,
      confidence: provider === 'gemini-vision' ? 99 : 80,
      words: words.slice(0, 40),
      blocks: detectedBlocks,
      lines
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

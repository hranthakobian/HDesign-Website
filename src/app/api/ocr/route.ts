import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';

export const maxDuration = 60; // Allow sufficient time for heavy image OCR processing
export const dynamic = 'force-dynamic';

export interface OcrDetectedBlock {
  id: string;
  text: string;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 normalized coordinates
}

interface GeminiApiResponse {
  fullText: string;
  blocks: OcrDetectedBlock[];
  translation?: string;
  modelUsed: string;
}

const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-flash-lite-latest',
  'gemini-flash-latest'
];

/**
 * Recognize text using Google Gemini Vision (Flash Lite) free tier
 */
async function recognizeWithGemini(
  imageBuffer: Buffer,
  mimeType: string,
  mode: string,
  userApiKey?: string | null
): Promise<GeminiApiResponse | null> {
  const apiKey = (userApiKey && userApiKey.trim().length > 10) 
    ? userApiKey.trim() 
    : (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY);

  if (!apiKey) {
    return null;
  }

  const base64Image = imageBuffer.toString('base64');

  let systemPrompt = '';
  if (mode === 'blocks') {
    systemPrompt = `You are a high-precision OCR engine. Inspect this image and detect every piece of text, title, paragraph, number, table cell, or caption.
Return ONLY a valid JSON object in this exact format:
{
  "fullText": "the entire document text reconstructed cleanly with line breaks",
  "blocks": [
    {
      "text": "text inside this block",
      "box": [ymin, xmin, ymax, xmax]
    }
  ]
}
Coordinates in "box" must be normalized integers between 0 and 1000 representing [ymin, xmin, ymax, xmax]. Do not include markdown wraps or commentary outside the JSON.`;
  } else if (mode === 'armenian_enhanced') {
    systemPrompt = `You are a specialist OCR engine for the Armenian language (Հայոց լեզու), including Armenian modern print, classic typography, decorative fonts, and Armenian handwriting (ձեռագիր).
Pay meticulous attention to Armenian characters, ligatures (և, ու), punctuation marks (։ ՝ ՜ ՛ ՞ « » — –), numbers, and layout.
Transcribe ALL visible text accurately as it appears.
Return ONLY a valid JSON object in this format:
{
  "fullText": "exact transcription with proper line breaks and Armenian punctuation",
  "blocks": [
    {
      "text": "text segment",
      "box": [ymin, xmin, ymax, xmax]
    }
  ]
}
Where "box" is normalized coordinates [ymin, xmin, ymax, xmax] from 0 to 1000.`;
  } else if (mode === 'translate_hy') {
    systemPrompt = `You are an OCR and translation system.
1. Extract and transcribe all visible text in the image exactly as written.
2. Translate the entire extracted text into natural, fluent Armenian (Հայերեն).
Return ONLY a valid JSON object:
{
  "fullText": "original extracted text",
  "translation": "Armenian translation of the text",
  "blocks": [
    {
      "text": "segment text",
      "box": [ymin, xmin, ymax, xmax]
    }
  ]
}
Where "box" is [ymin, xmin, ymax, xmax] from 0 to 1000.`;
  } else if (mode === 'translate_en') {
    systemPrompt = `You are an OCR and translation system.
1. Extract and transcribe all visible text in the image exactly as written.
2. Translate the entire extracted text into fluent English.
Return ONLY a valid JSON object:
{
  "fullText": "original extracted text",
  "translation": "English translation of the text",
  "blocks": [
    {
      "text": "segment text",
      "box": [ymin, xmin, ymax, xmax]
    }
  ]
}
Where "box" is [ymin, xmin, ymax, xmax] from 0 to 1000.`;
  } else {
    // Default full / document mode
    systemPrompt = `You are an advanced Optical Character Recognition (OCR) model powered by Gemini Vision.
Extract and transcribe ALL visible text, labels, logos, numbers, signatures, and signs in this image.
Preserve the reading order, paragraphs, headers, and bullet points verbatim.
Return ONLY a valid JSON object:
{
  "fullText": "complete formatted text verbatim",
  "blocks": [
    {
      "text": "detected line or heading",
      "box": [ymin, xmin, ymax, xmax]
    }
  ]
}
Where "box" coordinates are normalized [ymin, xmin, ymax, xmax] integers from 0 to 1000.`;
  }

  for (const model of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
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
            maxOutputTokens: 4096
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Gemini model ${model} HTTP ${response.status}:`, errorText.slice(0, 200));
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!rawText.trim()) continue;

      // Clean markdown fencing
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      try {
        const parsed = JSON.parse(cleaned);
        const fullText = (typeof parsed.fullText === 'string') 
          ? parsed.fullText.trim() 
          : (Array.isArray(parsed) ? parsed.map((p: any) => p.text || '').join('\n') : cleaned);

        let blocks: OcrDetectedBlock[] = [];
        const rawBlocks = Array.isArray(parsed.blocks) ? parsed.blocks : (Array.isArray(parsed) ? parsed : []);
        
        blocks = rawBlocks
          .map((item: any, idx: number) => {
            const b = Array.isArray(item.box) && item.box.length === 4 ? item.box : [0, 0, 1000, 1000];
            return {
              id: `block-${idx + 1}`,
              text: String(item.text || '').trim(),
              box: [Number(b[0]) || 0, Number(b[1]) || 0, Number(b[2]) || 1000, Number(b[3]) || 1000] as [number, number, number, number]
            };
          })
          .filter((b: OcrDetectedBlock) => b.text.length > 0);

        return {
          fullText,
          blocks,
          translation: parsed.translation ? String(parsed.translation).trim() : undefined,
          modelUsed: model
        };
      } catch (jsonErr) {
        // In case model responded with raw text rather than JSON
        return {
          fullText: rawText.trim(),
          blocks: [],
          modelUsed: model
        };
      }
    } catch (err) {
      console.warn(`Gemini OCR request error on ${model}:`, err);
    }
  }

  return null;
}

/**
 * Fallback OCR using Tesseract if Gemini API is unavailable or quota is exceeded
 */
async function fallbackWithTesseract(imageBuffer: Buffer, langParam: string = 'eng+hye'): Promise<{ fullText: string }> {
  let worker: any = null;
  try {
    const langs = langParam.includes('hye') ? ['hye', 'eng'] : ['eng'];
    const path = await import('path');
    const workerPath = path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js');
    
    worker = await createWorker(langs, 1, {
      workerPath
    });
    const result = await worker.recognize(imageBuffer);
    return { fullText: (result.data?.text || '').trim() };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (_) {}
    }
  }
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const contentType = request.headers.get('content-type') || '';
    let imageBuffer: Buffer | null = null;
    let mimeType = 'image/jpeg';
    let mode = 'full';
    let userApiKey: string | null = null;
    let lang = 'eng+hye';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image') as File | null;
      mode = (formData.get('mode') as string) || 'full';
      userApiKey = formData.get('apiKey') as string | null;
      lang = (formData.get('lang') as string) || 'eng+hye';

      if (!file) {
        return NextResponse.json({ error: 'Նիշքը (image) չի գտնվել' }, { status: 400 });
      }

      mimeType = file.type || 'image/jpeg';
      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      const body = await request.json();
      const { image, mode: bMode, apiKey: bKey, lang: bLang } = body;
      if (bMode) mode = bMode;
      if (bKey) userApiKey = bKey;
      if (bLang) lang = bLang;

      if (!image) {
        return NextResponse.json({ error: 'Նկարի տվյալներ չեն տրամադրվել' }, { status: 400 });
      }

      if (typeof image === 'string') {
        const matches = image.match(/^data:([A-Za-z0-9\-\+\/]+);base64,(.+)$/);
        if (matches && matches[1]) {
          mimeType = matches[1];
          imageBuffer = Buffer.from(matches[2], 'base64');
        } else {
          imageBuffer = Buffer.from(image, 'base64');
        }
      }
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      return NextResponse.json({ error: 'Անվավեր նկարի տվյալներ' }, { status: 400 });
    }

    // 1. Try Gemini Flash Lite Vision
    let geminiRes = await recognizeWithGemini(imageBuffer, mimeType, mode, userApiKey);
    let provider = 'gemini-vision';
    let text = '';
    let translation: string | undefined = undefined;
    let blocks: OcrDetectedBlock[] = [];
    let modelName = 'gemini-3.5-flash-lite';

    if (geminiRes && geminiRes.fullText && geminiRes.fullText.trim().length > 0) {
      text = geminiRes.fullText.trim();
      blocks = geminiRes.blocks;
      translation = geminiRes.translation;
      modelName = geminiRes.modelUsed;
    } else {
      // 2. Fallback to Tesseract OCR
      try {
        const fallbackRes = await fallbackWithTesseract(imageBuffer, lang);
        text = fallbackRes.fullText;
        provider = 'tesseract-fallback';
        modelName = 'Tesseract OCR Engine';
      } catch (tessErr: any) {
        return NextResponse.json({ 
          error: 'Տեքստի ճանաչումը ձախողվեց (Gemini & Tesseract): ' + (tessErr?.message || '') 
        }, { status: 500 });
      }
    }

    const processingTimeMs = Date.now() - startTime;
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);

    return NextResponse.json({
      success: true,
      provider,
      model: modelName,
      text,
      translation,
      blocks,
      stats: {
        characters: text.length,
        words: words.length,
        lines: lines.length,
        processingTimeMs
      }
    });

  } catch (error: any) {
    console.error('OCR Route Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Անսպասելի սխալ OCR գործընթացում' },
      { status: 500 }
    );
  }
}

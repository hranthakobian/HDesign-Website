import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'HDesign';
    const subtitle = searchParams.get('subtitle') || 'Դիզայնի և Բրենդավորման Ստուդիա';
    const category = searchParams.get('category') || 'HDesign Studio';
    let rawBg = searchParams.get('bg') || '#083f39';
    if (rawBg.includes(' | ')) {
      rawBg = rawBg.split(' | ')[0].trim();
    }
    const bg = rawBg.startsWith('#') ? rawBg : '#083f39';

    // Load local font to correctly render Armenian glyphs in Satori
    let fontData: Buffer | null = null;
    try {
      const fontPath = path.join(process.cwd(), 'public', 'HDesign.ttf');
      if (fs.existsSync(fontPath)) {
        fontData = fs.readFileSync(fontPath);
      }
    } catch {}

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#0a0a0c',
            padding: '60px 80px',
            fontFamily: fontData ? 'HDesign, sans-serif' : 'sans-serif',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-150px',
              right: '-150px',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: bg,
              filter: 'blur(120px)',
              opacity: 0.45,
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '24px',
                color: '#000000',
              }}
            >
              H
            </div>
            <span
              style={{
                color: '#ffffff',
                fontSize: '28px',
                fontWeight: 800,
                letterSpacing: '-0.5px',
              }}
            >
              HDesign
            </span>
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '24px',
                margin: '0 8px',
              }}
            >
              •
            </span>
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '20px',
                fontWeight: 500,
              }}
            >
              {category}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxWidth: '950px',
              zIndex: 10,
            }}
          >
            <h1
              style={{
                fontSize: title.length > 35 ? '52px' : '68px',
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.15,
                margin: 0,
                letterSpacing: '-1.5px',
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                style={{
                  fontSize: '24px',
                  color: 'rgba(255, 255, 255, 0.75)',
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              paddingTop: '28px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '18px',
              fontWeight: 500,
            }}
          >
            <span>hakobian.am</span>
            <span>Դիզայնի և Բրենդավորման Ստուդիա</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        ...(fontData
          ? {
              fonts: [
                {
                  name: 'HDesign',
                  data: fontData,
                  style: 'normal',
                  weight: 700,
                },
              ],
            }
          : {}),
      }
    );
  } catch (e: any) {
    // Graceful fallback to static high-res branded OG image
    try {
      const fallbackPath = path.join(process.cwd(), 'public', 'og-image.png');
      const imgBuffer = fs.readFileSync(fallbackPath);
      return new Response(imgBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch {
      return new Response(`Failed to generate OG image: ${e.message}`, { status: 500 });
    }
  }
}

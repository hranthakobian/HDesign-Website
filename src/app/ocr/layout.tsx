import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/seo';

const siteUrl = getSiteUrl();
const pageUrl = `${siteUrl}/ocr`;
const ogImage = `${siteUrl}/og-image.png`;

export const metadata: Metadata = {
  title: 'Հայերեն OCR Ընթերցիչ | HDesign',
  description: 'Առանձնացված հայերեն OCR ընթերցիչ՝ Google Gemini Vision տեխնոլոգիայով։ Ճանաչեք տեքստերը նկարներից և PDF փաստաթղթերից։',
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'hy_AM',
    alternateLocale: ['en_US'],
    url: pageUrl,
    title: 'Հայերեն OCR Ընթերցիչ | HDesign',
    description: 'Առանձնացված հայերեն OCR ընթերցիչ՝ Google Gemini Vision տեխնոլոգիայով։',
    siteName: 'HDesign',
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: 'HDesign OCR Reader',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Հայերեն OCR Ընթերցիչ | HDesign',
    description: 'Առանձնացված հայերեն OCR ընթերցիչ՝ Google Gemini Vision տեխնոլոգիայով։',
    images: [ogImage],
    creator: '@hranthakobian'
  }
};

export default function OcrLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

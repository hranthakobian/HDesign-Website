import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OCR Reader | Gemini Flash Lite Vision',
  description: 'Առանձնացված OCR ընթերցիչ՝ Google Gemini Flash Lite Vision անվճար տեխնոլոգիայով։',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function OcrLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

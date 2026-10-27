import type { Metadata } from 'next';
import { getSectionPageMetadata } from '@/lib/seo';

export const metadata: Metadata = getSectionPageMetadata(
  'Տառատեսակներ | HDesign',
  'Հեղինակային հայերեն և լատինատառ տառատեսակներ, փոփոխական (Variable) ֆոնտեր և տպագրական լուծումներ։',
  '/fonts'
);

export default function FontsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

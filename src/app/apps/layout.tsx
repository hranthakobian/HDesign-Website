import type { Metadata } from 'next';
import { getSectionPageMetadata } from '@/lib/seo';

export const metadata: Metadata = getSectionPageMetadata(
  'Հավելվածներ և Փլագիններ | HDesign',
  'Adobe Illustrator-ի, InDesign-ի և Photoshop-ի մասնագիտացված ընդլայնումներ ու գործիքներ դիզայներների համար։',
  '/apps'
);

export default function AppsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

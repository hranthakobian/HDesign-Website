import type { Metadata } from 'next';
import { getSectionPageMetadata } from '@/lib/seo';

export const metadata: Metadata = getSectionPageMetadata(
  'HDesign — Դիզայն Համակարգ',
  'HDesign-ի դիզայն համակարգի փաստաթղթավորում, բաղադրիչներ, տառատեսակներ և վիզուալ ուղեցույցներ։',
  '/hdesign'
);

export default function HDesignLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

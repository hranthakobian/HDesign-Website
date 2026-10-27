import type { Metadata } from 'next';
import { getSectionPageMetadata } from '@/lib/seo';

export const metadata: Metadata = getSectionPageMetadata(
  'Նախագծեր — Պորտֆոլիո | HDesign',
  'Ծանոթացեք մեր իրականացրած բրենդավորման, գրաֆիկական դիզայնի և վիզուալ հաղորդակցության նախագծերին։',
  '/works'
);

export default function WorksLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

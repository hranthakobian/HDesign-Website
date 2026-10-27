import type { Metadata } from 'next';
import { getSectionPageMetadata } from '@/lib/seo';

export const metadata: Metadata = getSectionPageMetadata(
  'Կապ Մեզ Հետ | HDesign',
  'Կապվեք HDesign ստուդիայի հետ՝ բրենդավորման, հավելվածների մշակման կամ համագործակցության համար։',
  '/contact'
);

export default function ContactLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

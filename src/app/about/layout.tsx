import type { Metadata } from 'next';
import { getSectionPageMetadata } from '@/lib/seo';

export const metadata: Metadata = getSectionPageMetadata(
  'Մեր Մասին | HDesign',
  'HDesign ստուդիայի պատմությունը, փիլիսոփայությունը և մոտեցումները ժամանակակից դիզայնի և ծրագրային գործիքների ստեղծման գործում։',
  '/about'
);

export default function AboutLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from 'next';
import { getFontMetadata } from '@/lib/seo';

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return await getFontMetadata(id);
}

export default function FontDetailLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

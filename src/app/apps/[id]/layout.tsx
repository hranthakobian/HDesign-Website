import type { Metadata } from 'next';
import { getAppMetadata } from '@/lib/seo';

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return await getAppMetadata(id);
}

export default function AppDetailLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

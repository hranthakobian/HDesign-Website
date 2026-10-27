import type { Metadata } from 'next';
import { getCaseMetadata } from '@/lib/seo';

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return await getCaseMetadata(id);
}

export default function WorkCaseLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

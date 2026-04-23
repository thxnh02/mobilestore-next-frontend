import { OrderDetailClient } from '@/components/OrderDetailClient';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="container"><OrderDetailClient id={Number(id)} /></div>;
}

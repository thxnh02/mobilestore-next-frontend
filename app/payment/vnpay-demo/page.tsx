import Link from 'next/link';
import { formatMoney } from '@/lib/utils';

export default async function VNPayDemoPage({ searchParams }: { searchParams: Promise<{ orderId?: string; amount?: string }> }) {
  const params = await searchParams;
  const orderId = params.orderId || '';
  const amount = Number(params.amount || 0);

  return (
    <div className="container">
      <div className="card sectionPad stack16">
        <span className="tag warning">VNPay</span>
        <h1>Thông tin thanh toán VNPAY</h1>
        <p className="muted">Đơn hàng đã được ghi nhận. Vui lòng kiểm tra lại số tiền và mở chi tiết đơn hàng để theo dõi trạng thái thanh toán.</p>
        <div className="miniCard">
          <strong>Order ID:</strong> {orderId || '-'}
          <strong>Số tiền:</strong> {formatMoney(amount)}
        </div>
        <div className="row gap12 wrap">
          {orderId && <Link href={`/orders/${orderId}`} className="primaryBtn">Xem đơn hàng</Link>}
          <Link href="/orders" className="ghostBtn">Danh sách đơn</Link>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { formatMoney } from '@/lib/utils';

type Params = Promise<{
  success?: string;
  message?: string;
  responseCode?: string;
  transactionStatus?: string;
  orderId?: string;
  paymentId?: string;
  orderCode?: string;
  paymentCode?: string;
  amount?: string;
  paymentStatus?: string;
  orderStatus?: string;
  bankCode?: string;
  transactionNo?: string;
}>;

export default async function VnPayReturnPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const success = params.success === 'true';
  const amount = Number(params.amount || 0);
  const orderId = params.orderId || '';
  const title = success ? 'Thanh toán VNPay thành công' : 'Thanh toán VNPay chưa hoàn tất';

  return (
    <div className="container">
      <div className="card sectionPad stack16">
        <span className={`tag ${success ? '' : 'warning'}`}>{success ? 'Success' : 'Pending / Failed'}</span>
        <h1>{title}</h1>
        <p className="muted">{params.message || 'Không có thông tin phản hồi từ hệ thống.'}</p>

        <div className="miniCard stack12">
          <p><strong>Order ID:</strong> {orderId || '-'}</p>
          <p><strong>Order Code:</strong> {params.orderCode || '-'}</p>
          <p><strong>Payment ID:</strong> {params.paymentId || '-'}</p>
          <p><strong>Payment Code:</strong> {params.paymentCode || '-'}</p>
          <p><strong>Số tiền:</strong> {formatMoney(amount)}</p>
          <p><strong>Payment Status:</strong> {params.paymentStatus || '-'}</p>
          <p><strong>Order Status:</strong> {params.orderStatus || '-'}</p>
          <p><strong>VNPay ResponseCode:</strong> {params.responseCode || '-'}</p>
          <p><strong>VNPay TransactionStatus:</strong> {params.transactionStatus || '-'}</p>
          <p><strong>Bank Code:</strong> {params.bankCode || '-'}</p>
          <p><strong>Transaction No:</strong> {params.transactionNo || '-'}</p>
        </div>

        <p className="muted">
          Nếu bạn vừa thanh toán xong nhưng trạng thái vẫn Pending, hãy mở lại chi tiết đơn hàng sau vài giây để chờ IPN cập nhật.
        </p>

        <div className="row gap12 wrap">
          {orderId && <Link href={`/orders/${orderId}`} className="primaryBtn">Xem chi tiết đơn hàng</Link>}
          <Link href="/orders" className="ghostBtn">Danh sách đơn hàng</Link>
          <Link href="/products" className="ghostBtn">Tiếp tục mua sắm</Link>
        </div>
      </div>
    </div>
  );
}

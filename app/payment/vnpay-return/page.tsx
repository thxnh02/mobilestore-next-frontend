import Link from 'next/link';
import { cn, formatMoney } from '@/lib/utils';

type VnPayReturnParams = Promise<{
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

type ResultView = {
  kind: 'success' | 'cancelled' | 'failed';
  badge: string;
  title: string;
  lead: string;
  note: string;
  tagClass: string;
  mark: string;
};

function getResultView(params: Awaited<VnPayReturnParams>): ResultView {
  const responseCode = params.responseCode || '';
  const transactionStatus = params.transactionStatus || '';
  const paymentStatus = (params.paymentStatus || '').toLowerCase();
  const isSuccess =
    params.success === 'true' ||
    paymentStatus === 'paid' ||
    (responseCode === '00' && transactionStatus === '00');
  const isCancelled = responseCode === '24' || paymentStatus === 'cancelled';

  if (isSuccess) {
    return {
      kind: 'success',
      badge: 'Thanh toán thành công',
      title: 'Thanh toán VNPay thành công',
      lead: 'Cảm ơn bạn. Giao dịch đã được VNPay xác nhận thành công.',
      note: 'Nếu trạng thái đơn hàng vẫn đang cập nhật, hệ thống có thể cần thêm vài giây để nhận IPN từ VNPay.',
      tagClass: 'success',
      mark: 'OK',
    };
  }

  if (isCancelled) {
    return {
      kind: 'cancelled',
      badge: 'Người dùng đã hủy',
      title: 'Bạn đã hủy thanh toán',
      lead: 'Giao dịch VNPay đã được hủy theo thao tác của bạn. Đơn hàng chưa được thanh toán.',
      note: 'Bạn có thể quay lại chi tiết đơn hàng để thanh toán lại qua VNPay hoặc chọn phương thức khác nếu cần.',
      tagClass: 'warning',
      mark: '!',
    };
  }

  return {
    kind: 'failed',
    badge: 'Chưa hoàn tất',
    title: 'Thanh toán VNPay chưa hoàn tất',
    lead: 'Giao dịch chưa được ghi nhận thành công. Vui lòng kiểm tra lại thông tin bên dưới.',
    note: 'Nếu tiền đã bị trừ nhưng đơn hàng chưa cập nhật, hãy chờ vài phút rồi mở lại chi tiết đơn hàng.',
    tagClass: 'danger',
    mark: '!',
  };
}

export default async function VnPayReturnPage({ searchParams }: { searchParams: VnPayReturnParams }) {
  const params = await searchParams;
  const view = getResultView(params);
  const amount = Number(params.amount || 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const orderId = params.orderId || '';
  const message = params.message || view.lead;
  const details = [
    ['Mã đơn hàng', params.orderCode || orderId],
    ['Mã thanh toán', params.paymentCode || params.paymentId],
    ['Số tiền', safeAmount > 0 ? formatMoney(safeAmount) : '-'],
    ['Trạng thái thanh toán', params.paymentStatus],
    ['Trạng thái đơn hàng', params.orderStatus],
    ['Mã phản hồi VNPay', params.responseCode],
    ['Trạng thái giao dịch VNPay', params.transactionStatus],
    ['Ngân hàng', params.bankCode],
    ['Mã giao dịch VNPay', params.transactionNo],
  ];

  return (
    <div className="container paymentResultShell">
      <section className={cn('paymentResultCard', `paymentResult-${view.kind}`)}>
        <div className="paymentResultGlow" />
        <div className="paymentResultHeader">
          <div className={cn('paymentResultMark', `paymentResultMark-${view.kind}`)}>{view.mark}</div>
          <div className="stack12">
            <span className={cn('tag', view.tagClass)}>{view.badge}</span>
            <h1>{view.title}</h1>
            <p className="large">{message}</p>
          </div>
        </div>

        <div className="paymentResultGrid">
          <div className="paymentResultSummary">
            <span>Đơn hàng</span>
            <strong>{params.orderCode || (orderId ? `#${orderId}` : '-')}</strong>
            <p>{safeAmount > 0 ? formatMoney(safeAmount) : 'Chưa có số tiền trả về'}</p>
          </div>

          <div className="paymentResultDetails">
            {details.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value || '-'}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="paymentResultNote">
          <strong>Lưu ý</strong>
          <p>{view.note}</p>
        </div>

        <div className="paymentResultActions">
          {orderId && (
            <Link href={`/orders/${orderId}`} className="primaryBtn">
              Xem chi tiết đơn hàng
            </Link>
          )}
          <Link href="/orders" className="ghostBtn">
            Danh sách đơn hàng
          </Link>
          <Link href="/products" className="ghostBtn">
            Tiếp tục mua sắm
          </Link>
        </div>
      </section>
    </div>
  );
}

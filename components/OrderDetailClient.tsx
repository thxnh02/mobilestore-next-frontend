'use client';

import { useEffect, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components/Feedback';
import { api } from '@/lib/api';
import { Order } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

export function OrderDetailClient({ id }: { id: number }) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const canCancel = order?.orderStatus === 'Pending' || order?.orderStatus === 'Confirmed';
  const canRetryVnpay =
    order?.paymentMethod === 'VNPAY' &&
    order?.orderStatus !== 'Cancelled' &&
    (order?.paymentStatus === 'Pending' || order?.paymentStatus === 'Failed' || order?.paymentStatus === 'Cancelled');

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      setOrder(await api.getOrderDetail(token, id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được chi tiết đơn hàng.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token, id]);

  async function cancelOrder() {
    if (!token || !order) return;
    try {
      const updated = await api.cancelOrder(token, order.id, reason.trim() || undefined);
      setOrder(updated);
      toast({ type: 'success', title: 'Đã hủy đơn hàng' });
    } catch (err) {
      toast({ type: 'error', title: 'Không hủy được đơn hàng', message: err instanceof Error ? err.message : undefined });
    }
  }

  async function retryVnpay() {
    if (!token || !order) return;
    try {
      setPaying(true);
      const response = await api.createVnpayPaymentUrl(token, { orderId: order.id, locale: 'vn' });
      window.location.assign(response.paymentUrl);
    } catch (err) {
      toast({ type: 'error', title: 'Không tạo được link VNPay', message: err instanceof Error ? err.message : undefined });
    } finally {
      setPaying(false);
    }
  }

  if (!token) return <EmptyState title="Cần đăng nhập" message="Hãy đăng nhập để xem đơn hàng." href="/login?next=/orders" action="Đăng nhập" />;
  if (loading) return <LoadingState title="Đang tải đơn hàng..." rows={4} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!order) return <EmptyState title="Không tìm thấy đơn hàng" href="/orders" action="Quay lại danh sách" />;

  return (
    <div className="stack24">
      <section className="card sectionPad stack12">
        <h1>Đơn {order.orderCode}</h1>
        <div className="row gap16 wrap">
          <span className="tag warning">{order.orderStatus}</span>
          <span className="tag">{order.paymentStatus}</span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
        <p className="muted">{order.shippingAddress}</p>
      </section>

      <section className="card sectionPad">
        <h2>Sản phẩm</h2>
        <div className="stack12">
          {order.items.map((item) => (
            <div key={item.id} className="row between center wrap gap12">
              <div><strong>{item.productName}</strong><p className="muted">x{item.quantity} · {formatMoney(item.unitPrice)}</p></div>
              <div className="price">{formatMoney(item.lineTotal)}</div>
            </div>
          ))}
        </div>
      </section>

      {order.payment && (
        <section className="card sectionPad stack12">
          <h2>Thanh toán</h2>
          <p>Mã thanh toán: {order.payment.paymentCode}</p>
          <p>Phương thức: {order.payment.paymentMethod}</p>
          <p>Trạng thái: {order.payment.paymentStatus}</p>
          <p className="price">{formatMoney(order.payment.amount)}</p>

          {canRetryVnpay && (
            <button className="primaryBtn" onClick={retryVnpay} disabled={paying}>
              {paying ? 'Đang chuyển sang VNPay...' : 'Thanh toán lại qua VNPay'}
            </button>
          )}
        </section>
      )}

      {canCancel && (
        <section className="card sectionPad stack12">
          <h2>Hủy đơn</h2>
          <textarea className="input textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Lý do hủy (không bắt buộc)" maxLength={300} />
          <button className="dangerBtn" onClick={cancelOrder}>Hủy đơn hàng</button>
        </section>
      )}
    </div>
  );
}

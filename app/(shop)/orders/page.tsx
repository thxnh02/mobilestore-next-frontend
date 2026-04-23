'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components/Feedback';
import { api } from '@/lib/api';
import { Order } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      setOrders(await api.getMyOrders(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được đơn hàng.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [token]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((x) => String(x.orderStatus).toLowerCase().includes('pending')).length,
      paid: orders.filter((x) => String(x.paymentStatus).toLowerCase().includes('paid')).length,
    };
  }, [orders]);

  if (!token) return <div className="container"><EmptyState title="Đăng nhập để xem đơn hàng" message="Theo dõi trạng thái xử lý, phương thức thanh toán và chi tiết từng đơn trong tài khoản của bạn." href="/login?next=/orders" action="Đăng nhập" /></div>;
  if (loading) return <div className="container"><LoadingState title="Đang tải đơn hàng..." rows={5} /></div>;
  if (error) return <div className="container"><ErrorState message={error} onRetry={() => void load()} /></div>;

  return (
    <div className="container stack24">
      <section className="card sectionPad stack16">
        <div className="sectionTitle">
          <h1>Đơn hàng của tôi</h1>
          <p className="muted">Xem lại toàn bộ đơn đã đặt, trạng thái xử lý và tình trạng thanh toán trong một nơi duy nhất.</p>
        </div>
        <div className="row gap8 wrap">
          <span className="tabChip">{stats.total} đơn hàng</span>
          <span className="tabChip">{stats.pending} đơn đang xử lý</span>
          <span className="tabChip">{stats.paid} đơn đã thanh toán</span>
        </div>
      </section>

      {orders.length ? (
        <div className="stack16">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="card sectionPad orderLink">
              <div>
                <strong>{order.orderCode}</strong>
                <p className="muted">{formatDate(order.createdAt)}</p>
                <p className="muted small">{order.recipientName} • {order.phoneNumber}</p>
              </div>
              <div className="stack12">
                <span className="tag warning">{order.orderStatus}</span>
                <span className="muted small">{order.paymentStatus}</span>
              </div>
              <div className="price">{formatMoney(order.totalAmount)}</div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="Bạn chưa có đơn hàng nào" message="Khi hoàn tất một đơn mua hàng, toàn bộ chi tiết sẽ xuất hiện tại đây để bạn theo dõi dễ dàng." href="/products" action="Bắt đầu mua sắm" />
      )}
    </div>
  );
}

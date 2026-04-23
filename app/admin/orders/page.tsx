'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmptyState, LoadingState, ErrorState } from '@/components/Feedback';
import { api } from '@/lib/api';
import { Order } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

const statuses = ['Pending', 'Confirmed', 'Shipping', 'Completed', 'Cancelled'];

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      setOrders(await api.getAdminOrders(token));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không tải được đơn hàng';
      setError(message);
      toast({ type: 'error', title: 'Không tải được orders', message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  async function update(id: number, orderStatus: string) {
    if (!token) return;
    try {
      await api.updateOrderStatus(token, id, orderStatus);
      setOrders((current) => current.map((order) => order.id === id ? { ...order, orderStatus } : order));
      toast({ type: 'success', title: 'Đã cập nhật trạng thái đơn' });
    } catch (err) {
      toast({ type: 'error', title: 'Không cập nhật được', message: err instanceof Error ? err.message : undefined });
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesKeyword = `${order.orderCode} ${order.customerUsername} ${order.customerEmail} ${order.recipientName}`.toLowerCase().includes(keyword.trim().toLowerCase());
      const matchesStatus = statusFilter === 'All' || order.orderStatus === statusFilter;
      return matchesKeyword && matchesStatus;
    });
  }, [orders, keyword, statusFilter]);

  const summary = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((item) => item.orderStatus === 'Pending').length,
    shipping: orders.filter((item) => item.orderStatus === 'Shipping').length,
    completed: orders.filter((item) => item.orderStatus === 'Completed').length,
  }), [orders]);

  if (loading) return <LoadingState title="Đang tải đơn hàng..." rows={6} />;
  if (error && !orders.length) return <ErrorState title="Không tải được đơn hàng" message={error} onRetry={load} />;

  return (
    <div className="stack24">
      <section className="adminSectionIntro">
        <div>
          <p className="eyebrow">Quản lý đơn hàng</p>
          <h2>Theo dõi và xử lý vòng đời đơn mua</h2>
          <p className="muted">Cập nhật trạng thái xử lý và quan sát nhanh tình trạng thanh toán của từng đơn.</p>
        </div>
        <div className="adminQuickGrid">
          <div className="miniCard"><span>Tổng đơn</span><strong>{summary.total}</strong></div>
          <div className="miniCard"><span>Chờ xác nhận</span><strong>{summary.pending}</strong></div>
          <div className="miniCard"><span>Đang giao</span><strong>{summary.shipping}</strong></div>
          <div className="miniCard"><span>Hoàn thành</span><strong>{summary.completed}</strong></div>
        </div>
      </section>

      <section className="card sectionPad stack16">
        <div className="row between center wrap gap12">
          <div>
            <h2>Danh sách đơn hàng</h2>
            <p className="muted">Tìm nhanh theo mã đơn, khách hàng, email hoặc người nhận.</p>
          </div>
          <span className="tag">Hiển thị {filteredOrders.length} / {orders.length}</span>
        </div>

        <div className="adminToolbar">
          <input className="input" placeholder="Tìm theo mã đơn, khách hàng, email..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">Tất cả trạng thái</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        {filteredOrders.length ? (
          <div className="stack12">
            {filteredOrders.map((order) => (
              <div key={order.id} className="adminListRow adminOrderRowCard">
                <div className="adminOrderMeta adminCellGrow">
                  <strong>{order.orderCode}</strong>
                  <p className="muted">{order.customerUsername} · {order.customerEmail}</p>
                  <p className="muted small">Người nhận: {order.recipientName} · {formatDate(order.createdAt)}</p>
                </div>

                <div className="stack12 adminOrderStatusBox">
                  <span className={`tag ${mapStatusTone(order.paymentStatus)}`}>{order.paymentStatus}</span>
                  <span className={`tag ${mapStatusTone(order.orderStatus)}`}>{order.orderStatus}</span>
                </div>

                <div className="adminOrderRight">
                  <div className="price">{formatMoney(order.totalAmount)}</div>
                  <select className="input" value={order.orderStatus} onChange={(e) => update(order.id, e.target.value)}>
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        ) : <EmptyState title="Chưa có đơn phù hợp" message="Thử thay đổi từ khóa hoặc bộ lọc trạng thái." />}
      </section>
    </div>
  );
}

function mapStatusTone(status?: string) {
  const value = (status || '').toLowerCase();
  if (['paid', 'completed', 'confirmed', 'delivered'].includes(value)) return 'success';
  if (['pending', 'shipping', 'processing'].includes(value)) return 'warning';
  if (['cancelled', 'failed', 'refunded'].includes(value)) return 'danger';
  return '';
}

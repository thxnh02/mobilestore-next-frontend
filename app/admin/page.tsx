'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { AdminOverview } from '@/lib/types';
import { formatMoney } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { ErrorState, LoadingState } from '@/components/Feedback';

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      setData(await api.getAdminOverview(token));
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Không tải được dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [token]);

  const avgOrderValue = useMemo(() => {
    if (!data?.summary.totalOrders) return 0;
    return data.summary.paidRevenue / data.summary.totalOrders;
  }, [data]);

  if (loading) return <LoadingState title="Đang tải số liệu quản trị..." rows={8} />;
  if (!data) return <ErrorState title="Không tải được dashboard" message={error} onRetry={load} />;

  return (
    <div className="stack24">
      <section className="adminHeroCard">
        <div>
          <p className="eyebrow">Tổng quan vận hành</p>
          <h2>Dashboard bán hàng hôm nay</h2>
          <p className="muted adminHeroText">Theo dõi hiệu suất kinh doanh, tình trạng xử lý đơn và các module mới như coupon, flash sale, biến thể sản phẩm.</p>
        </div>
        <div className="row gap12 wrap">
          <Link href="/admin/coupons" className="ghostBtn">Quản lý coupon</Link>
          <Link href="/admin/flash-sales" className="ghostBtn">Quản lý flash sale</Link>
          <Link href="/admin/products" className="primaryBtn">Quản lý sản phẩm</Link>
        </div>
      </section>

      <section className="adminStatsGrid">
        <article className="adminStatCard primary"><span>Doanh thu</span><strong>{formatMoney(data.summary.paidRevenue)}</strong></article>
        <article className="adminStatCard neutral"><span>Tổng đơn</span><strong>{data.summary.totalOrders}</strong></article>
        <article className="adminStatCard neutral"><span>Khách hàng</span><strong>{data.summary.totalUsers}</strong></article>
        <article className="adminStatCard neutral"><span>Giá trị TB / đơn</span><strong>{formatMoney(avgOrderValue)}</strong></article>
      </section>

<section className="card sectionPad stack16">
  <h2>Đơn hàng gần đây</h2>
  <div className="stack12">
    {data.recentOrders.map((order, index) => (
      <div
        key={`${order.id ?? order.orderCode ?? 'order'}-${index}`}
        className="adminListRow adminOrderRow"
      >
        <div>
          <strong>{order.orderCode}</strong>
          <p className="muted">{order.recipientName || order.customerUsername || order.customerEmail}</p>
        </div>
        <span className="tag">{order.orderStatus}</span>
        <span className="tag">{order.paymentStatus}</span>
        <div className="price">{formatMoney(order.totalAmount)}</div>
      </div>
    ))}
  </div>
</section>
    </div>
  );
}

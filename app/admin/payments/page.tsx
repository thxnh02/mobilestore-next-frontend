'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmptyState, LoadingState, ErrorState } from '@/components/Feedback';
import { api } from '@/lib/api';
import { Payment } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

const statuses = ['Unpaid', 'Pending', 'Paid', 'Failed', 'Cancelled', 'Refunded'];

export default function AdminPaymentsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      setPayments(await api.getAdminPayments(token));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không tải được thanh toán';
      setError(message);
      toast({ type: 'error', title: 'Không tải được payments', message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  async function update(id: number, status: string) {
    if (!token) return;
    try {
      await api.updatePaymentStatus(token, id, { status, provider: 'Admin' });
      setPayments((current) => current.map((payment) => payment.id === id ? { ...payment, status } : payment));
      toast({ type: 'success', title: 'Đã cập nhật thanh toán' });
    } catch (err) {
      toast({ type: 'error', title: 'Không cập nhật được', message: err instanceof Error ? err.message : undefined });
    }
  }

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesKeyword = `${payment.paymentCode} ${payment.orderCode} ${payment.customerUsername} ${payment.customerEmail} ${payment.transactionCode || ''}`.toLowerCase().includes(keyword.trim().toLowerCase());
      const matchesStatus = statusFilter === 'All' || payment.status === statusFilter;
      const matchesMethod = methodFilter === 'All' || payment.paymentMethod === methodFilter;
      return matchesKeyword && matchesStatus && matchesMethod;
    });
  }, [payments, keyword, statusFilter, methodFilter]);

  const methods = useMemo(() => Array.from(new Set(payments.map((payment) => payment.paymentMethod))).filter(Boolean), [payments]);
  const summary = useMemo(() => ({
    total: payments.length,
    paid: payments.filter((item) => item.status === 'Paid').length,
    pending: payments.filter((item) => item.status === 'Pending').length,
    revenuePaid: payments.filter((item) => item.status === 'Paid').reduce((sum, item) => sum + item.amount, 0),
  }), [payments]);

  if (loading) return <LoadingState title="Đang tải thanh toán..." rows={6} />;
  if (error && !payments.length) return <ErrorState title="Không tải được thanh toán" message={error} onRetry={load} />;

  return (
    <div className="stack24">
      <section className="adminSectionIntro">
        <div>
          <p className="eyebrow">Quản lý thanh toán</p>
          <h2>Đối soát trạng thái COD / VNPay</h2>
          <p className="muted">Theo dõi mã thanh toán, phương thức thanh toán, giao dịch và cập nhật trạng thái khi cần.</p>
        </div>
        <div className="adminQuickGrid">
          <div className="miniCard"><span>Tổng payment</span><strong>{summary.total}</strong></div>
          <div className="miniCard"><span>Đã thanh toán</span><strong>{summary.paid}</strong></div>
          <div className="miniCard"><span>Đang chờ</span><strong>{summary.pending}</strong></div>
          <div className="miniCard"><span>Doanh thu đã thu</span><strong>{formatMoney(summary.revenuePaid)}</strong></div>
        </div>
      </section>

      <section className="card sectionPad stack16">
        <div className="row between center wrap gap12">
          <div>
            <h2>Danh sách thanh toán</h2>
            <p className="muted">Lọc theo mã payment, mã đơn, người mua hoặc transaction code.</p>
          </div>
          <span className="tag">Hiển thị {filteredPayments.length} / {payments.length}</span>
        </div>

        <div className="adminToolbar adminToolbar3">
          <input className="input" placeholder="Tìm theo mã payment, order, user, transaction..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">Tất cả trạng thái</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select className="input" value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
            <option value="All">Tất cả phương thức</option>
            {methods.map((method) => <option key={method} value={method}>{method}</option>)}
          </select>
        </div>

        {filteredPayments.length ? (
          <div className="stack12">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="adminListRow adminPaymentRow">
                <div className="adminCellGrow">
                  <strong>{payment.paymentCode}</strong>
                  <p className="muted">{payment.orderCode} · {payment.customerUsername}</p>
                  <p className="muted small">{formatDate(payment.createdAt)}{payment.transactionCode ? ` · GD: ${payment.transactionCode}` : ''}</p>
                </div>

                <div className="stack12">
                  <span className="tag">{payment.paymentMethod}</span>
                  <span className={`tag ${mapStatusTone(payment.status)}`}>{payment.status}</span>
                </div>

                <div className="adminPaymentSide">
                  <div className="price">{formatMoney(payment.amount)}</div>
                  <select className="input" value={payment.status} onChange={(e) => update(payment.id, e.target.value)}>
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        ) : <EmptyState title="Chưa có payment phù hợp" message="Thử thay đổi từ khóa, trạng thái hoặc phương thức thanh toán." />}
      </section>
    </div>
  );
}

function mapStatusTone(status?: string) {
  const value = (status || '').toLowerCase();
  if (['paid', 'completed', 'confirmed'].includes(value)) return 'success';
  if (['pending', 'unpaid'].includes(value)) return 'warning';
  if (['cancelled', 'failed', 'refunded'].includes(value)) return 'danger';
  return '';
}

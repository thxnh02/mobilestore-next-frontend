'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components/Feedback';
import { api } from '@/lib/api';
import { Coupon, CouponInput } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

const emptyForm: CouponInput = {
  code: '',
  name: '',
  description: '',
  discountType: 'Percent',
  discountValue: 10,
  minOrderAmount: 0,
  maxDiscountAmount: null,
  totalUsageLimit: null,
  perUserUsageLimit: 1,
  isActive: true,
  startsAtUtc: '',
  endsAtUtc: '',
};

export default function AdminCouponsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState<CouponInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      setCoupons(await api.getAdminCoupons(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được coupon.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      setSubmitting(true);
      const payload = normalize(form);
      if (editingId) await api.updateCoupon(token, editingId, payload);
      else await api.createCoupon(token, payload);
      toast({ type: 'success', title: editingId ? 'Đã cập nhật coupon' : 'Đã tạo coupon' });
      setForm(emptyForm); setEditingId(null); await load();
    } catch (err) {
      toast({ type: 'error', title: 'Không lưu được coupon', message: err instanceof Error ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  function edit(coupon: Coupon) {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      discountType: coupon.discountType === 'Amount' ? 'Amount' : 'Percent',
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount || null,
      totalUsageLimit: coupon.totalUsageLimit || null,
      perUserUsageLimit: coupon.perUserUsageLimit || null,
      isActive: coupon.isActive,
      startsAtUtc: coupon.startsAtUtc ? toDateInput(coupon.startsAtUtc) : '',
      endsAtUtc: coupon.endsAtUtc ? toDateInput(coupon.endsAtUtc) : '',
    });
  }

  async function remove(id: number) {
    if (!token) return;
    if (!window.confirm('Xóa coupon này?')) return;
    await api.deleteCoupon(token, id);
    await load();
  }

  const filtered = useMemo(() => coupons.filter((coupon) => `${coupon.code} ${coupon.name}`.toLowerCase().includes(keyword.trim().toLowerCase())), [coupons, keyword]);

  if (loading) return <LoadingState title="Đang tải coupon..." rows={6} />;
  if (error && !coupons.length) return <ErrorState title="Không tải được coupon" message={error} onRetry={load} />;

  return (
    <div className="stack24">
      <section className="card sectionPad stack16">
        <h2>{editingId ? 'Cập nhật coupon' : 'Tạo coupon mới'}</h2>
        <form className="grid formGrid" onSubmit={submit}>
          <input className="input" placeholder="Mã coupon" value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} />
          <input className="input" placeholder="Tên chương trình" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          <select className="input" value={form.discountType} onChange={(e) => setForm((prev) => ({ ...prev, discountType: e.target.value as CouponInput['discountType'] }))}><option value="Percent">Giảm theo %</option><option value="Amount">Giảm số tiền</option></select>
          <input className="input" type="number" placeholder="Giá trị giảm" value={form.discountValue} onChange={(e) => setForm((prev) => ({ ...prev, discountValue: Number(e.target.value) }))} />
          <input className="input" type="number" placeholder="Đơn tối thiểu" value={form.minOrderAmount} onChange={(e) => setForm((prev) => ({ ...prev, minOrderAmount: Number(e.target.value) }))} />
          <label className="row gap8 center"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))} /> Kích hoạt</label>
          <input className="input" type="datetime-local" value={form.startsAtUtc || ''} onChange={(e) => setForm((prev) => ({ ...prev, startsAtUtc: e.target.value }))} />
          <input className="input" type="datetime-local" value={form.endsAtUtc || ''} onChange={(e) => setForm((prev) => ({ ...prev, endsAtUtc: e.target.value }))} />
          <div className="formFull"><textarea className="input textarea" placeholder="Mô tả ngắn" value={form.description || ''} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} /></div>
          <div className="row gap12 wrap formFull"><button className="primaryBtn" disabled={submitting}>{submitting ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo coupon'}</button><button type="button" className="ghostBtn" onClick={() => { setForm(emptyForm); setEditingId(null); }}>Làm mới</button></div>
        </form>
      </section>

      <section className="card sectionPad stack16">
        <input className="input" placeholder="Tìm coupon..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        {filtered.length ? filtered.map((coupon) => (
          <div key={coupon.id} className="adminListRow adminOrderRowCard">
            <div className="adminCellGrow">
              <strong>{coupon.code}</strong>
              <p className="muted">{coupon.name}</p>
              <p className="muted small">{coupon.discountType === 'Percent' ? `${coupon.discountValue}%` : formatMoney(coupon.discountValue)} · Tối thiểu {formatMoney(coupon.minOrderAmount)}</p>
              <p className="muted small">{coupon.startsAtUtc ? formatDate(coupon.startsAtUtc) : 'Bắt đầu ngay'} → {coupon.endsAtUtc ? formatDate(coupon.endsAtUtc) : 'Không giới hạn'}</p>
            </div>
            <div className="row gap8 wrap"><button className="ghostBtn small" onClick={() => edit(coupon)}>Sửa</button><button className="dangerBtn small" onClick={() => void remove(coupon.id)}>Xóa</button></div>
          </div>
        )) : <EmptyState title="Chưa có coupon phù hợp" message="Thử tìm với mã hoặc tên chương trình khác." />}
      </section>
    </div>
  );
}

function normalize(form: CouponInput): CouponInput {
  return {
    ...form,
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    description: form.description?.trim() || null,
    startsAtUtc: form.startsAtUtc ? new Date(form.startsAtUtc).toISOString() : null,
    endsAtUtc: form.endsAtUtc ? new Date(form.endsAtUtc).toISOString() : null,
  };
}

function toDateInput(value: string) { return new Date(value).toISOString().slice(0, 16); }

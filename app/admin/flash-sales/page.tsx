'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components/Feedback';
import { api } from '@/lib/api';
import { FlashSaleCampaign, FlashSaleInput, Product } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

const emptyForm: FlashSaleInput = {
  name: '', slug: '', description: '', isActive: true, priority: 0, startsAtUtc: '', endsAtUtc: '', items: [{ productId: 0, salePrice: 0, stockLimit: null, sortOrder: 0 }],
};

export default function AdminFlashSalesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<FlashSaleCampaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FlashSaleInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    if (!token) return;
    try {
      setLoading(true); setError('');
      const [allCampaigns, productResult] = await Promise.all([api.getAdminFlashSales(token), api.getProducts({ pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' })]);
      setCampaigns(allCampaigns); setProducts(productResult.items);
    } catch (err) { setError(err instanceof Error ? err.message : 'Không tải được flash sale.'); } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!token) return;
    try {
      setSubmitting(true);
      const payload = normalize(form);
      if (editingId) await api.updateFlashSale(token, editingId, payload); else await api.createFlashSale(token, payload);
      toast({ type: 'success', title: editingId ? 'Đã cập nhật flash sale' : 'Đã tạo flash sale' });
      setForm(emptyForm); setEditingId(null); await load();
    } catch (err) {
      toast({ type: 'error', title: 'Không lưu được flash sale', message: err instanceof Error ? err.message : undefined });
    } finally { setSubmitting(false); }
  }

  function edit(campaign: FlashSaleCampaign) {
    setEditingId(campaign.id);
    setForm({
      name: campaign.name, slug: campaign.slug, description: campaign.description || '', isActive: campaign.isActive, priority: campaign.priority,
      startsAtUtc: toDateInput(campaign.startsAtUtc), endsAtUtc: toDateInput(campaign.endsAtUtc),
      items: campaign.items.length ? campaign.items.map((item, index) => ({ productId: item.productId, salePrice: item.salePrice, stockLimit: item.stockLimit || null, sortOrder: item.sortOrder ?? index })) : [{ productId: 0, salePrice: 0, stockLimit: null, sortOrder: 0 }],
    });
  }

  async function remove(id: number) {
    if (!token) return; if (!window.confirm('Xóa chiến dịch flash sale này?')) return;
    await api.deleteFlashSale(token, id); await load();
  }

  const filtered = useMemo(() => campaigns.filter((campaign) => `${campaign.name} ${campaign.slug}`.toLowerCase().includes(keyword.trim().toLowerCase())), [campaigns, keyword]);

  if (loading) return <LoadingState title="Đang tải flash sale..." rows={6} />;
  if (error && !campaigns.length) return <ErrorState title="Không tải được flash sale" message={error} onRetry={load} />;

  return (
    <div className="stack24">
      <section className="card sectionPad stack16">
        <h2>{editingId ? 'Cập nhật flash sale' : 'Tạo flash sale mới'}</h2>
        <form className="grid formGrid" onSubmit={submit}>
          <input className="input" placeholder="Tên chiến dịch" value={form.name} onChange={(e) => {
            const name = e.target.value;
            setForm((prev) => ({ ...prev, name, slug: slugify(name) }));
          }} />
          <input className="input" placeholder="Slug tự tạo từ tên chiến dịch" value={form.slug || ''} readOnly />
          <input className="input" type="number" placeholder="Độ ưu tiên" value={form.priority} onChange={(e) => setForm((prev) => ({ ...prev, priority: Number(e.target.value) }))} />
          <label className="row gap8 center"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))} /> Kích hoạt chiến dịch</label>
          <input className="input" type="datetime-local" value={form.startsAtUtc} onChange={(e) => setForm((prev) => ({ ...prev, startsAtUtc: e.target.value }))} />
          <input className="input" type="datetime-local" value={form.endsAtUtc} onChange={(e) => setForm((prev) => ({ ...prev, endsAtUtc: e.target.value }))} />
          <div className="formFull"><textarea className="input textarea" placeholder="Mô tả chiến dịch" value={form.description || ''} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} /></div>
          <div className="formFull stack12">
            {form.items.map((item, index) => (
              <div key={`flash-item-${index}`} className="grid formGrid">
                <select className="input" value={item.productId} onChange={(e) => setForm((prev) => ({ ...prev, items: prev.items.map((current, idx) => idx === index ? { ...current, productId: Number(e.target.value) } : current) }))}>
                  <option value={0}>Chọn sản phẩm</option>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.productName}</option>)}
                </select>
                <input className="input" type="number" placeholder="Giá sale" value={item.salePrice} onChange={(e) => setForm((prev) => ({ ...prev, items: prev.items.map((current, idx) => idx === index ? { ...current, salePrice: Number(e.target.value) } : current) }))} />
                <input className="input" type="number" placeholder="Giới hạn stock" value={item.stockLimit || ''} onChange={(e) => setForm((prev) => ({ ...prev, items: prev.items.map((current, idx) => idx === index ? { ...current, stockLimit: e.target.value ? Number(e.target.value) : null } : current) }))} />
                <button type="button" className="dangerBtn small" onClick={() => setForm((prev) => ({ ...prev, items: prev.items.filter((_, idx) => idx !== index) }))}>Xóa</button>
              </div>
            ))}
            <button type="button" className="ghostBtn small" onClick={() => setForm((prev) => ({ ...prev, items: [...prev.items, { productId: 0, salePrice: 0, stockLimit: null, sortOrder: prev.items.length }] }))}>Thêm sản phẩm</button>
          </div>
          <div className="row gap12 wrap formFull"><button className="primaryBtn" disabled={submitting}>{submitting ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo flash sale'}</button><button type="button" className="ghostBtn" onClick={() => { setForm(emptyForm); setEditingId(null); }}>Làm mới</button></div>
        </form>
      </section>

      <section className="card sectionPad stack16">
        <input className="input" placeholder="Tìm flash sale..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        {filtered.length ? filtered.map((campaign) => (
          <div key={campaign.id} className="adminListRow adminOrderRowCard">
            <div className="adminCellGrow"><strong>{campaign.name}</strong><p className="muted">/{campaign.slug}</p><p className="muted small">{formatDate(campaign.startsAtUtc)} → {formatDate(campaign.endsAtUtc)} · {campaign.items.length} sản phẩm</p></div>
            <div className="row gap8 wrap"><button className="ghostBtn small" onClick={() => edit(campaign)}>Sửa</button><button className="dangerBtn small" onClick={() => void remove(campaign.id)}>Xóa</button></div>
          </div>
        )) : <EmptyState title="Chưa có chiến dịch phù hợp" message="Thử tìm theo tên hoặc slug khác." />}
      </section>
    </div>
  );
}

function normalize(form: FlashSaleInput): FlashSaleInput {
  return {
    ...form,
    name: form.name.trim(),
    slug: slugify(form.name) || null,
    description: form.description?.trim() || null,
    startsAtUtc: new Date(form.startsAtUtc).toISOString(),
    endsAtUtc: new Date(form.endsAtUtc).toISOString(),
    items: form.items.filter((item) => item.productId > 0 && item.salePrice > 0).map((item, index) => ({ productId: item.productId, salePrice: Number(item.salePrice), stockLimit: item.stockLimit || null, sortOrder: item.sortOrder ?? index })),
  };
}

function toDateInput(value: string) { return new Date(value).toISOString().slice(0, 16); }

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

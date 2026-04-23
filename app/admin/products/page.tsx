"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { EmptyState, ErrorState, LoadingState } from '@/components/Feedback';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import { formatMoney, getImageUrl } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const productResult = await api.getProducts({ pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' });
      setProducts(productResult.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu sản phẩm.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [token]);

  async function remove(id: number) {
    if (!token) return;
    if (!window.confirm('Xóa sản phẩm này?')) return;
    await api.deleteProduct(token, id);
    await load();
  }

  const filtered = useMemo(() => products.filter((product) => `${product.productName} ${product.productCode} ${product.brandName} ${product.categoryName} ${product.slug} ${product.imageUrl || ''}`.toLowerCase().includes(keyword.trim().toLowerCase())), [products, keyword]);

  if (loading) return <LoadingState title="Đang tải sản phẩm quản trị..." rows={7} />;
  if (error && !products.length) return <ErrorState title="Không tải được sản phẩm" message={error} onRetry={load} />;

  return (
    <div className="stack24">
      <section className="card sectionPad stack16">
        <div className="row between center wrap gap12">
          <div>
            <p className="eyebrow">Admin / Sản phẩm</p>
            <h2>Danh sách sản phẩm</h2>
            <p className="muted">Danh sách gọn nhưng đủ dữ liệu quản trị: ảnh, danh mục, slug, tồn kho và URL ảnh.</p>
          </div>
          <Link href="/admin/products/new" className="primaryBtn">Thêm sản phẩm</Link>
        </div>
        <input className="input" placeholder="Tìm theo tên, mã, thương hiệu, danh mục, slug, URL ảnh..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        {filtered.length ? filtered.map((product) => (
          <div key={product.id} className="adminListRow adminProductRow">
            <div className="adminProductSummary adminCellGrow">
              <img src={getImageUrl(product.imageUrl)} alt={product.productName} />
              <div className="adminProductInfo">
                <div>
                  <strong>{product.productName}</strong>
                  <p className="muted">{product.productCode} · {product.brandName} · /{product.slug}</p>
                </div>
                <div className="adminProductMeta">
                  <span><b>Danh mục</b>{product.categoryName}</span>
                  <span><b>Tồn kho</b>{product.stockQuantity}</span>
                  <span><b>Thông số</b>{product.specifications.length}</span>
                  <span><b>Biến thể</b>{product.variants.length}</span>
                </div>
                <p className="adminImageUrl muted small"><b>URL ảnh:</b> {product.imageUrl || 'Chưa có ảnh'}</p>
              </div>
            </div>
            <div className="price">{formatMoney(product.effectivePrice || product.price)}</div>
            <div className="row gap8 wrap"><Link className="ghostBtn small" href={`/admin/products/${product.id}/edit`}>Sửa</Link><button className="dangerBtn small" onClick={() => void remove(product.id)}>Xóa</button></div>
          </div>
        )) : <EmptyState title="Chưa có sản phẩm phù hợp" message="Thử thay đổi từ khóa hoặc thêm sản phẩm mới." />}
      </section>
    </div>
  );
}

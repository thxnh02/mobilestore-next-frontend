'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components/Feedback';
import { api } from '@/lib/api';
import { WishlistItem } from '@/lib/types';
import { formatMoney, getImageUrl } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

export default function WishlistPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      setItems(await api.getWishlist(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách yêu thích.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [token]);

  async function remove(productId: number) {
    if (!token) return;
    try {
      setItems(await api.removeWishlistItem(token, productId));
      toast({ type: 'success', title: 'Đã xóa khỏi danh sách yêu thích' });
    } catch (err) {
      toast({ type: 'error', title: 'Không xóa được', message: err instanceof Error ? err.message : undefined });
    }
  }

  async function clear() {
    if (!token) return;
    try {
      setItems(await api.clearWishlist(token));
      toast({ type: 'success', title: 'Đã làm trống danh sách yêu thích' });
    } catch (err) {
      toast({ type: 'error', title: 'Không làm trống được', message: err instanceof Error ? err.message : undefined });
    }
  }

  if (!token) {
    return (
      <div className="container">
        <EmptyState
          title="Đăng nhập để xem sản phẩm đã lưu"
          message="Danh sách yêu thích giúp bạn lưu lại những mẫu đang cân nhắc để quay lại sau."
          href="/login?next=/wishlist"
          action="Đăng nhập"
        />
      </div>
    );
  }

  if (loading) return <div className="container"><LoadingState title="Đang tải danh sách yêu thích..." rows={4} /></div>;
  if (error) return <div className="container"><ErrorState message={error} onRetry={() => void load()} /></div>;

  return (
    <div className="container stack24">
      <section className="card sectionPad stack16">
        <div className="sectionHeader">
          <div className="sectionTitle">
            <h1>Sản phẩm đã lưu</h1>
            <p className="muted">Những lựa chọn bạn muốn giữ lại để so sánh, quay lại xem kỹ hơn hoặc mua sau.</p>
          </div>
          {items.length ? <button className="ghostBtn" onClick={() => void clear()}>Xóa tất cả</button> : null}
        </div>
        <div className="row gap8 wrap">
          <span className="tabChip">{items.length} sản phẩm đã lưu</span>
          <span className="tabChip">So sánh thuận tiện</span>
          <span className="tabChip">Mua lại nhanh hơn</span>
        </div>
      </section>

      {items.length ? (
        <div className="grid productGrid">
          {items.map((item) => (
            <article key={item.id} className="card productCard surface">
              <Link href={`/products/${item.productId}`} className="productThumbWrap">
                <img src={getImageUrl(item.imageUrl)} alt={item.productName} className="productThumb" />
              </Link>
              <div className="row between center gap12">
                <span className="stockPill">{item.categoryName}</span>
                <span className="tag">{item.stockQuantity > 0 ? 'Còn hàng' : 'Tạm hết'}</span>
              </div>
              <Link href={`/products/${item.productId}`} className="productName lineClamp2">{item.productName}</Link>
              <p className="muted lineClamp2">{item.description || 'Một lựa chọn đáng cân nhắc cho nhu cầu học tập, làm việc hoặc giải trí hằng ngày.'}</p>
              <div className="productMeta">
                <div className="productMetaColumn">
                  <div className="price">{formatMoney(item.price)}</div>
                  <span className="priceNote">Lưu lại để quay về mua bất cứ lúc nào</span>
                </div>
                <button className="dangerBtn small" onClick={() => void remove(item.productId)}>Xóa</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Bạn chưa lưu sản phẩm nào"
          message="Nhấn biểu tượng trái tim ở trang sản phẩm để giữ lại những mẫu bạn đang cân nhắc."
          href="/products"
          action="Khám phá sản phẩm"
        />
      )}
    </div>
  );
}

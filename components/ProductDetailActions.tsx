'use client';

import { Minus, Plus, ShoppingCart, Star, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { useCart } from '@/providers/CartProvider';
import { useToast } from '@/providers/ToastProvider';

export function ProductDetailActions({ product }: { product: Product }) {
  const router = useRouter();
  const { token } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const maxQty = Math.max(product.stockQuantity, 1);

  function changeQty(next: number) {
    setQty(Math.min(maxQty, Math.max(1, next)));
  }

  async function handleAddToCart(goCheckout = false) {
    try {
      await addToCart(product, qty);
      toast({ type: 'success', title: 'Đã thêm vào giỏ', message: `${product.productName} x${qty}` });
      if (goCheckout) router.push('/cart');
    } catch (error) {
      toast({ type: 'error', title: 'Không thêm được giỏ hàng', message: error instanceof Error ? error.message : undefined });
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast({ type: 'info', title: 'Cần đăng nhập', message: 'Bạn cần đăng nhập để đánh giá sản phẩm.' });
      return;
    }
    if (rating < 1 || rating > 5) {
      toast({ type: 'error', title: 'Rating chưa hợp lệ', message: 'Rating phải từ 1 đến 5.' });
      return;
    }
    try {
      setSubmitting(true);
      await api.createReview(token, { productId: product.id, rating, comment: comment.trim() || undefined });
      setComment('');
      setRating(5);
      toast({ type: 'success', title: 'Đã gửi đánh giá' });
      router.refresh();
    } catch (error) {
      toast({ type: 'error', title: 'Không gửi được đánh giá', message: error instanceof Error ? error.message : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="detailActionStack">
      <div className="buyBox">
        <div className="buyBoxTop">
          <span>Số lượng</span>
          <strong>{product.stockQuantity > 0 ? `${product.stockQuantity} còn hàng` : 'Tạm hết hàng'}</strong>
        </div>

        <div className="qtyStepper">
          <button type="button" onClick={() => changeQty(qty - 1)} aria-label="Giảm số lượng"><Minus size={16} /></button>
          <input value={qty} onChange={(e) => changeQty(Number(e.target.value || 1))} inputMode="numeric" aria-label="Số lượng" />
          <button type="button" onClick={() => changeQty(qty + 1)} aria-label="Tăng số lượng"><Plus size={16} /></button>
        </div>

        <div className="buyActions">
          <button className="primaryBtn" onClick={() => void handleAddToCart(true)} disabled={product.stockQuantity <= 0}>
            <Zap size={17} /> Mua ngay
          </button>
          <button className="ghostBtn" onClick={() => void handleAddToCart(false)} disabled={product.stockQuantity <= 0}>
            <ShoppingCart size={17} /> Thêm giỏ
          </button>
        </div>

        <div className="buyNotes">
          <span>COD / VNPay</span>
          <span>Giao toàn quốc</span>
          <span>Bảo hành chính hãng</span>
        </div>
      </div>

      <form className="reviewComposer" onSubmit={submitReview}>
        <div className="row between center gap12">
          <h3>Viết đánh giá</h3>
          <label className="ratingSelect">
            <Star size={15} />
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} sao</option>)}
            </select>
          </label>
        </div>
        <textarea className="input textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Chia sẻ cảm nhận sau khi sử dụng..." maxLength={1000} />
        <button className="primaryBtn" disabled={submitting}>{submitting ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
      </form>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { EmptyState, LoadingState } from '@/components/Feedback';
import { formatMoney, getImageUrl } from '@/lib/utils';
import { useCart } from '@/providers/CartProvider';
import { useToast } from '@/providers/ToastProvider';

export default function CartPage() {
  const { items, total, isLoading, changeQuantity, removeItem, clearCart } = useCart();
  const { toast } = useToast();

  async function safe(action: () => Promise<void>, success: string) {
    try {
      await action();
      toast({ type: 'success', title: success });
    } catch (error) {
      toast({ type: 'error', title: 'Thao tác thất bại', message: error instanceof Error ? error.message : undefined });
    }
  }

  if (isLoading) return <div className="container"><LoadingState title="Đang tải giỏ hàng..." rows={4} /></div>;

  return (
    <div className="container stack24">
      <section className="card sectionPad stack16">
        <div className="sectionTitle">
          <h1>Giỏ hàng của bạn</h1>
          <p className="muted">Kiểm tra lại sản phẩm, số lượng và tổng tiền trước khi nhập địa chỉ giao hàng.</p>
        </div>
        <div className="row gap8 wrap">
          <span className="tabChip">{items.length} sản phẩm</span>
          <span className="tabChip">Có thể áp coupon ở checkout</span>
          <span className="tabChip">Hỗ trợ COD, chuyển khoản, VNPay</span>
        </div>
      </section>

      {items.length ? (
        <div className="stack16">
          {items.map((item) => (
            <div key={item.productId} className="card cartRow">
              <div className="row gap16 center">
                <img src={getImageUrl(item.imageUrl)} alt={item.productName} className="cartThumb" />
                <div className="cartInfo">
                  <strong>{item.productName}</strong>
                  <p className="muted">{formatMoney(item.price)}</p>
                  <span className="small muted">Tồn kho hiện tại: {item.stockQuantity}</span>
                </div>
              </div>

              <div className="row gap12 center wrap">
                <input
                  className="input qtyInput"
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => void safe(() => changeQuantity(item.productId, Number(e.target.value || 1)), 'Đã cập nhật số lượng')}
                />
                <div className="price">{formatMoney(item.price * item.quantity)}</div>
                <button className="dangerBtn small" onClick={() => void safe(() => removeItem(item.productId), 'Đã xóa sản phẩm khỏi giỏ')}>
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Giỏ hàng của bạn đang trống"
          message="Chọn điện thoại hoặc phụ kiện đang bán rồi thêm vào giỏ để bắt đầu đặt hàng."
          href="/products"
          action="Xem sản phẩm"
        />
      )}

      <div className="card sectionPad row between center wrap gap12">
        <div>
          <strong>Tổng thanh toán dự kiến</strong>
          <div className="price xl">{formatMoney(total)}</div>
          <p className="muted small">Mã giảm giá và phương thức thanh toán sẽ được chọn ở bước tiếp theo.</p>
        </div>
        <div className="row gap12 wrap">
          {items.length > 0 ? <button className="ghostBtn" onClick={() => void safe(clearCart, 'Đã làm trống giỏ hàng')}>Làm trống giỏ</button> : null}
          <Link href="/checkout" className="primaryBtn">Tiến hành thanh toán</Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Eye, Heart, ShoppingCart } from 'lucide-react';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import { formatMoney, getImageUrl } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useCart } from '@/providers/CartProvider';
import { useToast } from '@/providers/ToastProvider';

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { token } = useAuth();
  const { toast } = useToast();

  async function addWishlist() {
    if (!token) {
      toast({ type: 'info', title: 'Cần đăng nhập', message: 'Đăng nhập để lưu sản phẩm yêu thích.' });
      return;
    }
    try {
      await api.addWishlistItem(token, product.id);
      toast({ type: 'success', title: 'Đã lưu sản phẩm', message: product.productName });
    } catch (error) {
      toast({ type: 'error', title: 'Không lưu được sản phẩm', message: error instanceof Error ? error.message : undefined });
    }
  }

  async function handleAddCart() {
    try {
      await addToCart(product, 1);
      toast({ type: 'success', title: 'Đã thêm vào giỏ', message: product.productName });
    } catch (error) {
      toast({ type: 'error', title: 'Không thêm được vào giỏ', message: error instanceof Error ? error.message : undefined });
    }
  }

  const currentPrice = product.effectivePrice || product.price;
  const hasSale = currentPrice < product.price || product.discountPercent > 0 || product.isFlashSaleActive;
  const shortSpec = product.specifications?.[0];

  return (
    <article className="productCard">
      <Link href={`/p/${product.slug || product.id}`} className="productThumbWrap" aria-label={product.productName}>
        <img src={getImageUrl(product.imageUrl)} alt={product.productName} className="productThumb" />
        {hasSale ? <span className="productSaleBadge">{product.discountPercent > 0 ? `-${product.discountPercent}%` : 'Sale'}</span> : null}
      </Link>

      <div className="productInfo">
        <div className="productTopLine">
          <span>{product.brandName || product.categoryName}</span>
          <button className="iconBtn productHeart" onClick={addWishlist} aria-label="Lưu yêu thích">
            <Heart size={15} />
          </button>
        </div>

        <Link href={`/p/${product.slug || product.id}`} className="productName lineClamp2">
          {product.productName}
        </Link>

        <div className="productMiniMeta">
          <span>{product.stockQuantity > 0 ? 'Còn hàng' : 'Hết hàng'}</span>
          {shortSpec ? <span>{shortSpec.specValue}</span> : product.variants?.length ? <span>{product.variants.length} phiên bản</span> : null}
        </div>

        <div className="productPriceBlock">
          <strong className="price">{formatMoney(currentPrice)}</strong>
          {hasSale && currentPrice < product.price ? <span>{formatMoney(product.price)}</span> : null}
        </div>

        <div className="productActions">
          <Link href={`/p/${product.slug || product.id}`} className="ghostBtn small productViewBtn">
            <Eye size={14} /> Xem
          </Link>
          <button className="primaryBtn small productCartBtn" onClick={handleAddCart} disabled={product.stockQuantity <= 0}>
            <ShoppingCart size={14} /> {product.stockQuantity <= 0 ? 'Hết' : 'Giỏ'}
          </button>
        </div>
      </div>
    </article>
  );
}

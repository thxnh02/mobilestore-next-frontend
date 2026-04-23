import Link from 'next/link';
import { ChevronRight, ShieldCheck, Star, Truck } from 'lucide-react';
import { EmptyState } from '@/components/Feedback';
import { ProductDetailActions } from '@/components/ProductDetailActions';
import { ProductCard } from '@/components/ProductCard';
import { api } from '@/lib/api';
import { formatMoney, getImageUrl } from '@/lib/utils';

export default async function ProductDetailBySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await api.getProductBySlug(slug).catch(() => null);

  if (!product) {
    return (
      <div className="container">
        <EmptyState
          title="Không tìm thấy sản phẩm"
          message="Sản phẩm có thể đã ngừng kinh doanh hoặc tạm thời chưa hiển thị trên website."
          href="/products"
          action="Quay lại danh sách"
        />
      </div>
    );
  }

  const [reviews, summary, related] = await Promise.all([
    api.getReviews(product.id).catch(() => []),
    api.getReviewSummary(product.id).catch(() => null),
    api.getProducts({ categoryId: product.categoryId, pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' }).catch(() => ({ items: [] })),
  ]);

  const currentPrice = product.effectivePrice || product.price;
  const hasSale = currentPrice < product.price || product.discountPercent > 0 || product.isFlashSaleActive;
  const relatedItems = related.items.filter((item) => item.id !== product.id).slice(0, 5);

  return (
    <div className="container productDetailPage stack24">
      <nav className="detailBreadcrumb">
        <Link href="/">Trang chủ</Link>
        <ChevronRight size={14} />
        <Link href="/products">Sản phẩm</Link>
        <ChevronRight size={14} />
        <span>{product.productName}</span>
      </nav>

      <section className="detailHero">
        <div className="detailMediaPanel">
          {hasSale ? <span className="detailSaleBadge">{product.discountPercent > 0 ? `Giảm ${product.discountPercent}%` : 'Đang sale'}</span> : null}
          <img src={getImageUrl(product.imageUrl)} alt={product.productName} className="detailImage" />
          <div className="detailPerks">
            <span><Truck size={16} /> Giao nhanh</span>
            <span><ShieldCheck size={16} /> Chính hãng</span>
            <span><Star size={16} /> {(Number(summary?.averageRating || 0)).toFixed(1)}/5</span>
          </div>
        </div>

        <div className="detailInfoPanel">
          <div className="row gap8 wrap">
            <span className="tag">{product.categoryName}</span>
            <span className="tag">{product.brandName}</span>
            {product.isFlashSaleActive ? <span className="tag danger">{product.flashSaleCampaignName || 'Flash Sale'}</span> : null}
          </div>

          <div className="stack12">
            <h1>{product.productName}</h1>
            <p className="muted">{product.description || 'Sản phẩm chính hãng, phù hợp cho nhu cầu sử dụng hằng ngày, học tập, làm việc và giải trí.'}</p>
          </div>

          <div className="detailPriceBox">
            <div>
              <span>Giá bán</span>
              <strong>{formatMoney(currentPrice)}</strong>
            </div>
            {hasSale && currentPrice < product.price ? <em>{formatMoney(product.price)}</em> : null}
          </div>

          <div className="detailQuickFacts">
            <div><span>Tồn kho</span><strong>{product.stockQuantity > 0 ? `${product.stockQuantity} sản phẩm` : 'Hết hàng'}</strong></div>
            <div><span>Mã hàng</span><strong>{product.productCode}</strong></div>
            <div><span>Đánh giá</span><strong>{summary?.totalReviews || 0} lượt</strong></div>
          </div>

          {product.variants.length ? (
            <div className="detailBlock">
              <h2>Phiên bản</h2>
              <div className="variantGrid">
                {product.variants.map((variant, index) => (
                  <span key={`${variant.sku}-${index}`} className="variantChip">
                    <strong>{variant.variantName}</strong>
                    <small>{[variant.storage, variant.color].filter(Boolean).join(' / ') || 'Tiêu chuẩn'}</small>
                    {variant.additionalPrice > 0 ? <em>+{formatMoney(variant.additionalPrice)}</em> : null}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <ProductDetailActions product={product} />
        </div>
      </section>

      <section className="detailBelowGrid">
        <div className="detailBlock">
          <div className="sectionHeader">
            <div className="sectionTitle">
              <span className="sectionKicker">Thông số</span>
              <h2>Chi tiết sản phẩm</h2>
            </div>
          </div>
          {product.specifications.length ? (
            <div className="specTable">
              {product.specifications.map((spec, index) => (
                <div key={`${spec.specKey}-${index}`}>
                  <span>{spec.specKey}</span>
                  <strong>{spec.specValue}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Thông số sẽ được cập nhật thêm.</p>
          )}
        </div>

        <div className="detailBlock">
          <div className="sectionHeader">
            <div className="sectionTitle">
              <span className="sectionKicker">Đánh giá</span>
              <h2>Khách hàng nói gì</h2>
            </div>
            <span className="tag">{(Number(summary?.averageRating || 0)).toFixed(1)} / 5 sao</span>
          </div>
          <div className="stack12">
            {reviews.length ? reviews.slice(0, 4).map((review) => (
              <div key={review.id} className="reviewItem">
                <div className="reviewHeader">
                  <strong>{review.reviewerName}</strong>
                  <span className="tag">{review.rating}/5 sao</span>
                </div>
                <p className="muted">{review.comment || 'Người dùng chưa để lại bình luận chi tiết.'}</p>
              </div>
            )) : <p className="muted">Sản phẩm này chưa có đánh giá nào từ khách hàng.</p>}
          </div>
        </div>
      </section>

      {relatedItems.length ? (
        <section className="stack16">
          <div className="sectionHeader">
            <div className="sectionTitle">
              <span className="sectionKicker">Gợi ý</span>
              <h2>Sản phẩm cùng danh mục</h2>
            </div>
            <Link href={`/products?categoryId=${product.categoryId}`} className="ghostBtn small">Xem thêm</Link>
          </div>
          <div className="grid productGrid">
            {relatedItems.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}

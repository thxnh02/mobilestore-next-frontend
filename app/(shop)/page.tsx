import Link from 'next/link';
import { ArrowRight, BadgePercent, CreditCard, Flame, ShieldCheck, Sparkles, Star, TicketPercent, Truck, Zap } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { api } from '@/lib/api';
import { formatMoney, getImageUrl } from '@/lib/utils';

export default async function HomePage() {
  const [products, categories, flashSales] = await Promise.all([
    api.getProducts('pageSize=20&sortBy=createdAt&sortOrder=desc').catch(() => ({ items: [], pageNumber: 1, pageSize: 20, totalItems: 0, totalPages: 0 })),
    api.getCategories().catch(() => []),
    api.getActiveFlashSales().catch(() => []),
  ]);

  const allProducts = products.items;
  const spotlight = allProducts[0] || null;
  const flash = flashSales[0] || null;
  const saleItems = (allProducts.filter((product) => product.discountPercent > 0 || product.isFlashSaleActive).length
    ? allProducts.filter((product) => product.discountPercent > 0 || product.isFlashSaleActive)
    : allProducts).slice(0, 5);
  const recommended = allProducts.slice(0, 10);
  const freshItems = allProducts.slice(0, 5);
  const budgetItems = [...allProducts].sort((a, b) => (a.effectivePrice || a.price) - (b.effectivePrice || b.price)).slice(0, 4);

  return (
    <div className="container homePage stack32">
      <section className="shopHero">
        <div className="shopHeroContent">
          <span className="saleKicker"><Sparkles size={15} /> Deal mới mỗi ngày</span>
          <h1>MobileStore</h1>
          <p>Điện thoại chính hãng, giá rõ ràng, chọn nhanh theo nhu cầu.</p>
          <div className="heroActions">
            <Link href="/products" className="primaryBtn">Mua ngay</Link>
            <Link href="/products?sortBy=price&sortOrder=asc" className="heroLightBtn">Săn giá tốt</Link>
          </div>
          <div className="heroMiniStats">
            <span>Giao nhanh</span>
            <span>Bảo hành 12 tháng</span>
            <span>COD / VNPay</span>
          </div>
        </div>

        {spotlight ? (
          <Link href={`/p/${spotlight.slug || spotlight.id}`} className="heroProduct">
            <span className="heroProductLabel">Đề xuất hôm nay</span>
            <img src={getImageUrl(spotlight.imageUrl)} alt={spotlight.productName} />
            <strong>{spotlight.productName}</strong>
            <em>{formatMoney(spotlight.effectivePrice || spotlight.price)}</em>
          </Link>
        ) : null}
      </section>

      <section className="dealStrip" aria-label="Ưu đãi nhanh">
        <Link href="/products?sortBy=price&sortOrder=asc" className="dealTile dealTileStrong">
          <Flame size={20} />
          <span>Sale hôm nay</span>
          <strong>{flash?.name || 'Giá tốt đang mở'}</strong>
        </Link>
        <Link href="/products?keyword=iPhone" className="dealTile">
          <Zap size={19} />
          <span>iPhone</span>
          <strong>Máy mới, lên đời nhanh</strong>
        </Link>
        <Link href="/products?keyword=Samsung" className="dealTile">
          <ShieldCheck size={19} />
          <span>Samsung</span>
          <strong>Android cao cấp</strong>
        </Link>
        <Link href="/products?categoryId=3" className="dealTile">
          <TicketPercent size={19} />
          <span>Phụ kiện</span>
          <strong>Sạc, tai nghe, case</strong>
        </Link>
      </section>

      <section className="homeShowcase">
        <div className="showcaseMain">
          <div className="sectionHeader">
            <div className="sectionTitle">
              <span className="sectionKicker">Đề xuất</span>
              <h2>Sản phẩm nên xem</h2>
            </div>
            <Link href="/products" className="ghostBtn small">Xem tất cả</Link>
          </div>
          <div className="grid productGrid compactGrid">
            {recommended.slice(0, 5).map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>

        <aside className="sideDealPanel">
          <div className="sideDealHeader">
            <span><BadgePercent size={16} /> Giá tốt</span>
            <Link href="/products?sortBy=price&sortOrder=asc">Xem</Link>
          </div>
          <div className="miniProductList">
            {budgetItems.map((product) => (
              <Link key={product.id} href={`/p/${product.slug || product.id}`} className="miniProduct">
                <img src={getImageUrl(product.imageUrl)} alt={product.productName} />
                <span>
                  <strong>{product.productName}</strong>
                  <em>{formatMoney(product.effectivePrice || product.price)}</em>
                </span>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className="saleBanner">
        <div>
          <span className="sectionKicker">Flash sale</span>
          <h2>{flash?.name || 'Ưu đãi đang chạy'}</h2>
          <p>{flash ? `Kết thúc ${new Date(flash.endsAtUtc).toLocaleString('vi-VN')}` : 'Sắp xếp theo giá để xem các mẫu đáng mua nhất.'}</p>
        </div>
        <Link href="/products?sortBy=price&sortOrder=asc" className="heroLightBtn">Săn sale <ArrowRight size={16} /></Link>
      </section>

      <section className="stack16">
        <div className="sectionHeader">
          <div className="sectionTitle">
            <span className="sectionKicker">Deal</span>
            <h2>Đang có giá tốt</h2>
          </div>
          <div className="sectionTabs">
            <span className="tabChip">Còn hàng</span>
            <span className="tabChip">Giao nhanh</span>
            <span className="tabChip">Bảo hành</span>
          </div>
        </div>
        <div className="grid productGrid compactGrid">
          {saleItems.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="categoryRail">
        <div className="sectionTitle">
          <span className="sectionKicker">Danh mục</span>
          <h2>Mua theo nhu cầu</h2>
        </div>
        <div className="categoryPills">
          {categories.length ? categories.slice(0, 8).map((category) => (
            <Link key={category.id} href={`/products?categoryId=${category.id}`} className="categoryPill">
              <strong>{category.categoryName}</strong>
              <span>{category.productCount} sản phẩm</span>
            </Link>
          )) : <span className="muted">Danh mục sẽ hiển thị khi có dữ liệu.</span>}
        </div>
      </section>

      <section className="freshSection">
        <div className="sectionHeader">
          <div className="sectionTitle">
            <span className="sectionKicker">Hàng mới</span>
            <h2>Vừa cập nhật</h2>
          </div>
          <Link href="/products?sortBy=createdAt&sortOrder=desc" className="ghostBtn small">Mới nhất</Link>
        </div>
        <div className="grid productGrid compactGrid">
          {freshItems.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="serviceStrip">
        <div><Truck size={19} /><strong>Giao nhanh</strong><span>Toàn quốc</span></div>
        <div><ShieldCheck size={19} /><strong>Chính hãng</strong><span>Bảo hành rõ</span></div>
        <div><CreditCard size={19} /><strong>Thanh toán</strong><span>COD, VNPay</span></div>
        <div><Star size={19} /><strong>Hỗ trợ</strong><span>Theo dõi đơn</span></div>
      </section>
    </div>
  );
}

import Link from 'next/link';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/Feedback';
import { Pagination } from '@/components/Pagination';
import { ProductCard } from '@/components/ProductCard';
import { api } from '@/lib/api';
import { ProductQuery } from '@/lib/types';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = normalizeQuery(params);

  const [result, categories] = await Promise.all([
    api.getProducts(query).catch(() => ({ items: [], pageNumber: Number(query.pageNumber) || 1, pageSize: 16, totalItems: 0, totalPages: 0 })),
    api.getCategories().catch(() => []),
  ]);

  const currentParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => value !== undefined && value !== '' && currentParams.set(key, String(value)));

  const activeFilters = [
    query.keyword ? `Từ khóa: ${query.keyword}` : '',
    query.categoryId ? categories.find((item) => String(item.id) === String(query.categoryId))?.categoryName || `Danh mục ${query.categoryId}` : '',
    query.minPrice ? `Từ ${Number(query.minPrice).toLocaleString('vi-VN')}đ` : '',
    query.maxPrice ? `Đến ${Number(query.maxPrice).toLocaleString('vi-VN')}đ` : '',
  ].filter(Boolean);

  return (
    <div className="container catalogPage stack24">
      <section className="catalogHero">
        <div>
          <span className="saleKicker"><Sparkles size={15} /> Catalog</span>
          <h1>Điện thoại và phụ kiện</h1>
          <p>{result.totalItems} sản phẩm đang bán. Lọc nhanh theo nhu cầu, giá và danh mục.</p>
        </div>
        <div className="catalogHeroActions">
          <Link href="/products?sortBy=price&sortOrder=asc" className="heroLightBtn">Giá tốt</Link>
          <Link href="/products?sortBy=createdAt&sortOrder=desc" className="heroLightBtn">Hàng mới</Link>
        </div>
      </section>

      <section className="catalogPanel">
        <form className="filters compactFilters" action="/products">
          <div className="filterSearch">
            <label><Search size={15} /> Tìm kiếm</label>
            <input className="input" name="keyword" defaultValue={String(query.keyword || '')} placeholder="iPhone, Samsung, sạc..." />
          </div>

          <div>
            <label>Danh mục</label>
            <select className="input" name="categoryId" defaultValue={String(query.categoryId || '')}>
              <option value="">Tất cả</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Giá từ</label>
            <input className="input" name="minPrice" type="number" min={0} defaultValue={String(query.minPrice || '')} placeholder="0" />
          </div>

          <div>
            <label>Giá đến</label>
            <input className="input" name="maxPrice" type="number" min={0} defaultValue={String(query.maxPrice || '')} placeholder="30000000" />
          </div>

          <div>
            <label><SlidersHorizontal size={15} /> Sắp xếp</label>
            <select className="input" name="sortBy" defaultValue={String(query.sortBy || 'createdAt')}>
              <option value="createdAt">Mới nhất</option>
              <option value="price">Giá bán</option>
              <option value="name">Tên A-Z</option>
              <option value="id">Mã sản phẩm</option>
            </select>
            <input type="hidden" name="sortOrder" value={String(query.sortOrder || 'desc')} />
            <input type="hidden" name="pageSize" value="16" />
          </div>

          <button className="primaryBtn">Lọc</button>
        </form>

        <div className="catalogMeta">
          <div className="activeFilters">
            {activeFilters.length ? activeFilters.map((item) => <span key={item} className="activeChip">{item}</span>) : (
              <>
                <span className="activeChip">Mới cập nhật</span>
                <span className="activeChip">Còn hàng</span>
              </>
            )}
          </div>
          <Link className="ghostBtn small" href="/products">Xóa lọc</Link>
        </div>
      </section>

      {result.items.length ? (
        <>
          <div className="grid productGrid catalogGrid">{result.items.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          <Pagination page={result.pageNumber} totalPages={result.totalPages} basePath="/products" searchParams={currentParams} />
        </>
      ) : (
        <EmptyState
          title="Chưa tìm thấy sản phẩm phù hợp"
          message="Đổi từ khóa, nới khoảng giá hoặc quay lại toàn bộ danh mục để xem thêm."
          href="/products"
          action="Xem tất cả sản phẩm"
        />
      )}
    </div>
  );
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeQuery(params: SearchParams): ProductQuery {
  return {
    keyword: one(params.keyword) || undefined,
    categoryId: one(params.categoryId) || undefined,
    minPrice: one(params.minPrice) || undefined,
    maxPrice: one(params.maxPrice) || undefined,
    sortBy: (one(params.sortBy) as ProductQuery['sortBy']) || 'createdAt',
    sortOrder: (one(params.sortOrder) as ProductQuery['sortOrder']) || 'desc',
    pageNumber: one(params.pageNumber) || 1,
    pageSize: one(params.pageSize) || 16,
  };
}

import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Pagination({ page, totalPages, basePath, searchParams }: { page: number; totalPages: number; basePath: string; searchParams: URLSearchParams }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((item) => Math.abs(item - page) <= 2 || item === 1 || item === totalPages);

  function href(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    params.set('pageNumber', String(nextPage));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <nav className="pagination" aria-label="Phân trang">
      <Link className="ghostBtn small" href={href(Math.max(1, page - 1))}>Trước</Link>
      {pages.map((item, index) => (
        <Link key={`${item}-${index}`} className={cn('pageBtn', item === page && 'active')} href={href(item)}>{item}</Link>
      ))}
      <Link className="ghostBtn small" href={href(Math.min(totalPages, page + 1))}>Sau</Link>
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingState } from '@/components/Feedback';
import { useAuth } from '@/providers/AuthProvider';

export function RequireAuth({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) return <div className="container"><LoadingState /></div>;

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="card sectionPad emptyState">
          <h1>Cần đăng nhập</h1>
          <p className="muted">Bạn cần đăng nhập để tiếp tục thao tác này.</p>
          <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="primaryBtn">Đăng nhập</Link>
        </div>
      </div>
    );
  }

  if (admin && !isAdmin) {
    return (
      <div className="container">
        <div className="card sectionPad emptyState">
          <h1>Không có quyền truy cập</h1>
          <p className="muted">Khu vực này dành cho tài khoản Admin.</p>
          <Link href="/" className="ghostBtn">Quay lại cửa hàng</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

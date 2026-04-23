'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RequireAuth } from '@/components/RouteGuards';
import { useAuth } from '@/providers/AuthProvider';

const navItems = [
  { href: '/admin', label: 'Tổng quan', hint: 'Dashboard & số liệu' },
  { href: '/admin/products', label: 'Sản phẩm', hint: 'Ảnh, danh mục, slug, biến thể' },
  { href: '/admin/coupons', label: 'Coupon', hint: 'Mã giảm giá & voucher' },
  { href: '/admin/flash-sales', label: 'Flash Sale', hint: 'Chiến dịch theo khung giờ' },
  { href: '/admin/orders', label: 'Đơn hàng', hint: 'Xử lý & theo dõi' },
  { href: '/admin/payments', label: 'Thanh toán', hint: 'COD / VNPay / trạng thái' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <RequireAuth admin>
      <div className="adminLayout adminShell">
        <aside className="adminSidebar adminSidebarReal">
          <Link href="/admin" className="adminBrandLink">
            <span className="adminBrandBadge">MS</span>
            <div>
              <strong>MobileStore Admin</strong>
              <p>Quản trị cửa hàng</p>
            </div>
          </Link>

          <div className="adminUserCard">
            <span className="tag">Admin</span>
            <strong>{user?.fullName || user?.username || 'Administrator'}</strong>
            <p>{user?.email || 'Quản lý hệ thống & đơn hàng'}</p>
          </div>

          <nav className="adminNavGroup">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));
              return (
                <Link key={item.href} href={item.href} className={`adminNavLink ${active ? 'active' : ''}`}>
                  <strong>{item.label}</strong>
                  <span>{item.hint}</span>
                </Link>
              );
            })}
          </nav>

          <div className="adminSidebarFooter">
            <Link href="/" className="ghostBtn adminSideAction">Storefront</Link>
            <button type="button" className="dangerBtn adminSideAction" onClick={logout}>Đăng xuất</button>
          </div>
        </aside>

        <main className="adminMain adminMainReal">{children}</main>
      </div>
    </RequireAuth>
  );
}

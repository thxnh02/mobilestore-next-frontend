'use client';

import Link from 'next/link';
import { BadgePercent, ChevronRight, Grid3X3, Heart, Home, LogOut, Menu, PackageCheck, Search, ShieldCheck, ShoppingCart, Smartphone, Sparkles, Truck, UserCircle2, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useCart } from '@/providers/CartProvider';
import { useToast } from '@/providers/ToastProvider';

type NavLink = { href: string; label: string; match?: (pathname: string) => boolean };

export function Header() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const { count } = useCart();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const links: NavLink[] = [
    { href: '/', label: 'Trang chủ', match: (p) => p === '/' },
    { href: '/products', label: 'Sản phẩm', match: (p) => p.startsWith('/products') || p.startsWith('/p/') },
    { href: '/products?sortBy=price&sortOrder=asc', label: 'Giá tốt' },
    { href: '/orders', label: 'Đơn hàng', match: (p) => p.startsWith('/orders') },
  ];

  if (isAdmin) links.push({ href: '/admin', label: 'Admin', match: (p) => p.startsWith('/admin') });

  const quickCategories = [
    { href: '/products?keyword=iphone', label: 'iPhone' },
    { href: '/products?keyword=samsung', label: 'Samsung' },
    { href: '/products?keyword=xiaomi', label: 'Xiaomi' },
    { href: '/products?sortBy=price&sortOrder=asc', label: 'Sale' },
    { href: '/products?keyword=phụ kiện', label: 'Phụ kiện' },
  ];

  async function handleLogout() {
    await logout();
    toast({ type: 'success', title: 'Đã đăng xuất' });
  }

  return (
    <header className="siteHeader">
      <div className="headerRibbon">
        <div className="container headerRibbonInner">
          <span><Truck size={14} /> Giao nhanh toàn quốc</span>
          <span><ShieldCheck size={14} /> Hàng chính hãng</span>
          <span><BadgePercent size={14} /> Deal mới mỗi ngày</span>
        </div>
      </div>

      <div className="container headerMainBar">
        <Link href="/" className="brand">
          <span className="brandMark"><Smartphone size={20} /></span>
          <span className="brandText">
            <span>MobileStore</span>
            <small>Điện thoại chính hãng</small>
          </span>
        </Link>

        <form action="/products" className="searchBar headerSearch">
          <Search size={18} />
          <input name="keyword" placeholder="Tìm iPhone, Samsung, sạc nhanh..." aria-label="Tìm sản phẩm" />
          <button className="primaryBtn small" type="submit">Tìm</button>
        </form>

        <div className="headerActions">
          <button className="iconBtn mobileMenuBtn" onClick={() => setOpen((v) => !v)} aria-label="Mở menu">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          <Link href="/wishlist" className="iconBtn" aria-label="Yêu thích"><Heart size={18} /></Link>
          <Link href="/cart" className="iconBtn cartBtn" aria-label="Giỏ hàng">
            <ShoppingCart size={18} />
            {count > 0 ? <span className="badge">{count}</span> : null}
          </Link>
          {user ? (
            <div className="accountCluster">
              <Link href="/account" className="accountButton" aria-label="Tài khoản">
                {user.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName} /> : <UserCircle2 size={18} />}
                <span>{user.fullName}</span>
              </Link>
              <button className="iconBtn logoutBtn" onClick={() => void handleLogout()} aria-label="Đăng xuất">
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <div className="authButtons">
              <Link href="/login" className="ghostBtn small">Đăng nhập</Link>
              <Link href="/register" className="primaryBtn small">Đăng ký</Link>
            </div>
          )}
        </div>
      </div>

      <div className="headerNavWrap">
        <div className="container headerNavBar">
          <nav className="nav headerNav">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={cn('navLink', (link.match ? link.match(pathname) : pathname === link.href) && 'active')}>
                {link.href === '/' ? <Home size={15} /> : link.href === '/products' ? <Grid3X3 size={15} /> : null}
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="quickCategoryRow">
            {quickCategories.map((item) => <Link key={item.href} href={item.href} className="tabChip">{item.label}</Link>)}
          </div>
        </div>
      </div>

      {open ? (
        <div className="container mobileQuickPanel">
          <div className="mobileMenuCard">
            <form action="/products" className="searchBar">
              <Search size={18} />
              <input name="keyword" placeholder="Tìm sản phẩm..." aria-label="Tìm sản phẩm mobile" />
              <button className="primaryBtn small" type="submit">Tìm</button>
            </form>
            <div className="mobileMenuGrid">
              <Link href="/products">Tất cả sản phẩm</Link>
              <Link href="/products?sortBy=price&sortOrder=asc">Giá tốt</Link>
              <Link href="/cart">Giỏ hàng</Link>
              <Link href="/orders">Đơn hàng</Link>
              {isAdmin ? <Link href="/admin">Admin</Link> : null}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footerGrid">
        <div>
          <h4>MobileStore</h4>
          <p>Điện thoại và phụ kiện chính hãng, giá rõ ràng, giao hàng toàn quốc.</p>
          <p className="row gap8 center"><Sparkles size={14} /> Săn deal, áp mã và theo dõi đơn ngay trong tài khoản.</p>
        </div>

        <div>
          <h4>Mua sắm</h4>
          <p><Link href="/products">Tất cả sản phẩm</Link></p>
          <p><Link href="/products?sortBy=createdAt&sortOrder=desc">Hàng mới</Link></p>
          <p><Link href="/products?sortBy=price&sortOrder=asc">Giá tốt</Link></p>
          <p><Link href="/wishlist">Đã lưu</Link></p>
        </div>

        <div>
          <h4>Hỗ trợ</h4>
          <p><Link href="/cart">Giỏ hàng</Link></p>
          <p><Link href="/checkout">Thanh toán</Link></p>
          <p><Link href="/orders">Tra cứu đơn</Link></p>
          <p><Link href="/forgot-password">Quên mật khẩu</Link></p>
        </div>

        <div>
          <h4>Liên hệ</h4>
          <p>Hotline: 1900 0000</p>
          <p>Email: support@mobilestore.vn</p>
          <p>08:00 - 21:00 mỗi ngày</p>
          <p className="row gap8 center"><PackageCheck size={14} /> Hỗ trợ mua hàng nhanh.</p>
        </div>
      </div>
      <div className="container footerBottom">© 2026 MobileStore. Hàng chính hãng, giá minh bạch.</div>
    </footer>
  );
}

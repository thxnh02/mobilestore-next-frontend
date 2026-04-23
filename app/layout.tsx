import '@/app/globals.css';
import { AuthProvider } from '@/providers/AuthProvider';
import { CartProvider } from '@/providers/CartProvider';
import { ToastProvider } from '@/providers/ToastProvider';

export const metadata = {
  title: 'MobileStore | Điện thoại chính hãng, giá tốt mỗi ngày',
  description: 'Mua điện thoại và phụ kiện chính hãng, giá minh bạch, có flash sale, giao hàng toàn quốc và thanh toán COD, chuyển khoản hoặc VNPay.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

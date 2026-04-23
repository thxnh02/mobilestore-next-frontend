'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FieldError } from '@/components/Feedback';
import { api } from '@/lib/api';
import { FieldErrors, firstError, minLength, required } from '@/lib/validation';
import { useAuth } from '@/providers/AuthProvider';
import { useCart } from '@/providers/CartProvider';
import { useToast } from '@/providers/ToastProvider';

type LoginFields = 'login' | 'password';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { syncGuestCart } = useCart();
  const { toast } = useToast();
  const [nextUrl, setNextUrl] = useState('/');
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors<LoginFields>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next');
    if (next?.startsWith('/')) setNextUrl(next);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(loginValue, password);
    setErrors(nextErrors);
    const error = firstError(nextErrors);
    if (error) {
      toast({ type: 'error', title: 'Kiểm tra lại form', message: error });
      return;
    }

    try {
      setLoading(true);
      const result = await api.login({ login: loginValue.trim(), password });
      await auth.login(result);
      void syncGuestCart(result.token).catch((error) => {
        toast({
          type: 'error',
          title: 'Chưa đồng bộ được giỏ hàng',
          message: error instanceof Error ? error.message : undefined,
        });
      });
      toast({ type: 'success', title: 'Đăng nhập thành công' });
      router.push(nextUrl);
    } catch (err) {
      toast({ type: 'error', title: 'Đăng nhập thất bại', message: err instanceof Error ? err.message : undefined });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authWrap">
      <div className="card authCard stack16">
        <div className="sectionTitle">
          <h1>Đăng nhập</h1>
          <p className="muted">Tiếp tục mua sắm, theo dõi đơn hàng và dùng lại địa chỉ đã lưu trong tài khoản của bạn.</p>
        </div>

        <form className="stack16" onSubmit={submit}>
          <div>
            <input className="input" placeholder="Username hoặc email" value={loginValue} onChange={(e) => setLoginValue(e.target.value)} />
            <FieldError message={errors.login} />
          </div>
          <div>
            <input className="input" type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} />
            <FieldError message={errors.password} />
          </div>
          <button className="primaryBtn" disabled={loading}>{loading ? 'Đang xử lý...' : 'Đăng nhập'}</button>
        </form>

        <div className="miniCard">
          <strong>Đăng nhập để làm gì?</strong>
          <span className="muted">Lưu sản phẩm yêu thích, xem đơn hàng, quản lý địa chỉ và sử dụng các luồng thanh toán đầy đủ hơn.</span>
        </div>

        <p className="muted">Chưa có tài khoản? <Link href="/register">Đăng ký</Link></p>
        <p className="muted"><Link href="/forgot-password">Quên mật khẩu?</Link></p>
      </div>
    </div>
  );
}

function validate(loginValue: string, password: string): FieldErrors<LoginFields> {
  return {
    login: required(loginValue, 'Username hoặc email'),
    password: required(password, 'Mật khẩu') || minLength(password, 6, 'Mật khẩu'),
  };
}

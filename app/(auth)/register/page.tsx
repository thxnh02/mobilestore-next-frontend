'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FieldError } from '@/components/Feedback';
import { api } from '@/lib/api';
import { FieldErrors, firstError, minLength, required, validEmail } from '@/lib/validation';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

type RegisterFields = 'username' | 'email' | 'fullName' | 'password' | 'confirmPassword';

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ username: '', email: '', fullName: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<FieldErrors<RegisterFields>>({});
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    const error = firstError(nextErrors);
    if (error) {
      toast({ type: 'error', title: 'Kiểm tra lại form', message: error });
      return;
    }

    try {
      setLoading(true);
      const result = await api.register({
        ...form,
        username: form.username.trim(),
        email: form.email.trim(),
        fullName: form.fullName.trim(),
      });
      await auth.login(result);
      toast({ type: 'success', title: 'Tạo tài khoản thành công' });
      router.push('/');
    } catch (err) {
      toast({ type: 'error', title: 'Đăng ký thất bại', message: err instanceof Error ? err.message : undefined });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authWrap">
      <div className="card authCard stack16">
        <div className="sectionTitle">
          <h1>Tạo tài khoản mới</h1>
          <p className="muted">Đăng ký để lưu địa chỉ, quản lý đơn hàng và mua sắm nhanh hơn trong các lần tiếp theo.</p>
        </div>

        <form className="stack16" onSubmit={submit}>
          <div><input className="input" placeholder="Username" value={form.username} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))} /><FieldError message={errors.username} /></div>
          <div><input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} /><FieldError message={errors.email} /></div>
          <div><input className="input" placeholder="Họ tên" value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} /><FieldError message={errors.fullName} /></div>
          <div><input className="input" type="password" placeholder="Mật khẩu" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} /><FieldError message={errors.password} /></div>
          <div><input className="input" type="password" placeholder="Nhập lại mật khẩu" value={form.confirmPassword} onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} /><FieldError message={errors.confirmPassword} /></div>
          <button className="primaryBtn" disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo tài khoản'}</button>
        </form>

        <div className="miniCard">
          <strong>Quyền lợi khi có tài khoản</strong>
          <span className="muted">Lưu yêu thích, xem lịch sử đơn hàng, đặt lại mật khẩu, cập nhật hồ sơ và thanh toán thuận tiện hơn.</span>
        </div>

        <p className="muted">Đã có tài khoản? <Link href="/login">Đăng nhập</Link></p>
      </div>
    </div>
  );
}

function validate(form: Record<RegisterFields, string>): FieldErrors<RegisterFields> {
  return {
    username: required(form.username, 'Username') || minLength(form.username, 3, 'Username'),
    email: required(form.email, 'Email') || validEmail(form.email),
    fullName: required(form.fullName, 'Họ tên'),
    password: required(form.password, 'Mật khẩu') || minLength(form.password, 6, 'Mật khẩu'),
    confirmPassword: form.confirmPassword === form.password ? '' : 'Mật khẩu nhập lại không khớp.',
  };
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FieldError } from '@/components/Feedback';
import { api } from '@/lib/api';
import { FieldErrors, firstError, minLength, required } from '@/lib/validation';
import { useToast } from '@/providers/ToastProvider';

type ResetFields = 'token' | 'newPassword' | 'confirmNewPassword';

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ token: '', newPassword: '', confirmNewPassword: '' });
  const [errors, setErrors] = useState<FieldErrors<ResetFields>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token') || '';
    if (token) setForm((prev) => ({ ...prev, token }));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    const error = firstError(nextErrors);
    if (error) {
      toast({ type: 'error', title: 'Kiểm tra lại thông tin', message: error });
      return;
    }

    try {
      setLoading(true);
      await api.resetPassword({
        token: form.token.trim(),
        newPassword: form.newPassword,
        confirmNewPassword: form.confirmNewPassword,
      });
      setDone(true);
      toast({ type: 'success', title: 'Đặt lại mật khẩu thành công' });
    } catch (err) {
      toast({ type: 'error', title: 'Không đặt lại được mật khẩu', message: err instanceof Error ? err.message : undefined });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authWrap">
      <div className="card authCard stack16">
        <div className="sectionTitle">
          <h1>Đặt lại mật khẩu</h1>
          <p className="muted">Nhập mã đặt lại mật khẩu và mật khẩu mới để khôi phục quyền truy cập tài khoản.</p>
        </div>

        <form className="stack16" onSubmit={submit}>
          <div>
            <textarea className="input textarea" placeholder="Mã đặt lại mật khẩu" value={form.token} onChange={(e) => setForm((prev) => ({ ...prev, token: e.target.value }))} />
            <FieldError message={errors.token} />
          </div>
          <div>
            <input className="input" type="password" placeholder="Mật khẩu mới" value={form.newPassword} onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
            <FieldError message={errors.newPassword} />
          </div>
          <div>
            <input className="input" type="password" placeholder="Nhập lại mật khẩu mới" value={form.confirmNewPassword} onChange={(e) => setForm((prev) => ({ ...prev, confirmNewPassword: e.target.value }))} />
            <FieldError message={errors.confirmNewPassword} />
          </div>
          <button className="primaryBtn" disabled={loading}>{loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</button>
        </form>

        {done ? (
          <div className="miniCard">
            <strong>Hoàn tất</strong>
            <span className="muted">Bạn có thể đăng nhập lại bằng mật khẩu mới vừa đặt.</span>
          </div>
        ) : null}

        <p className="muted"><Link href="/login">Quay lại đăng nhập</Link></p>
      </div>
    </div>
  );
}

function validate(form: { token: string; newPassword: string; confirmNewPassword: string }): FieldErrors<ResetFields> {
  return {
    token: required(form.token, 'Mã đặt lại mật khẩu'),
    newPassword: required(form.newPassword, 'Mật khẩu mới') || minLength(form.newPassword, 6, 'Mật khẩu mới'),
    confirmNewPassword: form.confirmNewPassword === form.newPassword ? '' : 'Mật khẩu nhập lại không khớp.',
  };
}

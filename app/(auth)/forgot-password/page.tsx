'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FieldError } from '@/components/Feedback';
import { api } from '@/lib/api';
import { firstError, required, validEmail } from '@/lib/validation';
import { useToast } from '@/providers/ToastProvider';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ resetToken?: string | null; expiresAtUtc?: string | null } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const error = required(email, 'Email') || validEmail(email);
    setEmailError(error);
    if (firstError({ email: error })) {
      toast({ type: 'error', title: 'Email chưa hợp lệ', message: error });
      return;
    }

    try {
      setLoading(true);
      const response = await api.forgotPassword(email.trim());
      setResult(response);
      toast({
        type: 'success',
        title: 'Đã gửi yêu cầu đặt lại mật khẩu',
        message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi tới hộp thư của bạn.',
      });
    } catch (err) {
      toast({ type: 'error', title: 'Không gửi được yêu cầu', message: err instanceof Error ? err.message : undefined });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authWrap">
      <div className="card authCard stack16">
        <div className="sectionTitle">
          <h1>Quên mật khẩu</h1>
          <p className="muted">Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu cho tài khoản MobileStore.</p>
        </div>

        <form className="stack16" onSubmit={submit}>
          <div>
            <input className="input" placeholder="Email tài khoản" value={email} onChange={(e) => setEmail(e.target.value)} />
            <FieldError message={emailError} />
          </div>
          <button className="primaryBtn" disabled={loading}>{loading ? 'Đang gửi...' : 'Gửi yêu cầu đặt lại mật khẩu'}</button>
        </form>

        {result ? (
          <div className="miniCard">
            <strong>Yêu cầu đã được tiếp nhận</strong>
            <span className="muted">Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.</span>
            {result.resetToken ? (
              <>
                <span><strong>Mã đặt lại mật khẩu:</strong> {result.resetToken}</span>
                {result.expiresAtUtc ? <span className="muted">Hết hạn lúc: {new Date(result.expiresAtUtc).toLocaleString('vi-VN')}</span> : null}
                <Link href={`/reset-password?token=${encodeURIComponent(result.resetToken)}`} className="ghostBtn">Đi đến trang đặt lại mật khẩu</Link>
              </>
            ) : null}
          </div>
        ) : null}

        <p className="muted"><Link href="/login">Quay lại đăng nhập</Link></p>
      </div>
    </div>
  );
}

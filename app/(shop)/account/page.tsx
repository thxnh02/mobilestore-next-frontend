'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmptyState, FieldError, LoadingState } from '@/components/Feedback';
import { api } from '@/lib/api';
import { Address } from '@/lib/types';
import { formatDate, getImageUrl } from '@/lib/utils';
import { FieldErrors, firstError, minLength, required, validPhone } from '@/lib/validation';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

type ProfileFields = 'fullName' | 'phoneNumber' | 'avatarUrl';
type PasswordFields = 'currentPassword' | 'newPassword' | 'confirmNewPassword';

export default function AccountPage() {
  const { user, token, expiresAtUtc, refreshTokenExpiresAtUtc, refreshProfile, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileErrors, setProfileErrors] = useState<FieldErrors<ProfileFields>>({});
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors<PasswordFields>>({});
  const [profileForm, setProfileForm] = useState({ fullName: '', phoneNumber: '', avatarUrl: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      fullName: user.fullName || '',
      phoneNumber: user.phoneNumber || '',
      avatarUrl: user.avatarUrl || '',
    });
  }, [user]);

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      const [list] = await Promise.all([api.getAddresses(token), refreshProfile()]);
      setAddresses(list);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    void load();
  }, [token]);

  async function makeDefault(id: number) {
    if (!token) return;
    try {
      await api.setDefaultAddress(token, id);
      await load();
      toast({ type: 'success', title: 'Đã đặt làm địa chỉ mặc định' });
    } catch (err) {
      toast({ type: 'error', title: 'Không cập nhật được', message: err instanceof Error ? err.message : undefined });
    }
  }

  async function remove(id: number) {
    if (!token) return;
    try {
      await api.deleteAddress(token, id);
      await load();
      toast({ type: 'success', title: 'Đã xóa địa chỉ' });
    } catch (err) {
      toast({ type: 'error', title: 'Không xóa được địa chỉ', message: err instanceof Error ? err.message : undefined });
    }
  }

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const nextErrors = validateProfile(profileForm);
    setProfileErrors(nextErrors);
    const error = firstError(nextErrors);
    if (error) {
      toast({ type: 'error', title: 'Kiểm tra lại thông tin', message: error });
      return;
    }

    try {
      setSavingProfile(true);
      await api.updateProfile(token, {
        fullName: profileForm.fullName.trim(),
        phoneNumber: profileForm.phoneNumber.trim() || undefined,
        avatarUrl: profileForm.avatarUrl.trim() || undefined,
      });
      await refreshProfile();
      toast({ type: 'success', title: 'Đã cập nhật hồ sơ' });
    } catch (err) {
      toast({ type: 'error', title: 'Không cập nhật được hồ sơ', message: err instanceof Error ? err.message : undefined });
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const nextErrors = validatePassword(passwordForm);
    setPasswordErrors(nextErrors);
    const error = firstError(nextErrors);
    if (error) {
      toast({ type: 'error', title: 'Kiểm tra lại mật khẩu', message: error });
      return;
    }

    try {
      setChangingPassword(true);
      await api.changePassword(token, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmNewPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      toast({ type: 'success', title: 'Đổi mật khẩu thành công' });
    } catch (err) {
      toast({ type: 'error', title: 'Không đổi được mật khẩu', message: err instanceof Error ? err.message : undefined });
    } finally {
      setChangingPassword(false);
    }
  }

  const currentAddressCountText = useMemo(() => `${addresses.length} địa chỉ đã lưu`, [addresses.length]);

  if (authLoading || loading) return <div className="container"><LoadingState title="Đang tải tài khoản..." rows={5} /></div>;
  if (!user) return <div className="container"><EmptyState title="Đăng nhập để quản lý tài khoản" message="Xem thông tin cá nhân, địa chỉ giao hàng và các đơn đã mua trong một nơi duy nhất." href="/login?next=/account" action="Đăng nhập" /></div>;

  return (
    <div className="container stack24">
      <section className="card sectionPad stack16">
        <div className="row gap16 center wrap">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} width={76} height={76} style={{ borderRadius: '20px', objectFit: 'cover' }} />
          ) : (
            <div className="emptyVisual">👤</div>
          )}
          <div>
            <h1 style={{ marginBottom: 8 }}>Tài khoản của bạn</h1>
            <p><strong>{user.fullName}</strong></p>
            <p>{user.email}</p>
            <p className="muted">Tên đăng nhập: {user.username}</p>
            {user.phoneNumber ? <p className="muted">Số điện thoại: {user.phoneNumber}</p> : null}
            <p className="muted">Phiên truy cập hiện tại có hiệu lực đến {formatDate(expiresAtUtc)}.</p>
            <p className="muted">Refresh token còn hiệu lực đến {formatDate(refreshTokenExpiresAtUtc)}.</p>
          </div>
        </div>
        <div className="row gap8 wrap">
          <span className="tabChip">Quản lý hồ sơ</span>
          <span className="tabChip">Địa chỉ giao hàng</span>
          <span className="tabChip">Bảo mật tài khoản</span>
        </div>
      </section>

      <section className="card sectionPad stack16">
        <div className="sectionTitle">
          <h2>Cập nhật hồ sơ</h2>
          <p className="muted">Giữ thông tin cá nhân gọn gàng để thanh toán và hỗ trợ sau mua thuận tiện hơn.</p>
        </div>
        <form className="formGrid" onSubmit={submitProfile}>
          <div>
            <input className="input" placeholder="Họ tên" value={profileForm.fullName} onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))} />
            <FieldError message={profileErrors.fullName} />
          </div>
          <div>
            <input className="input" placeholder="Số điện thoại" value={profileForm.phoneNumber} onChange={(e) => setProfileForm((prev) => ({ ...prev, phoneNumber: e.target.value }))} />
            <FieldError message={profileErrors.phoneNumber} />
          </div>
          <div className="formFull">
            <input className="input" placeholder="Avatar URL" value={profileForm.avatarUrl} onChange={(e) => setProfileForm((prev) => ({ ...prev, avatarUrl: e.target.value }))} />
            <FieldError message={profileErrors.avatarUrl} />
          </div>
          <div className="formFull row gap12 wrap">
            <button className="primaryBtn" disabled={savingProfile}>{savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            <button type="button" className="ghostBtn" onClick={() => setProfileForm({ fullName: user.fullName || '', phoneNumber: user.phoneNumber || '', avatarUrl: user.avatarUrl || '' })}>Khôi phục</button>
          </div>
        </form>
      </section>

      <section className="card sectionPad stack16">
        <div className="sectionTitle">
          <h2>Đổi mật khẩu</h2>
          <p className="muted">Đổi mật khẩu định kỳ để tài khoản an toàn hơn, nhất là khi bạn đã lưu nhiều địa chỉ và đơn hàng.</p>
        </div>
        <form className="formGrid" onSubmit={submitPassword}>
          <div className="formFull">
            <input className="input" type="password" placeholder="Mật khẩu hiện tại" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} />
            <FieldError message={passwordErrors.currentPassword} />
          </div>
          <div>
            <input className="input" type="password" placeholder="Mật khẩu mới" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
            <FieldError message={passwordErrors.newPassword} />
          </div>
          <div>
            <input className="input" type="password" placeholder="Nhập lại mật khẩu mới" value={passwordForm.confirmNewPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmNewPassword: e.target.value }))} />
            <FieldError message={passwordErrors.confirmNewPassword} />
          </div>
          <div className="formFull">
            <button className="primaryBtn" disabled={changingPassword}>{changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}</button>
          </div>
        </form>
      </section>

      <section className="card sectionPad stack16">
        <div className="sectionTitle">
          <h2>Địa chỉ giao hàng</h2>
          <p className="muted">{currentAddressCountText}. Chọn mặc định để checkout nhanh hơn trong các lần mua tiếp theo.</p>
        </div>
        {addresses.length ? (
          <div className="stack12">
            {addresses.map((addr) => (
              <div key={addr.id} className="miniCard">
                <div className="row between center wrap gap12">
                  <strong>{addr.recipientName} {addr.isDefault ? <span className="tag success">Mặc định</span> : null}</strong>
                  <div className="row gap8 wrap">
                    {!addr.isDefault ? <button className="ghostBtn small" onClick={() => void makeDefault(addr.id)}>Đặt mặc định</button> : null}
                    <button className="dangerBtn small" onClick={() => void remove(addr.id)}>Xóa</button>
                  </div>
                </div>
                <span>{addr.phoneNumber}</span>
                <span>{addr.fullAddress || `${addr.addressLine}, ${addr.ward || ''}, ${addr.district || ''}, ${addr.province}`}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Bạn chưa có địa chỉ nhận hàng" message="Thêm một địa chỉ ở bước thanh toán để lưu lại cho những lần mua sau." href="/checkout" action="Thêm địa chỉ" />
        )}
      </section>
    </div>
  );
}

function validateProfile(form: { fullName: string; phoneNumber: string; avatarUrl: string }): FieldErrors<ProfileFields> {
  return {
    fullName: required(form.fullName, 'Họ tên') || minLength(form.fullName, 2, 'Họ tên'),
    phoneNumber: form.phoneNumber.trim() ? validPhone(form.phoneNumber) : '',
    avatarUrl: form.avatarUrl.trim() && !/^https?:\/\//i.test(form.avatarUrl.trim()) ? 'Avatar URL phải bắt đầu bằng http hoặc https.' : '',
  };
}

function validatePassword(form: { currentPassword: string; newPassword: string; confirmNewPassword: string }): FieldErrors<PasswordFields> {
  return {
    currentPassword: required(form.currentPassword, 'Mật khẩu hiện tại'),
    newPassword: required(form.newPassword, 'Mật khẩu mới') || minLength(form.newPassword, 6, 'Mật khẩu mới'),
    confirmNewPassword: form.confirmNewPassword === form.newPassword ? '' : 'Mật khẩu nhập lại không khớp.',
  };
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmptyState, FieldError, LoadingState } from '@/components/Feedback';
import { api } from '@/lib/api';
import { AddressInput, CouponValidation } from '@/lib/types';
import { formatMoney } from '@/lib/utils';
import type { FieldErrors } from '@/lib/validation';
import { firstError, required, validPhone } from '@/lib/validation';
import { useAuth } from '@/providers/AuthProvider';
import { useCart } from '@/providers/CartProvider';
import { useToast } from '@/providers/ToastProvider';
import { useRouter } from 'next/navigation';

type AddressFields = 'recipientName' | 'phoneNumber' | 'addressLine' | 'province';
type PaymentMethod = 'COD' | 'BANK_TRANSFER' | 'VNPAY';

const EMPTY_ADDRESS: AddressInput = {
  recipientName: '',
  phoneNumber: '',
  addressLine: '',
  ward: '',
  district: '',
  province: '',
  country: 'Vietnam',
  postalCode: '',
  note: '',
  isDefault: false,
};

export default function CheckoutPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { items, total, isLoading: cartLoading, clearCart } = useCart();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<AddressInput>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<FieldErrors<AddressFields>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [couponCode, setCouponCode] = useState('');
  const [couponPreview, setCouponPreview] = useState<CouponValidation | null>(null);
  const [note, setNote] = useState('');

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      const list = await api.getAddresses(token);
      setAddresses(list);
      const defaultAddress = list.find((x: any) => x.isDefault) || list[0] || null;
      setAddressId(defaultAddress?.id ?? null);
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

  async function createAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const nextErrors = validateAddress(addressForm);
    setErrors(nextErrors);
    const error = firstError(nextErrors);
    if (error) {
      toast({ type: 'error', title: 'Kiểm tra lại địa chỉ', message: error });
      return;
    }

    try {
      const created = await api.createAddress(token, normalizeAddress(addressForm));
      toast({ type: 'success', title: 'Đã thêm địa chỉ mới' });
      setAddressForm(EMPTY_ADDRESS);
      setAddresses((prev) => [created, ...prev]);
      setAddressId(created.id);
    } catch (err) {
      toast({ type: 'error', title: 'Không thêm được địa chỉ', message: err instanceof Error ? err.message : undefined });
    }
  }

  async function applyCoupon() {
    if (!token || !couponCode.trim()) {
      setCouponPreview(null);
      return;
    }
    try {
      setCheckingCoupon(true);
      const preview = await api.validateCoupon(token, { code: couponCode.trim(), subtotalAmount: total });
      setCouponPreview(preview);
      toast({ type: 'success', title: 'Mã giảm giá hợp lệ', message: `Bạn được giảm ${formatMoney(preview.discountAmount)}` });
    } catch (err) {
      setCouponPreview(null);
      toast({ type: 'error', title: 'Không áp dụng được coupon', message: err instanceof Error ? err.message : undefined });
    } finally {
      setCheckingCoupon(false);
    }
  }

  async function submit() {
    if (!token) return;
    if (!items.length) {
      toast({ type: 'error', title: 'Giỏ hàng đang trống' });
      return;
    }
    if (!addressId) {
      toast({ type: 'error', title: 'Bạn chưa chọn địa chỉ nhận hàng' });
      return;
    }

    try {
      setSubmitting(true);
      const order = await api.checkout(token, {
        addressId,
        paymentMethod,
        couponCode: couponCode.trim() || undefined,
        note: note.trim() || undefined,
      });

      toast({ type: 'success', title: 'Đã tạo đơn hàng', message: order.orderCode });

      if (paymentMethod === 'VNPAY') {
        const payment = await api.createVnpayPaymentUrl(token, { orderId: order.id, locale: 'vn' });
        window.location.assign(payment.paymentUrl);
        return;
      }

      await clearCart().catch(() => undefined);
      router.push(`/orders/${order.id}`);
    } catch (err) {
      toast({ type: 'error', title: 'Đặt hàng thất bại', message: err instanceof Error ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  const defaultAddress = useMemo(() => addresses.find((x: any) => x.id === addressId) || null, [addresses, addressId]);
  const summaryTotal = Math.max((couponPreview?.totalAmount ?? total), 0);

  if (!token) {
    return (
      <div className="container">
        <EmptyState
          title="Đăng nhập để tiếp tục thanh toán"
          message="Bạn cần đăng nhập để chọn địa chỉ nhận hàng, áp mã giảm giá và theo dõi đơn sau khi đặt."
          href="/login?next=/checkout"
          action="Đăng nhập"
        />
      </div>
    );
  }

  if (loading || cartLoading) return <div className="container"><LoadingState title="Đang chuẩn bị trang thanh toán..." rows={5} /></div>;

  return (
    <div className="container checkoutGrid">
      <section className="card sectionPad stack16">
        <div className="sectionTitle">
          <h1>Thông tin thanh toán</h1>
          <p className="muted">Xác nhận địa chỉ giao hàng, mã giảm giá và phương thức thanh toán trước khi đặt đơn.</p>
        </div>

        <div className="card sectionPad stack12">
          <strong>Địa chỉ nhận hàng</strong>
          <select className="input" value={addressId || ''} onChange={(e) => setAddressId(Number(e.target.value))}>
            <option value="">Chọn địa chỉ</option>
            {addresses.map((addr: any) => (
              <option key={addr.id} value={addr.id}>
                {addr.recipientName} - {addr.phoneNumber} - {addr.fullAddress || addr.addressLine}
              </option>
            ))}
          </select>
          <p className="muted small">Bạn có thể thêm địa chỉ mới ngay bên dưới mà không cần rời trang.</p>
        </div>

        <form className="card sectionPad formGrid" onSubmit={createAddress}>
          <h3 className="formFull">Thêm địa chỉ mới</h3>
          <div>
            <input className="input" placeholder="Người nhận" value={addressForm.recipientName} onChange={(e) => setAddressForm((prev) => ({ ...prev, recipientName: e.target.value }))} />
            <FieldError message={errors.recipientName} />
          </div>
          <div>
            <input className="input" placeholder="Số điện thoại" value={addressForm.phoneNumber} onChange={(e) => setAddressForm((prev) => ({ ...prev, phoneNumber: e.target.value }))} />
            <FieldError message={errors.phoneNumber} />
          </div>
          <div className="formFull">
            <input className="input" placeholder="Số nhà, tên đường" value={addressForm.addressLine} onChange={(e) => setAddressForm((prev) => ({ ...prev, addressLine: e.target.value }))} />
            <FieldError message={errors.addressLine} />
          </div>
          <input className="input" placeholder="Phường/Xã" value={addressForm.ward || ''} onChange={(e) => setAddressForm((prev) => ({ ...prev, ward: e.target.value }))} />
          <input className="input" placeholder="Quận/Huyện" value={addressForm.district || ''} onChange={(e) => setAddressForm((prev) => ({ ...prev, district: e.target.value }))} />
          <div>
            <input className="input" placeholder="Tỉnh/Thành phố" value={addressForm.province} onChange={(e) => setAddressForm((prev) => ({ ...prev, province: e.target.value }))} />
            <FieldError message={errors.province} />
          </div>
          <button className="ghostBtn">Lưu địa chỉ</button>
        </form>

        <div className="card sectionPad stack12">
          <h3>Mã giảm giá</h3>
          <div className="row gap12 wrap">
            <input className="input" placeholder="Nhập coupon..." value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
            <button type="button" className="ghostBtn" onClick={() => void applyCoupon()} disabled={checkingCoupon}>
              {checkingCoupon ? 'Đang kiểm tra...' : 'Áp dụng'}
            </button>
          </div>
          {couponPreview ? (
            <div className="summaryList">
              <div className="summaryRow"><span>Mã hợp lệ</span><strong>{couponPreview.couponCode}</strong></div>
              <div className="summaryRow"><span>Giảm giá</span><strong>- {formatMoney(couponPreview.discountAmount)}</strong></div>
              <div className="summaryRow"><span>Tạm tính mới</span><strong>{formatMoney(couponPreview.totalAmount)}</strong></div>
            </div>
          ) : (
          <p className="muted small">Mã hợp lệ sẽ được trừ trực tiếp vào tổng thanh toán trước khi tạo đơn.</p>
          )}
        </div>

        <div>
          <label>Phương thức thanh toán</label>
          <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
            <option value="COD">Thanh toán khi nhận hàng (COD)</option>
            <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
            <option value="VNPAY">VNPay</option>
          </select>
        </div>

        <div>
          <label>Ghi chú cho cửa hàng</label>
          <textarea
            className="input textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="Ví dụ: giao trong giờ hành chính, gọi trước khi giao..."
          />
        </div>

        <button className="primaryBtn" onClick={() => void submit()} disabled={submitting}>
          {submitting ? 'Đang tạo đơn hàng...' : 'Hoàn tất đặt hàng'}
        </button>
      </section>

      <aside className="card sectionPad stack16">
        <h2>Tóm tắt đơn hàng</h2>
        <div className="summaryList">
          <div className="summaryRow"><span>Số sản phẩm</span><strong>{items.length}</strong></div>
          <div className="summaryRow"><span>Tạm tính</span><strong>{formatMoney(total)}</strong></div>
          <div className="summaryRow"><span>Giảm giá</span><strong>- {formatMoney(couponPreview?.discountAmount || 0)}</strong></div>
          <div className="summaryRow"><span>Thành tiền</span><strong>{formatMoney(summaryTotal)}</strong></div>
          <div className="summaryRow"><span>Địa chỉ nhận</span><strong>{defaultAddress ? defaultAddress.recipientName : 'Chưa chọn'}</strong></div>
          <div className="summaryRow"><span>Phương thức</span><strong>{paymentMethod}</strong></div>
        </div>

        <div className="miniCard">
          <strong>Gợi ý</strong>
          <span className="muted">Chọn VNPay để thanh toán online, hoặc COD nếu bạn muốn trả tiền khi nhận hàng.</span>
        </div>
      </aside>
    </div>
  );
}

function validateAddress(form: AddressInput): FieldErrors<AddressFields> {
  return {
    recipientName: required(form.recipientName, 'Người nhận'),
    phoneNumber: required(form.phoneNumber, 'Số điện thoại') || validPhone(form.phoneNumber),
    addressLine: required(form.addressLine, 'Địa chỉ'),
    province: required(form.province, 'Tỉnh/Thành phố'),
  };
}

function normalizeAddress(form: AddressInput): AddressInput {
  return {
    recipientName: form.recipientName.trim(),
    phoneNumber: form.phoneNumber.trim(),
    addressLine: form.addressLine.trim(),
    ward: form.ward?.trim() || null,
    district: form.district?.trim() || null,
    province: form.province.trim(),
    country: form.country || 'Vietnam',
    postalCode: form.postalCode?.trim() || null,
    note: form.note?.trim() || null,
    isDefault: form.isDefault,
  };
}

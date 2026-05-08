import {
  Address,
  AddressInput,
  AdminOverview,
  ApiResponse,
  AuthResponse,
  Cart,
  Category,
  Coupon,
  CouponInput,
  CouponValidation,
  FileUploadResult,
  FlashSaleCampaign,
  FlashSaleInput,
  ForgotPasswordResponse,
  Order,
  PagedResult,
  Payment,
  Product,
  ProductInput,
  ProductQuery,
  Review,
  ReviewSummary,
  User,
  VnPayPaymentUrlResponse,
  WishlistItem,
} from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
const REQUEST_TIMEOUT_MS = 15000;

type ApiRequestOptions = RequestInit & { token?: string | null };

export class ApiError extends Error {
  status: number;
  errors?: unknown;

  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

function queryString(input: ProductQuery | URLSearchParams | string = '') {
  if (typeof input === 'string') return input;
  if (input instanceof URLSearchParams) return input.toString();
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  return params.toString();
}

async function readPayload<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    return { success: response.ok, message: text || response.statusText, data: null };
  }
  return response.json() as Promise<ApiResponse<T>>;
}

function getErrorDetail(errors: unknown) {
  if (!errors || typeof errors !== 'object') return '';
  const detail = (errors as { detail?: unknown }).detail;
  if (typeof detail === 'string') return detail;

  const messages = Object.entries(errors as Record<string, unknown>).flatMap(([field, value]) => {
    if (field === 'detail') return [];
    if (Array.isArray(value)) return value.map((item) => `${field}: ${String(item)}`);
    if (typeof value === 'string') return [`${field}: ${value}`];
    return [];
  });
  return messages.join(' ');
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});
  headers.set('Accept', 'application/json');
  if (!(fetchOptions.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const controller = fetchOptions.signal ? null : new AbortController();
  const timeoutId = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      cache: fetchOptions.cache || 'no-store',
      signal: fetchOptions.signal || controller?.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Kết nối API quá lâu, vui lòng kiểm tra backend rồi thử lại.', 0);
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  const payload = await readPayload<T>(response);
  if (!response.ok || !payload.success) {
    const detail = getErrorDetail(payload.errors);
    const message = response.status === 401 && path !== '/Auth/login'
      ? 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.'
      : detail || payload.message || 'Request failed';
    throw new ApiError(message, response.status, payload.errors);
  }
  return payload.data as T;
}

export const api = {
  getCategories: () => request<Category[]>('/Categories'),
  getCategory: (id: number) => request<Category>(`/Categories/${id}`),
  createCategory: (token: string, body: { categoryCode: string; categoryName: string }) =>
    request<Category>('/Categories', { method: 'POST', body: JSON.stringify(body), token }),
  updateCategory: (token: string, id: number, body: { id: number; categoryCode: string; categoryName: string }) =>
    request<null>(`/Categories/${id}`, { method: 'PUT', body: JSON.stringify(body), token }),
  deleteCategory: (token: string, id: number) => request<null>(`/Categories/${id}`, { method: 'DELETE', token }),

  getProducts: (query: ProductQuery | URLSearchParams | string = '') => {
    const qs = queryString(query);
    return request<PagedResult<Product>>(`/Products${qs ? `?${qs}` : ''}`);
  },
  getProductById: (id: number) => request<Product>(`/Products/${id}`),
  getProductBySlug: (slug: string) => request<Product>(`/Products/slug/${encodeURIComponent(slug)}`),
  createProduct: (token: string, body: ProductInput) => request<Product>('/Products', { method: 'POST', body: JSON.stringify(body), token }),
  updateProduct: (token: string, id: number, body: ProductInput) => request<null>(`/Products/${id}`, { method: 'PUT', body: JSON.stringify({ ...body, id }), token }),
  deleteProduct: (token: string, id: number) => request<null>(`/Products/${id}`, { method: 'DELETE', token }),
  uploadProductImage: (token: string, file: File) => {
    const formData = new FormData();
    formData.set('file', file);
    return request<FileUploadResult>('/Uploads/product-image', { method: 'POST', body: formData, token });
  },
  uploadAvatar: (token: string, file: File) => {
    const formData = new FormData();
    formData.set('file', file);
    return request<FileUploadResult>('/Uploads/avatar', { method: 'POST', body: formData, token });
  },

  getReviews: (productId: number) => request<Review[]>(`/Reviews/product/${productId}`),
  getReviewSummary: (productId: number) => request<ReviewSummary>(`/Reviews/product/${productId}/summary`),
  createReview: (token: string, input: { productId: number; rating: number; comment?: string }) =>
    request<Review>('/Reviews', { method: 'POST', body: JSON.stringify(input), token }),
  updateReview: (token: string, id: number, input: { rating: number; comment?: string }) =>
    request<Review>(`/Reviews/${id}`, { method: 'PUT', body: JSON.stringify(input), token }),
  deleteReview: (token: string, id: number) => request<boolean>(`/Reviews/${id}`, { method: 'DELETE', token }),

  register: (input: { username: string; email: string; fullName: string; password: string; confirmPassword: string }) =>
    request<AuthResponse>('/Auth/register', { method: 'POST', body: JSON.stringify(input) }),
  login: (input: { login: string; password: string }) =>
    request<AuthResponse>('/Auth/login', { method: 'POST', body: JSON.stringify(input) }),
  refresh: (refreshToken: string) =>
    request<AuthResponse>('/Auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  logout: (token: string) => request<null>('/Auth/logout', { method: 'POST', token }),
  me: (token: string) => request<User>('/Auth/me', { token }),
  updateProfile: (token: string, input: { fullName: string; phoneNumber?: string; avatarUrl?: string }) =>
    request<User>('/Auth/profile', { method: 'PUT', body: JSON.stringify(input), token }),
  forgotPassword: (email: string) =>
    request<ForgotPasswordResponse>('/Auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (input: { token: string; newPassword: string; confirmNewPassword: string }) =>
    request<null>('/Auth/reset-password', { method: 'POST', body: JSON.stringify(input) }),
  changePassword: (token: string, input: { currentPassword: string; newPassword: string; confirmNewPassword: string }) =>
    request<null>('/Auth/change-password', { method: 'POST', body: JSON.stringify(input), token }),

  getCart: (token: string) => request<Cart>('/Cart/me', { token }),
  addCartItem: (token: string, productId: number, quantity: number) =>
    request<Cart>('/Cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity }), token }),
  updateCartItem: (token: string, cartItemId: number, quantity: number) =>
    request<Cart>(`/Cart/items/${cartItemId}`, { method: 'PUT', body: JSON.stringify({ quantity }), token }),
  removeCartItem: (token: string, cartItemId: number) => request<Cart>(`/Cart/items/${cartItemId}`, { method: 'DELETE', token }),
  clearCart: (token: string) => request<Cart>('/Cart/clear', { method: 'DELETE', token }),

  getWishlist: (token: string) => request<WishlistItem[]>('/Wishlist/me', { token }),
  addWishlistItem: (token: string, productId: number) =>
    request<WishlistItem[]>('/Wishlist/items', { method: 'POST', body: JSON.stringify({ productId }), token }),
  removeWishlistItem: (token: string, productId: number) =>
    request<WishlistItem[]>(`/Wishlist/items/${productId}`, { method: 'DELETE', token }),
  clearWishlist: (token: string) => request<WishlistItem[]>('/Wishlist/clear', { method: 'DELETE', token }),

  getAddresses: (token: string) => request<Address[]>('/Addresses/me', { token }),
  getAddress: (token: string, id: number) => request<Address>(`/Addresses/${id}`, { token }),
  createAddress: (token: string, body: AddressInput) =>
    request<Address>('/Addresses', { method: 'POST', body: JSON.stringify(body), token }),
  updateAddress: (token: string, id: number, body: AddressInput) =>
    request<Address>(`/Addresses/${id}`, { method: 'PUT', body: JSON.stringify(body), token }),
  setDefaultAddress: (token: string, id: number) => request<boolean>(`/Addresses/${id}/set-default`, { method: 'PUT', token }),
  deleteAddress: (token: string, id: number) => request<boolean>(`/Addresses/${id}`, { method: 'DELETE', token }),

  checkout: (token: string, input: { addressId: number; paymentMethod: 'COD' | 'BANK_TRANSFER' | 'VNPAY'; couponCode?: string; note?: string }) =>
    request<Order>('/Orders/checkout', { method: 'POST', body: JSON.stringify(input), token }),
  getMyOrders: (token: string) => request<Order[]>('/Orders/my-orders', { token }),
  getOrder: (token: string, id: number) => request<Order>(`/Orders/${id}`, { token }),
  getOrderDetail: (token: string, id: number) => request<Order>(`/Orders/${id}/detail`, { token }),
  cancelOrder: (token: string, id: number, reason?: string) =>
    request<Order>(`/Orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }), token }),
  getAdminOrders: (token: string) => request<Order[]>('/Orders/admin/all', { token }),
  getAdminOrderDetail: (token: string, id: number) => request<Order>(`/Orders/admin/${id}`, { token }),
  updateOrderStatus: (token: string, id: number, orderStatus: string) =>
    request<Order>(`/Orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ orderStatus }), token }),

  getMyPayments: (token: string) => request<Payment[]>('/Payments/my-payments', { token }),
  getPayment: (token: string, id: number) => request<Payment>(`/Payments/${id}`, { token }),
  getPaymentByOrder: (token: string, orderId: number) => request<Payment>(`/Payments/order/${orderId}`, { token }),
  getAdminPayments: (token: string) => request<Payment[]>('/Payments/admin/all', { token }),
  updatePaymentStatus: (token: string, id: number, input: { status: string; transactionCode?: string; provider?: string; note?: string }) =>
    request<Payment>(`/Payments/${id}/status`, { method: 'PUT', body: JSON.stringify(input), token }),
  createVnpayPaymentUrl: (token: string, input: { orderId: number; bankCode?: string; locale?: 'vn' | 'en' }) =>
    request<VnPayPaymentUrlResponse>('/Payments/vnpay/create-payment-url', { method: 'POST', body: JSON.stringify(input), token }),

  validateCoupon: (token: string, input: { code: string; subtotalAmount: number }) =>
    request<CouponValidation>('/Coupons/validate', { method: 'POST', body: JSON.stringify(input), token }),
  getAdminCoupons: (token: string) => request<Coupon[]>('/Coupons/admin/all', { token }),
  createCoupon: (token: string, body: CouponInput) => request<Coupon>('/Coupons', { method: 'POST', body: JSON.stringify(body), token }),
  updateCoupon: (token: string, id: number, body: CouponInput) => request<Coupon>(`/Coupons/${id}`, { method: 'PUT', body: JSON.stringify({ ...body, id }), token }),
  deleteCoupon: (token: string, id: number) => request<null>(`/Coupons/${id}`, { method: 'DELETE', token }),

  getActiveFlashSales: () => request<FlashSaleCampaign[]>('/FlashSales/active'),
  getAdminFlashSales: (token: string) => request<FlashSaleCampaign[]>('/FlashSales/admin/all', { token }),
  createFlashSale: (token: string, body: FlashSaleInput) => request<FlashSaleCampaign>('/FlashSales', { method: 'POST', body: JSON.stringify(body), token }),
  updateFlashSale: (token: string, id: number, body: FlashSaleInput) => request<FlashSaleCampaign>(`/FlashSales/${id}`, { method: 'PUT', body: JSON.stringify({ ...body, id }), token }),
  deleteFlashSale: (token: string, id: number) => request<null>(`/FlashSales/${id}`, { method: 'DELETE', token }),

  getAdminOverview: (token: string, query: { revenueDays?: number; recentOrders?: number; topProducts?: number } = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => value !== undefined && params.set(key, String(value)));
    const qs = params.toString();
    return request<AdminOverview>(`/admin-dashboard/overview${qs ? `?${qs}` : ''}`, { token });
  },

  askAssistant: async (message: string) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const payload = await response.json() as { message?: string; error?: string };
    if (!response.ok) throw new Error(payload.error || 'Không gọi được chat API.');
    return payload.message || 'Mình chưa có câu trả lời phù hợp.';
  },
};

export { API_BASE_URL };

export type ApiResponse<T> = { success: boolean; message: string; data: T | null; errors?: unknown };
export type PagedResult<T> = { items: T[]; pageNumber: number; pageSize: number; totalItems: number; totalPages: number };

export type User = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  expiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
  user: User;
};

export type ForgotPasswordResponse = {
  resetToken?: string | null;
  expiresAtUtc?: string | null;
};

export type Category = {
  id: number;
  categoryCode: string;
  categoryName: string;
  productCount: number;
};

export type ProductSpecification = {
  id?: number;
  specKey: string;
  specValue: string;
  sortOrder: number;
};

export type ProductVariant = {
  id?: number;
  sku: string;
  variantName: string;
  color?: string | null;
  storage?: string | null;
  additionalPrice: number;
  stockQuantity: number;
  imageUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type Product = {
  id: number;
  productCode: string;
  productName: string;
  brandName: string;
  slug: string;
  description?: string | null;
  price: number;
  effectivePrice: number;
  isFlashSaleActive: boolean;
  flashSaleCampaignName?: string | null;
  flashSaleEndsAtUtc?: string | null;
  discountPercent: number;
  stockQuantity: number;
  imageUrl?: string | null;
  categoryId: number;
  categoryName: string;
  createdAt: string;
  specifications: ProductSpecification[];
  variants: ProductVariant[];
};

export type ProductQuery = {
  keyword?: string;
  categoryId?: number | string;
  brandName?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  sortBy?: 'id' | 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  pageNumber?: number | string;
  pageSize?: number | string;
};

export type ProductInput = {
  productCode: string;
  productName: string;
  brandName: string;
  slug?: string | null;
  description?: string | null;
  price: number;
  stockQuantity: number;
  imageUrl?: string | null;
  categoryId: number;
  specifications: ProductSpecification[];
  variants: ProductVariant[];
};

export type Review = {
  id: number;
  productId: number;
  userId: number;
  reviewerName: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReviewSummary = {
  productId: number;
  totalReviews: number;
  averageRating: number;
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
};

export type CartItem = {
  cartItemId: number;
  productId: number;
  productCode: string;
  productName: string;
  imageUrl?: string | null;
  price: number;
  stockQuantity: number;
  quantity: number;
  lineTotal: number;
};

export type Cart = {
  cartId: number;
  userId: number;
  totalItems: number;
  totalQuantity: number;
  totalAmount: number;
  items: CartItem[];
};

export type WishlistItem = {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  description?: string | null;
  price: number;
  stockQuantity: number;
  imageUrl?: string | null;
  categoryId: number;
  categoryName: string;
  addedAt: string;
};

export type Address = {
  id: number;
  userId?: number;
  recipientName: string;
  phoneNumber: string;
  addressLine: string;
  ward?: string | null;
  district?: string | null;
  province: string;
  country?: string | null;
  postalCode?: string | null;
  note?: string | null;
  isDefault: boolean;
  fullAddress?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AddressInput = {
  recipientName: string;
  phoneNumber: string;
  addressLine: string;
  ward?: string | null;
  district?: string | null;
  province: string;
  country?: string;
  postalCode?: string | null;
  note?: string | null;
  isDefault?: boolean;
};

export type OrderItem = {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  imageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderPaymentInfo = {
  paymentId: number;
  paymentCode: string;
  paymentMethod: string;
  paymentStatus: string;
  amount: number;
  provider?: string | null;
  transactionCode?: string | null;
  note?: string | null;
  paidAt?: string | null;
  updatedAt?: string | null;
};

export type Order = {
  id: number;
  orderCode: string;
  userId: number;
  customerUsername: string;
  customerEmail: string;
  recipientName: string;
  phoneNumber: string;
  shippingAddress: string;
  note?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  couponCode?: string | null;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
  payment?: OrderPaymentInfo | null;
};

export type Payment = {
  id: number;
  paymentCode: string;
  orderId: number;
  orderCode: string;
  userId: number;
  customerUsername: string;
  customerEmail: string;
  paymentMethod: string;
  status: string;
  amount: number;
  provider?: string | null;
  transactionCode?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt?: string | null;
};

export type Coupon = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  discountType: 'Percent' | 'Amount' | string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  totalUsageLimit?: number | null;
  perUserUsageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  startsAtUtc?: string | null;
  endsAtUtc?: string | null;
  createdAtUtc: string;
};

export type CouponInput = {
  code: string;
  name: string;
  description?: string | null;
  discountType: 'Percent' | 'Amount';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  totalUsageLimit?: number | null;
  perUserUsageLimit?: number | null;
  isActive: boolean;
  startsAtUtc?: string | null;
  endsAtUtc?: string | null;
};

export type CouponValidation = {
  couponId: number;
  couponCode: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  message: string;
};

export type FlashSaleItem = {
  id?: number;
  productId: number;
  productCode?: string;
  productName?: string;
  imageUrl?: string | null;
  originalPrice?: number;
  salePrice: number;
  stockLimit?: number | null;
  soldQuantity?: number;
  sortOrder: number;
};

export type FlashSaleCampaign = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  priority: number;
  startsAtUtc: string;
  endsAtUtc: string;
  createdAtUtc: string;
  items: FlashSaleItem[];
};

export type FlashSaleInput = {
  name: string;
  slug?: string | null;
  description?: string | null;
  isActive: boolean;
  priority: number;
  startsAtUtc: string;
  endsAtUtc: string;
  items: Array<{
    productId: number;
    salePrice: number;
    stockLimit?: number | null;
    sortOrder: number;
  }>;
};

export type VnPayPaymentUrlResponse = {
  orderId: number;
  paymentId: number;
  orderCode: string;
  paymentCode: string;
  paymentUrl: string;
  expiresAtUtc: string;
};

export type FileUploadResult = {
  fileName: string;
  relativePath: string;
  url: string;
  fileSize: number;
};

export type AdminOverview = {
  summary: {
    totalUsers: number;
    activeUsers: number;
    newUsersLast7Days: number;
    totalProducts: number;
    totalCategories: number;
    outOfStockProducts: number;
    totalOrders: number;
    newOrdersLast7Days: number;
    pendingOrders: number;
    confirmedOrders: number;
    shippingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalPayments: number;
    pendingPayments: number;
    paidPayments: number;
    completedRevenue: number;
    paidRevenue: number;
    lowStockProducts: number;
    totalWishlistItems: number;
    totalReviews: number;
  };
  recentOrders: Array<{
    id: number;
    orderCode: string;
    userId: number;
    customerUsername: string;
    customerEmail: string;
    recipientName: string;
    orderStatus: string;
    paymentStatus: string;
    paymentMethod: string;
    totalAmount: number;
    createdAt: string;
  }>;
  revenueSeries: Array<{ date: string; orderCount: number; revenue: number }>;
  topProducts: Array<{ productId: number; productCode: string; productName: string; imageUrl?: string | null; currentStock: number; totalSold: number; orderCount: number; revenue: number }>;
};

# MobileStore Next Frontend Starter

Frontend + admin starter cho backend ASP.NET MobileStore.

## Chạy project
1. `npm install`
2. Tạo `.env.local`
3. Thêm `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api` hoặc đổi sang URL backend thật
4. `npm run dev`

## Route chính
- `/`
- `/products`
- `/products/[id]`
- `/cart`
- `/wishlist`
- `/checkout`
- `/login`
- `/register`
- `/account`
- `/orders`
- `/orders/[id]`
- `/payment/vnpay-demo`
- `/admin`
- `/admin/products`

## Lưu ý
- Backend hiện chưa có create-payment-url/callback VNPay thật nên màn VNPay hiện là demo UX.
- Backend chưa có quên mật khẩu / reset mật khẩu / update profile.

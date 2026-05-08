export type NewsPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: 'Tin tức' | 'Tư vấn' | 'Khuyến mãi';
  author: string;
  publishedAt: string;
  readMinutes: number;
  imageUrl: string;
  tags: string[];
  content: Array<{ heading?: string; body: string }>;
};

export type NewsComment = {
  id: string;
  postSlug: string;
  authorName: string;
  message: string;
  createdAt: string;
};

export const newsPosts: NewsPost[] = [
  {
    slug: 'chon-dien-thoai-hoc-tap-lam-viec-2026',
    title: 'Chọn điện thoại cho học tập và làm việc năm 2026',
    excerpt: 'Những tiêu chí nên ưu tiên khi mua điện thoại để học online, xử lý tài liệu, họp video và dùng bền trong vài năm.',
    category: 'Tư vấn',
    author: 'MobileStore Team',
    publishedAt: '2026-05-03T08:00:00.000Z',
    readMinutes: 5,
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    tags: ['học tập', 'pin', 'hiệu năng'],
    content: [
      {
        heading: 'Ưu tiên pin và màn hình trước',
        body: 'Nếu bạn dùng điện thoại cho học tập hoặc làm việc, pin ổn định và màn hình dễ nhìn thường quan trọng hơn các thông số rất cao nhưng ít dùng tới. Một máy có màn hình sáng, loa rõ và pin đủ một ngày sẽ giúp trải nghiệm hằng ngày nhẹ hơn.',
      },
      {
        heading: 'Hiệu năng nên vừa đủ dư',
        body: 'Hãy chọn cấu hình có RAM và bộ nhớ đủ thoải mái cho ứng dụng học tập, chat, họp video và lưu tài liệu. Nếu bạn hay chỉnh ảnh, quay video hoặc chơi game sau giờ học, nên tăng ngân sách cho chip và bộ nhớ trong.',
      },
      {
        heading: 'Đừng bỏ qua bảo hành',
        body: 'Máy chính hãng, còn hàng rõ ràng và chính sách bảo hành minh bạch giúp bạn yên tâm hơn so với việc chỉ nhìn vào giá thấp nhất. Khi phân vân, hãy so sánh cả chi phí phụ kiện và thời gian hỗ trợ sau mua.',
      },
    ],
  },
  {
    slug: 'vnpay-va-cod-thanh-toan-nao-phu-hop',
    title: 'VNPay và COD: nên chọn cách thanh toán nào?',
    excerpt: 'So sánh nhanh hai hình thức thanh toán phổ biến khi mua điện thoại online tại MobileStore.',
    category: 'Tin tức',
    author: 'MobileStore Team',
    publishedAt: '2026-04-28T09:30:00.000Z',
    readMinutes: 4,
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80',
    tags: ['VNPay', 'COD', 'thanh toán'],
    content: [
      {
        heading: 'COD phù hợp khi muốn kiểm tra lúc nhận',
        body: 'Thanh toán khi nhận hàng giúp bạn chủ động hơn nếu muốn kiểm tra kiện hàng trước khi trả tiền. Đây là lựa chọn quen thuộc cho người mua lần đầu hoặc đơn hàng cần xác nhận thêm thông tin giao nhận.',
      },
      {
        heading: 'VNPay nhanh và gọn hơn',
        body: 'VNPay giúp hoàn tất thanh toán ngay sau khi tạo đơn. Với đơn đã thanh toán, quy trình xử lý thường rõ ràng hơn vì trạng thái giao dịch được ghi nhận trực tiếp trong hệ thống.',
      },
      {
        heading: 'Nên chọn theo thói quen của bạn',
        body: 'Nếu bạn ưu tiên tốc độ và không muốn chuẩn bị tiền mặt, VNPay là lựa chọn hợp lý. Nếu bạn muốn linh hoạt khi nhận hàng, COD vẫn là phương án dễ dùng.',
      },
    ],
  },
  {
    slug: 'meo-san-flash-sale-dien-thoai',
    title: 'Mẹo săn flash sale điện thoại không bị lỡ deal',
    excerpt: 'Một vài cách chuẩn bị trước khi flash sale mở để mua đúng mẫu máy cần thiết thay vì vội chọn theo phần trăm giảm.',
    category: 'Khuyến mãi',
    author: 'MobileStore Team',
    publishedAt: '2026-04-20T07:15:00.000Z',
    readMinutes: 3,
    imageUrl: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1200&q=80',
    tags: ['flash sale', 'deal', 'giá tốt'],
    content: [
      {
        heading: 'Lập danh sách trước',
        body: 'Trước khi săn sale, hãy ghi lại vài mẫu máy phù hợp với nhu cầu và ngân sách. Khi deal mở, bạn chỉ cần so sánh giá hiệu lực, tồn kho và bảo hành thay vì bắt đầu tìm từ đầu.',
      },
      {
        heading: 'Nhìn giá cuối, không chỉ nhìn phần trăm',
        body: 'Một mức giảm lớn chưa chắc là lựa chọn tốt nhất nếu giá gốc cao hoặc máy không hợp nhu cầu. Hãy ưu tiên giá cuối cùng, tình trạng còn hàng và cấu hình thật sự cần dùng.',
      },
      {
        heading: 'Chuẩn bị tài khoản và địa chỉ',
        body: 'Đăng nhập trước, lưu địa chỉ giao hàng và kiểm tra phương thức thanh toán giúp bạn đặt hàng nhanh hơn khi số lượng flash sale có giới hạn.',
      },
    ],
  },
];

export function getNewsPost(slug: string) {
  return newsPosts.find((post) => post.slug === slug) || null;
}

export function getRelatedNews(slug: string) {
  const current = getNewsPost(slug);
  if (!current) return newsPosts.filter((post) => post.slug !== slug).slice(0, 3);

  return newsPosts
    .filter((post) => post.slug !== slug)
    .sort((a, b) => {
      const aScore = Number(a.category === current.category) + a.tags.filter((tag) => current.tags.includes(tag)).length;
      const bScore = Number(b.category === current.category) + b.tags.filter((tag) => current.tags.includes(tag)).length;
      return bScore - aScore;
    })
    .slice(0, 3);
}

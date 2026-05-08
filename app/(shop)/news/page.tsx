import Link from 'next/link';
import { ArrowRight, Clock, MessageSquareText, Newspaper } from 'lucide-react';
import { newsPosts } from '@/lib/news';
import { formatDate } from '@/lib/utils';

export const metadata = {
  title: 'Bản tin MobileStore',
};

export default function NewsPage() {
  const featured = newsPosts[0];
  const posts = newsPosts.slice(1);

  return (
    <div className="container newsPage stack32">
      <section className="newsHero">
        <div className="newsHeroText">
          <span className="saleKicker"><Newspaper size={15} /> Bản tin MobileStore</span>
          <h1>Tin tức, tư vấn và kinh nghiệm mua điện thoại</h1>
          <p>Cập nhật nhanh các bài viết giúp bạn chọn máy, săn deal và dùng dịch vụ mua hàng thuận tiện hơn.</p>
        </div>
        <Link href={`/news/${featured.slug}`} className="newsHeroCard">
          <img src={featured.imageUrl} alt={featured.title} />
          <span className="tag warning">{featured.category}</span>
          <strong>{featured.title}</strong>
          <small>{featured.excerpt}</small>
        </Link>
      </section>

      <section className="stack16">
        <div className="sectionHeader">
          <div className="sectionTitle">
            <span className="sectionKicker">Mới nhất</span>
            <h2>Bài viết nên đọc</h2>
          </div>
          <div className="sectionTabs">
            <span className="tabChip">Tin tức</span>
            <span className="tabChip">Tư vấn</span>
            <span className="tabChip">Khuyến mãi</span>
          </div>
        </div>

        <div className="newsGrid">
          {[featured, ...posts].map((post) => (
            <Link key={post.slug} href={`/news/${post.slug}`} className="newsCard">
              <img src={post.imageUrl} alt={post.title} />
              <div className="newsCardBody">
                <div className="row between center gap12 wrap">
                  <span className="tag">{post.category}</span>
                  <span className="muted small row center gap6"><Clock size={14} /> {post.readMinutes} phút</span>
                </div>
                <h3>{post.title}</h3>
                <p className="muted lineClamp3">{post.excerpt}</p>
                <div className="newsCardFooter">
                  <span>{formatDate(post.publishedAt)}</span>
                  <span className="row center gap6">Đọc tiếp <ArrowRight size={15} /></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="newsSubscribeBand">
        <div>
          <span className="sectionKicker"><MessageSquareText size={15} /> Cộng đồng</span>
          <h2>Đọc bài và để lại bình luận</h2>
          <p>Ở mỗi bài viết, người đọc có thể gửi ý kiến, câu hỏi hoặc kinh nghiệm mua sắm để cùng trao đổi.</p>
        </div>
        <Link href={`/news/${featured.slug}#comments`} className="heroLightBtn">Bình luận ngay</Link>
      </section>
    </div>
  );
}

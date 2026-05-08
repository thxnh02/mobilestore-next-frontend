import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Newspaper, Tag } from 'lucide-react';
import { NewsComments } from '@/components/NewsComments';
import { getNewsPost, getRelatedNews, newsPosts } from '@/lib/news';
import { formatDate } from '@/lib/utils';

type NewsDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return newsPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  const post = getNewsPost(slug);
  return {
    title: post ? `${post.title} | MobileStore` : 'Bản tin MobileStore',
    description: post?.excerpt,
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  const post = getNewsPost(slug);
  if (!post) notFound();

  const related = getRelatedNews(post.slug);

  return (
    <div className="container newsDetailPage stack24">
      <nav className="detailBreadcrumb">
        <Link href="/news" className="row center gap6"><ArrowLeft size={15} /> Bản tin</Link>
        <span>/</span>
        <span>{post.category}</span>
      </nav>

      <article className="newsArticle">
        <header className="newsArticleHeader">
          <span className="saleKicker"><Newspaper size={15} /> {post.category}</span>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
          <div className="newsArticleMeta">
            <span>{post.author}</span>
            <span>{formatDate(post.publishedAt)}</span>
            <span className="row center gap6"><Clock size={14} /> {post.readMinutes} phút đọc</span>
          </div>
        </header>

        <img className="newsArticleImage" src={post.imageUrl} alt={post.title} />

        <div className="newsArticleBody">
          {post.content.map((section) => (
            <section key={section.heading || section.body}>
              {section.heading ? <h2>{section.heading}</h2> : null}
              <p>{section.body}</p>
            </section>
          ))}
        </div>

        <footer className="newsTagRow">
          {post.tags.map((tag) => (
            <span key={tag} className="tabChip"><Tag size={13} /> {tag}</span>
          ))}
        </footer>
      </article>

      <div id="comments">
        <NewsComments slug={post.slug} />
      </div>

      {related.length ? (
        <section className="stack16">
          <div className="sectionHeader">
            <div className="sectionTitle">
              <span className="sectionKicker">Liên quan</span>
              <h2>Bài viết khác</h2>
            </div>
            <Link href="/news" className="ghostBtn small">Xem bản tin</Link>
          </div>
          <div className="newsRelatedGrid">
            {related.map((item) => (
              <Link key={item.slug} href={`/news/${item.slug}`} className="newsRelatedCard">
                <img src={item.imageUrl} alt={item.title} />
                <span className="tag">{item.category}</span>
                <strong>{item.title}</strong>
                <p className="muted lineClamp2">{item.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

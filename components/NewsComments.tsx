'use client';

import { MessageSquare, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FieldError } from '@/components/Feedback';
import { NewsComment } from '@/lib/news';
import { formatDate } from '@/lib/utils';
import { FieldErrors, firstError, required } from '@/lib/validation';

type CommentFields = 'authorName' | 'message';

export function NewsComments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [form, setForm] = useState({ authorName: '', message: '' });
  const [errors, setErrors] = useState<FieldErrors<CommentFields>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let mounted = true;

    fetch(`/api/news/${slug}/comments`, { cache: 'no-store' })
      .then((response) => response.json() as Promise<{ comments?: NewsComment[] }>)
      .then((payload) => {
        if (mounted) setComments(payload.comments || []);
      })
      .catch(() => {
        if (mounted) setNotice('Chưa tải được bình luận. Bạn vẫn có thể thử gửi lại sau.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNotice('');

    const nextErrors = validate(form);
    setErrors(nextErrors);
    const error = firstError(nextErrors);
    if (error) {
      setNotice(error);
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/news/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json() as { comment?: NewsComment; error?: string };
      if (!response.ok || !payload.comment) throw new Error(payload.error || 'Không gửi được bình luận.');

      setComments((prev) => [payload.comment as NewsComment, ...prev]);
      setForm((prev) => ({ authorName: prev.authorName, message: '' }));
      setErrors({});
      setNotice('Bình luận đã được ghi nhận.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không gửi được bình luận.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="newsComments card sectionPad stack16">
      <div className="sectionHeader">
        <div className="sectionTitle">
          <span className="sectionKicker"><MessageSquare size={15} /> Bình luận</span>
          <h2>Trao đổi cùng người đọc</h2>
        </div>
        <span className="tabChip">{comments.length} bình luận</span>
      </div>

      <form className="newsCommentForm" onSubmit={submit}>
        <div>
          <input
            className="input"
            placeholder="Tên của bạn"
            value={form.authorName}
            maxLength={60}
            onChange={(e) => setForm((prev) => ({ ...prev, authorName: e.target.value }))}
          />
          <FieldError message={errors.authorName} />
        </div>
        <div>
          <textarea
            className="input textarea"
            placeholder="Viết bình luận..."
            value={form.message}
            maxLength={600}
            onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
          />
          <FieldError message={errors.message} />
        </div>
        <button className="primaryBtn" disabled={submitting}>
          <Send size={16} /> {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
        </button>
      </form>

      {notice ? <p className="muted small">{notice}</p> : null}

      <div className="newsCommentList">
        {loading ? <p className="muted">Đang tải bình luận...</p> : null}
        {!loading && !comments.length ? <p className="muted">Chưa có bình luận nào. Hãy là người mở đầu cuộc trò chuyện.</p> : null}
        {comments.map((comment) => (
          <article key={comment.id} className="newsCommentItem">
            <div className="newsCommentAvatar">{comment.authorName.slice(0, 1).toUpperCase()}</div>
            <div>
              <div className="row between gap12 wrap">
                <strong>{comment.authorName}</strong>
                <span className="muted small">{formatDate(comment.createdAt)}</span>
              </div>
              <p>{comment.message}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function validate(form: { authorName: string; message: string }): FieldErrors<CommentFields> {
  return {
    authorName: required(form.authorName, 'Tên'),
    message: required(form.message, 'Bình luận'),
  };
}

import Link from 'next/link';

export function LoadingState({ title = 'Đang tải dữ liệu...', rows = 3 }: { title?: string; rows?: number }) {
  return (
    <div className="card sectionPad stack16">
      <p className="muted">{title}</p>
      <div className="skeletonGrid">
        {Array.from({ length: rows }).map((_, index) => (
          <span key={index} className="skeletonLine" />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ title, message, href, action }: { title: string; message?: string; href?: string; action?: string }) {
  return (
    <div className="card emptyState">
      <div className="emptyVisual">🛍️</div>
      <h2>{title}</h2>
      {message ? <p className="muted">{message}</p> : null}
      {href && action ? <Link href={href} className="primaryBtn">{action}</Link> : null}
    </div>
  );
}

export function ErrorState({ title = 'Có lỗi xảy ra', message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div className="card emptyState errorBox">
      <div className="emptyVisual">⚠️</div>
      <h2>{title}</h2>
      {message ? <p className="muted">{message}</p> : null}
      {onRetry ? <button className="primaryBtn" onClick={onRetry}>Thử lại</button> : null}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="fieldError">{message}</p>;
}

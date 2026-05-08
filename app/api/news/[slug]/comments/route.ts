import { NextResponse } from 'next/server';
import { getNewsPost, NewsComment } from '@/lib/news';

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: unknown;
};

type RouteContext = {
  params: Promise<{ slug: string }>;
};

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5187/api';

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  if (!getNewsPost(slug)) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

  try {
    const response = await fetch(`${API_BASE_URL}/News/${encodeURIComponent(slug)}/comments`, { cache: 'no-store' });
    const payload = await response.json() as ApiResponse<NewsComment[]>;
    if (!response.ok || !payload.success) throw new Error(payload.message || 'Cannot load comments.');
    return NextResponse.json({ comments: payload.data || [] });
  } catch {
    return NextResponse.json({ comments: [] });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  if (!getNewsPost(slug)) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

  const body = await request.json().catch(() => ({})) as { authorName?: string; message?: string };
  const authorName = normalizeText(body.authorName, 60);
  const message = normalizeText(body.message, 600);

  if (!authorName) return NextResponse.json({ error: 'Vui lòng nhập tên của bạn.' }, { status: 400 });
  if (!message) return NextResponse.json({ error: 'Vui lòng nhập nội dung bình luận.' }, { status: 400 });

  try {
    const response = await fetch(`${API_BASE_URL}/News/${encodeURIComponent(slug)}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorName, message }),
      cache: 'no-store',
    });
    const payload = await response.json() as ApiResponse<NewsComment>;
    if (!response.ok || !payload.success || !payload.data) throw new Error(payload.message || 'Không gửi được bình luận.');

    return NextResponse.json({ comment: payload.data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không gửi được bình luận.' }, { status: 502 });
  }
}

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

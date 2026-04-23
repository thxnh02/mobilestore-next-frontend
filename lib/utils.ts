export function formatMoney(value: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0); }
export function formatDate(value?: string | null) { if (!value) return '-'; return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
export function getImageUrl(url?: string | null) { return url || 'https://placehold.co/640x640?text=MobileStore'; }
export function cn(...parts: Array<string | false | null | undefined>) { return parts.filter(Boolean).join(' '); }

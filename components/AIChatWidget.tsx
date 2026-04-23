'use client';

import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Send, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import { formatMoney } from '@/lib/utils';

type Message = { role: 'user' | 'assistant'; text: string };

const SUGGESTIONS = [
  'Gợi ý máy giá tốt',
  'Máy nào phù hợp học tập?',
  'Flash sale hôm nay có gì?',
  'Thanh toán VNPay thế nào?',
];

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Xin chào, mình là trợ lý mua sắm của MobileStore. Bạn có thể hỏi về mức giá, sản phẩm phù hợp, coupon, flash sale hoặc cách thanh toán.',
    },
  ]);

  useEffect(() => {
    api
      .getProducts({ pageSize: 12, sortBy: 'createdAt', sortOrder: 'desc' })
      .then((d) => setProducts(d.items))
      .catch(() => undefined);
  }, []);

  const cheap = useMemo(() => [...products].sort((a, b) => a.effectivePrice - b.effectivePrice).slice(0, 3), [products]);
  const latest = useMemo(() => products.slice(0, 3), [products]);

  function fallback(q: string) {
    const text = q.toLowerCase();
    if (text.includes('rẻ') || text.includes('giá tốt') || text.includes('sinh viên')) {
      return cheap.length
        ? `Một vài lựa chọn giá tốt bạn có thể xem: ${cheap.map((x) => `${x.productName} (${formatMoney(x.effectivePrice || x.price)})`).join(', ')}.`
        : 'Hiện mình chưa lấy được dữ liệu sản phẩm để gợi ý giá tốt.';
    }
    if (text.includes('học') || text.includes('làm việc') || text.includes('pin')) {
      return latest.length
        ? `Bạn có thể bắt đầu từ ${latest.map((x) => x.productName).join(', ')} rồi so sánh thêm phần thông số và đánh giá.`
        : 'Mình đang chờ dữ liệu sản phẩm để gợi ý cụ thể hơn.';
    }
    if (text.includes('flash') || text.includes('sale') || text.includes('giảm')) {
      return 'Bạn có thể xem các sản phẩm đang gắn nhãn Flash Sale ở trang chủ hoặc trong danh sách sản phẩm, đồng thời nhập coupon tại bước checkout để tối ưu giá.';
    }
    if (text.includes('vnpay')) {
      return 'Khi chọn VNPay ở bước thanh toán, hệ thống sẽ tạo đơn trước rồi chuyển bạn sang cổng thanh toán để hoàn tất giao dịch.';
    }
    return 'Bạn có thể hỏi về máy giá tốt, sản phẩm phù hợp để học tập, flash sale, coupon hoặc cách thanh toán VNPay.';
  }

  async function send(message?: string) {
    const userText = (message || input).trim();
    if (!userText || sending) return;
    setInput('');
    setSending(true);
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);

    try {
      const answer = await api.askAssistant(userText);
      setMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: fallback(userText) }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chatWidget">
      {open ? (
        <div className="chatPanel card">
          <div className="row between center gap12">
            <div>
              <strong className="row gap8 center"><Sparkles size={16} /> Trợ lý mua sắm</strong>
              <p className="muted small">Hỏi nhanh để được gợi ý trước khi chọn mua.</p>
            </div>
            <button className="ghostBtn small" onClick={() => setOpen(false)}>Đóng</button>
          </div>

          <div className="chatHints">
            {SUGGESTIONS.map((item) => (
              <button key={item} className="chatHint" onClick={() => void send(item)}>
                {item}
              </button>
            ))}
          </div>

          <div className="chatBody">
            {messages.map((m, i) => (
              <div key={i} className={`chatBubble ${m.role}`}>
                {m.text}
              </div>
            ))}
            {sending ? <div className="chatBubble assistant">Mình đang tìm gợi ý phù hợp cho bạn...</div> : null}
          </div>

          <div className="row gap8">
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void send()}
              placeholder="Ví dụ: Gợi ý máy giá tốt dưới 10 triệu"
            />
            <button className="primaryBtn" onClick={() => void send()} disabled={sending} aria-label="Gửi">
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : null}

      <button className="chatFab" onClick={() => setOpen((v) => !v)}>
        <MessageCircle size={18} /> Tư vấn mua hàng
      </button>
    </div>
  );
}

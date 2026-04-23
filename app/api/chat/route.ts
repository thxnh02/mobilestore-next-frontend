import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';
import { ApiResponse, PagedResult, Product } from '@/lib/types';
import { formatMoney } from '@/lib/utils';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { message?: string };
  const message = (body.message || '').trim();
  if (!message) return NextResponse.json({ error: 'Message is required.' }, { status: 400 });

  const products = await loadProducts();
  const aiAnswer = await askOpenAI(message, products);
  if (aiAnswer) return NextResponse.json({ message: aiAnswer });

  const text = message.toLowerCase();
  const byPrice = [...products].sort((a, b) => a.price - b.price);
  const latest = [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const keywordMatches = products.filter((product) => {
    const haystack = `${product.productName} ${product.productCode} ${product.categoryName} ${product.description || ''}`.toLowerCase();
    return text.split(/\s+/).some((word) => word.length > 2 && haystack.includes(word));
  }).slice(0, 4);

  if (text.includes('vnpay')) {
    return NextResponse.json({ message: 'Bạn có thể chọn VNPay ở bước thanh toán. Sau khi tạo đơn, hệ thống sẽ chuyển sang cổng thanh toán để bạn hoàn tất giao dịch.' });
  }

  if (text.includes('rẻ') || text.includes('sinh viên') || text.includes('giá tốt')) {
    return NextResponse.json({ message: byPrice.length ? `Một vài lựa chọn giá dễ tiếp cận: ${byPrice.slice(0, 4).map(formatProduct).join(', ')}.` : 'Hiện mình chưa đọc được dữ liệu sản phẩm phù hợp.' });
  }

  if (text.includes('camera') || text.includes('chụp')) {
    return NextResponse.json({ message: latest.length ? `Bạn có thể xem thêm ${latest.slice(0, 4).map(formatProduct).join(', ')} để so sánh camera và đánh giá.` : 'Hiện mình chưa có đủ dữ liệu để gợi ý camera.' });
  }

  if (text.includes('còn hàng') || text.includes('tồn kho') || text.includes('kho')) {
    const inStock = products.filter((x) => x.stockQuantity > 0).slice(0, 5);
    return NextResponse.json({ message: inStock.length ? `Một số sản phẩm còn hàng: ${inStock.map((x) => `${x.productName} (${x.stockQuantity})`).join(', ')}.` : 'Hiện chưa có sản phẩm còn hàng trong dữ liệu trả về.' });
  }

  if (keywordMatches.length) {
    return NextResponse.json({ message: `Mình tìm thấy vài sản phẩm liên quan: ${keywordMatches.map(formatProduct).join(', ')}.` });
  }

  return NextResponse.json({ message: 'Bạn có thể hỏi về máy giá tốt, sản phẩm còn hàng, camera, thanh toán VNPay hoặc cách chọn điện thoại phù hợp nhu cầu.' });
}

async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/Products?pageSize=24&sortBy=createdAt&sortOrder=desc`, { cache: 'no-store' });
    const payload = await response.json() as ApiResponse<PagedResult<Product>>;
    return payload.data?.items || [];
  } catch {
    return [];
  }
}

function formatProduct(product: Product) {
  return `${product.productName} (${formatMoney(product.price)})`;
}

async function askOpenAI(message: string, products: Product[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return '';

  const productContext = products.slice(0, 20).map((product) => ({
    id: product.id,
    name: product.productName,
    category: product.categoryName,
    price: product.price,
    stock: product.stockQuantity,
    description: product.description,
  }));

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        input: [
          {
            role: 'system',
            content: 'Bạn là tư vấn viên MobileStore. Trả lời ngắn gọn bằng tiếng Việt, lịch sự và mang giọng điệu của một website bán hàng thật. Chỉ dựa trên productContext.',
          },
          {
            role: 'user',
            content: JSON.stringify({ question: message, productContext }),
          },
        ],
      }),
      cache: 'no-store',
    });

    if (!response.ok) return '';
    const payload = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    return payload.output_text || payload.output?.flatMap((item) => item.content || []).map((item) => item.text).filter(Boolean).join('\n') || '';
  } catch {
    return '';
  }
}

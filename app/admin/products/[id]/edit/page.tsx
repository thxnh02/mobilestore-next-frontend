"use client";

import { useParams } from 'next/navigation';
import { ErrorState } from '@/components/Feedback';
import { ProductForm } from '../../ProductForm';

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return <ErrorState title="Mã sản phẩm không hợp lệ" message="Vui lòng quay lại danh sách và chọn sản phẩm cần sửa." />;
  }

  return <ProductForm productId={productId} />;
}

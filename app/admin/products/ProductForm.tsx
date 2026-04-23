"use client";

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmptyState, ErrorState, LoadingState } from '@/components/Feedback';
import { api } from '@/lib/api';
import { Category, Product, ProductInput, ProductSpecification, ProductVariant } from '@/lib/types';
import { getImageUrl } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

const emptySpec = (): ProductSpecification => ({ specKey: '', specValue: '', sortOrder: 0 });
const emptyVariant = (): ProductVariant => ({ sku: '', variantName: '', color: '', storage: '', additionalPrice: 0, stockQuantity: 0, imageUrl: '', isActive: true, sortOrder: 0 });
const emptyForm = (categoryId = 0): ProductInput => ({ productCode: '', productName: '', brandName: '', slug: '', description: '', price: 0, stockQuantity: 0, imageUrl: '', categoryId, specifications: [emptySpec()], variants: [emptyVariant()] });

type ProductFormProps = {
  productId?: number;
};

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const { token } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductInput>(emptyForm());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productCodeManuallyEdited, setProductCodeManuallyEdited] = useState(Boolean(productId));
  const [error, setError] = useState('');

  const editingId = productId ?? null;
  const title = editingId ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm mới';

  async function load() {
    if (!token) return;

    try {
      setLoading(true);
      setError('');
      const [productResult, categoryResult, currentProduct] = await Promise.all([
        api.getProducts({ pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' }),
        api.getCategories(),
        editingId ? api.getProductById(editingId) : Promise.resolve<Product | null>(null),
      ]);

      setProducts(productResult.items);
      setCategories(categoryResult);
      setForm(currentProduct ? productToForm(currentProduct) : emptyForm(categoryResult[0]?.id || 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu sản phẩm.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [token, editingId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    try {
      setSubmitting(true);
      const payload = normalize(form, makeUniqueProductCode(form.productName, products, editingId));
      const formError = validateProduct(payload);
      if (formError) {
        toast({ type: 'error', title: 'Chưa thể lưu sản phẩm', message: formError });
        return;
      }

      if (editingId) {
        await api.updateProduct(token, editingId, payload);
      } else {
        await api.createProduct(token, payload);
      }

      toast({ type: 'success', title: editingId ? 'Đã cập nhật sản phẩm' : 'Đã tạo sản phẩm' });
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      toast({ type: 'error', title: 'Lưu sản phẩm thất bại', message: err instanceof Error ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  function updateProductName(value: string) {
    setForm((prev) => ({
      ...prev,
      productName: value,
      productCode: productCodeManuallyEdited ? prev.productCode : makeUniqueProductCode(value, products, editingId),
      slug: slugify(value),
    }));
  }

  function updateProductCode(value: string) {
    setProductCodeManuallyEdited(true);
    setForm((prev) => ({ ...prev, productCode: sanitizeProductCode(value) }));
  }

  function regenerateProductCode() {
    setProductCodeManuallyEdited(false);
    setForm((prev) => ({ ...prev, productCode: makeUniqueProductCode(prev.productName, products, editingId) }));
  }

  function regenerateSlug() {
    setForm((prev) => ({ ...prev, slug: slugify(prev.productName) }));
  }

  function resetNewForm() {
    setProductCodeManuallyEdited(false);
    setForm(emptyForm(categories[0]?.id || 0));
  }

  async function uploadImage(file?: File) {
    if (!token || !file) return;
    if (!file.type.startsWith('image/')) {
      toast({ type: 'error', title: 'File ảnh chưa hợp lệ', message: 'Vui lòng chọn file JPG, PNG, WEBP hoặc GIF.' });
      return;
    }

    try {
      setUploadingImage(true);
      const uploaded = await api.uploadProductImage(token, file);
      setForm((prev) => ({ ...prev, imageUrl: uploaded.url }));
      toast({ type: 'success', title: 'Đã tải ảnh sản phẩm' });
    } catch (err) {
      toast({ type: 'error', title: 'Tải ảnh thất bại', message: err instanceof Error ? err.message : undefined });
    } finally {
      setUploadingImage(false);
    }
  }

  const imageAlt = useMemo(() => form.productName || 'Ảnh sản phẩm', [form.productName]);

  if (loading) return <LoadingState title="Đang tải biểu mẫu sản phẩm..." rows={7} />;
  if (error) return <ErrorState title="Không tải được biểu mẫu sản phẩm" message={error} onRetry={load} />;
  if (!categories.length) return <EmptyState title="Chưa có danh mục" message="Vui lòng tạo danh mục trước khi thêm sản phẩm." />;

  return (
    <div className="stack24">
      <section className="card sectionPad stack16">
        <div className="row between center wrap gap12">
          <div>
            <p className="eyebrow">Admin / Sản phẩm</p>
            <h2>{title}</h2>
          </div>
          <Link href="/admin/products" className="ghostBtn">Quay lại danh sách</Link>
        </div>

        <form className="grid formGrid" onSubmit={submit}>
          <div className="row gap8 center">
            <input className="input" placeholder="Mã sản phẩm" maxLength={20} required value={form.productCode} onChange={(e) => updateProductCode(e.target.value)} />
            <button type="button" className="ghostBtn small stableBtn" onClick={regenerateProductCode}>Tự tạo</button>
          </div>
          <input className="input" placeholder="Tên sản phẩm" maxLength={100} required value={form.productName} onChange={(e) => updateProductName(e.target.value)} />
          <input className="input" placeholder="Thương hiệu" maxLength={100} required value={form.brandName} onChange={(e) => setForm((prev) => ({ ...prev, brandName: e.target.value }))} />
          <div className="row gap8 center">
            <input className="input" placeholder="Slug tự tạo từ tên sản phẩm" value={form.slug || ''} readOnly />
            <button type="button" className="ghostBtn small stableBtn" onClick={regenerateSlug}>Tự tạo</button>
          </div>
          <input className="input" type="number" min={1} placeholder="Giá bán" required value={form.price || ''} onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))} />
          <input className="input" type="number" min={0} placeholder="Tồn kho" required value={form.stockQuantity} onChange={(e) => setForm((prev) => ({ ...prev, stockQuantity: Number(e.target.value) }))} />
          <select className="input" required value={form.categoryId} onChange={(e) => setForm((prev) => ({ ...prev, categoryId: Number(e.target.value) }))}>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.categoryName}</option>)}
          </select>
          <div className="adminImageField">
            <div className="adminImagePreview">
              <img src={getImageUrl(form.imageUrl)} alt={imageAlt} />
            </div>
            <div className="stack12">
              <input className="input" placeholder="URL ảnh sản phẩm" value={form.imageUrl || ''} onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))} />
              <label className={`ghostBtn small adminUploadButton ${uploadingImage ? 'disabled' : ''}`}>
                {uploadingImage ? 'Đang tải ảnh...' : 'Tải ảnh lên'}
                <input type="file" accept="image/*" disabled={uploadingImage} onChange={(e) => void uploadImage(e.target.files?.[0])} />
              </label>
            </div>
          </div>
          <div className="formFull"><textarea className="input textarea" placeholder="Mô tả" value={form.description || ''} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} /></div>
          <div className="formFull stack12">
            <div className="row between center"><strong>Thông số kỹ thuật</strong><button type="button" className="ghostBtn small" onClick={() => setForm((prev) => ({ ...prev, specifications: [...prev.specifications, emptySpec()] }))}>Thêm</button></div>
            {form.specifications.map((spec, index) => <div key={`spec-${index}`} className="grid formGrid"><input className="input" placeholder="Tên thông số" value={spec.specKey} onChange={(e) => setForm((prev) => ({ ...prev, specifications: prev.specifications.map((item, idx) => idx === index ? { ...item, specKey: e.target.value } : item) }))} /><input className="input" placeholder="Giá trị" value={spec.specValue} onChange={(e) => setForm((prev) => ({ ...prev, specifications: prev.specifications.map((item, idx) => idx === index ? { ...item, specValue: e.target.value } : item) }))} /></div>)}
          </div>
          <div className="formFull stack12">
            <div className="row between center"><strong>Biến thể sản phẩm</strong><button type="button" className="ghostBtn small" onClick={() => setForm((prev) => ({ ...prev, variants: [...prev.variants, emptyVariant()] }))}>Thêm</button></div>
            {form.variants.map((variant, index) => <div key={`variant-${index}`} className="grid formGrid"><input className="input" placeholder="SKU" value={variant.sku} onChange={(e) => setForm((prev) => ({ ...prev, variants: prev.variants.map((item, idx) => idx === index ? { ...item, sku: e.target.value } : item) }))} /><input className="input" placeholder="Tên biến thể" value={variant.variantName} onChange={(e) => setForm((prev) => ({ ...prev, variants: prev.variants.map((item, idx) => idx === index ? { ...item, variantName: e.target.value } : item) }))} /><input className="input" placeholder="Màu" value={variant.color || ''} onChange={(e) => setForm((prev) => ({ ...prev, variants: prev.variants.map((item, idx) => idx === index ? { ...item, color: e.target.value } : item) }))} /><input className="input" placeholder="Dung lượng" value={variant.storage || ''} onChange={(e) => setForm((prev) => ({ ...prev, variants: prev.variants.map((item, idx) => idx === index ? { ...item, storage: e.target.value } : item) }))} /><input className="input" type="number" placeholder="Giá cộng thêm" value={variant.additionalPrice} onChange={(e) => setForm((prev) => ({ ...prev, variants: prev.variants.map((item, idx) => idx === index ? { ...item, additionalPrice: Number(e.target.value) } : item) }))} /><input className="input" type="number" placeholder="Tồn kho" value={variant.stockQuantity} onChange={(e) => setForm((prev) => ({ ...prev, variants: prev.variants.map((item, idx) => idx === index ? { ...item, stockQuantity: Number(e.target.value) } : item) }))} /></div>)}
          </div>
          <div className="row gap12 wrap formFull">
            <button className="primaryBtn" disabled={submitting || uploadingImage}>{submitting ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo sản phẩm'}</button>
            {!editingId ? <button type="button" className="ghostBtn" onClick={resetNewForm}>Làm mới</button> : null}
            <Link href="/admin/products" className="ghostBtn">Hủy</Link>
          </div>
        </form>
      </section>
    </div>
  );
}

function productToForm(product: Product): ProductInput {
  return {
    productCode: product.productCode,
    productName: product.productName,
    brandName: product.brandName,
    slug: product.slug,
    description: product.description || '',
    price: product.price,
    stockQuantity: product.stockQuantity,
    imageUrl: product.imageUrl || '',
    categoryId: product.categoryId,
    specifications: product.specifications.length ? product.specifications : [emptySpec()],
    variants: product.variants.length ? product.variants : [emptyVariant()],
  };
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sanitizeProductCode(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'd')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 20);
}

function makeProductCodeBase(productName: string) {
  const compact = slugify(productName).replace(/-/g, '').toUpperCase();
  return (compact || 'SP').slice(0, 20);
}

function makeUniqueProductCode(productName: string, products: Product[], editingId: number | null) {
  const base = makeProductCodeBase(productName);
  const usedCodes = new Set(products.filter((product) => product.id !== editingId).map((product) => product.productCode.toUpperCase()));
  if (!usedCodes.has(base)) return base;

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const suffixText = `-${suffix}`;
    const candidate = `${base.slice(0, 20 - suffixText.length)}${suffixText}`;
    if (!usedCodes.has(candidate)) return candidate;
  }

  return `${base.slice(0, 13)}-${Date.now().toString().slice(-6)}`.slice(0, 20);
}

function validateProduct(form: ProductInput) {
  if (!form.productCode.trim()) return 'Vui lòng nhập hoặc tự tạo mã sản phẩm.';
  if (!form.productName.trim()) return 'Vui lòng nhập tên sản phẩm.';
  if (!form.brandName.trim()) return 'Vui lòng nhập thương hiệu.';
  if (!form.categoryId) return 'Vui lòng chọn danh mục.';
  if (!Number.isFinite(form.price) || form.price <= 0) return 'Giá bán phải lớn hơn 0.';
  if (!Number.isInteger(form.stockQuantity) || form.stockQuantity < 0) return 'Tồn kho phải là số nguyên từ 0 trở lên.';
  return '';
}

function normalize(form: ProductInput, fallbackProductCode: string): ProductInput {
  return {
    ...form,
    productCode: sanitizeProductCode(form.productCode) || fallbackProductCode,
    productName: form.productName.trim(),
    brandName: form.brandName.trim(),
    slug: form.slug?.trim() || null,
    description: form.description?.trim() || null,
    price: Number(form.price) || 0,
    stockQuantity: Math.max(0, Math.trunc(Number(form.stockQuantity) || 0)),
    imageUrl: form.imageUrl?.trim() || null,
    specifications: form.specifications
      .filter((item) => item.specKey.trim() && item.specValue.trim())
      .map((item) => ({ ...item, specKey: item.specKey.trim(), specValue: item.specValue.trim() })),
    variants: form.variants
      .filter((item) => item.sku.trim() && item.variantName.trim())
      .map((item) => ({
        ...item,
        sku: sanitizeProductCode(item.sku),
        variantName: item.variantName.trim(),
        color: item.color?.trim() || null,
        storage: item.storage?.trim() || null,
        imageUrl: item.imageUrl?.trim() || null,
        additionalPrice: Number(item.additionalPrice) || 0,
        stockQuantity: Math.max(0, Math.trunc(Number(item.stockQuantity) || 0)),
      })),
  };
}

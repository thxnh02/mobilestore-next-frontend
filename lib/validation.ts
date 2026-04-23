export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

export function required(value: string, label: string) {
  return value.trim() ? '' : `${label} không được để trống.`;
}

export function minLength(value: string, min: number, label: string) {
  return value.trim().length >= min ? '' : `${label} cần ít nhất ${min} ký tự.`;
}

export function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Email chưa đúng định dạng.';
}

export function validPhone(value: string) {
  return /^[0-9+()\-\s]{8,20}$/.test(value.trim()) ? '' : 'Số điện thoại chưa hợp lệ.';
}

export function positiveNumber(value: number, label: string) {
  return Number.isFinite(value) && value > 0 ? '' : `${label} phải lớn hơn 0.`;
}

export function nonNegativeNumber(value: number, label: string) {
  return Number.isFinite(value) && value >= 0 ? '' : `${label} không được âm.`;
}

export function firstError(errors: FieldErrors) {
  return Object.values(errors).find(Boolean) || '';
}

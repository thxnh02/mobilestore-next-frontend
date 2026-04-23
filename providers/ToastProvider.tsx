'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';
type ToastInput = { type?: ToastType; title: string; message?: string };
type ToastItem = ToastInput & { id: number; type: ToastType };
type ToastContextValue = { toast: (input: ToastInput) => void };

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((input: ToastInput) => {
    const id = Date.now() + Math.random();
    const item: ToastItem = { type: input.type || 'info', title: input.title, message: input.message, id };
    setItems((prev) => [...prev, item]);
    window.setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 4200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toastStack" aria-live="polite">
        {items.map((item) => (
          <button key={item.id} className={`toast toast-${item.type}`} onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}>
            <strong>{item.title}</strong>
            {item.message && <span>{item.message}</span>}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

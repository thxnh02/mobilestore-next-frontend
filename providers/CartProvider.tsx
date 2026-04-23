'use client';
import { api } from '@/lib/api';
import { CartItem, Product } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
type LocalCartItem = { productId: number; productName: string; price: number; stockQuantity: number; imageUrl?: string | null; quantity: number };
type CartContextValue = { items: LocalCartItem[]; count: number; total: number; isLoading: boolean; addToCart: (product: Product, quantity?: number) => Promise<void>; changeQuantity: (productId: number, quantity: number) => Promise<void>; removeItem: (productId: number) => Promise<void>; clearCart: () => Promise<void>; syncGuestCart: (authToken?: string) => Promise<void> };
const CartContext = createContext<CartContextValue | undefined>(undefined);
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const raw = localStorage.getItem('ms_guest_cart');
    if (!raw) return;
    try { setItems(JSON.parse(raw)); } catch { localStorage.removeItem('ms_guest_cart'); }
  }, []);
  useEffect(() => { if (!isAuthenticated) localStorage.setItem('ms_guest_cart', JSON.stringify(items)); }, [items, isAuthenticated]);
  useEffect(() => { async function load() { if (!token || !isAuthenticated) return; try { setIsLoading(true); const cart = await api.getCart(token); setItems(cart.items.map(serverToLocal)); } catch {} finally { setIsLoading(false); } } load(); }, [token, isAuthenticated]);
  async function addToCart(product: Product, quantity = 1) { if (token && isAuthenticated) { await api.addCartItem(token, product.id, quantity); const cart = await api.getCart(token); setItems(cart.items.map(serverToLocal)); return; } setItems(prev => { const found = prev.find(x => x.productId === product.id); if (found) return prev.map(x => x.productId === product.id ? { ...x, stockQuantity: product.stockQuantity, quantity: x.quantity + quantity } : x); return [...prev, { productId: product.id, productName: product.productName, price: product.price, stockQuantity: product.stockQuantity, imageUrl: product.imageUrl, quantity }]; }); }
  async function changeQuantity(productId: number, quantity: number) { if (quantity <= 0) return removeItem(productId); if (token && isAuthenticated) { const cart = await api.getCart(token); const found = cart.items.find(x => x.productId === productId); if (!found) return; await api.updateCartItem(token, found.cartItemId, quantity); const updated = await api.getCart(token); setItems(updated.items.map(serverToLocal)); return; } setItems(prev => prev.map(x => x.productId === productId ? { ...x, quantity } : x)); }
  async function removeItem(productId: number) { if (token && isAuthenticated) { const cart = await api.getCart(token); const found = cart.items.find(x => x.productId === productId); if (found) { await api.removeCartItem(token, found.cartItemId); const updated = await api.getCart(token); setItems(updated.items.map(serverToLocal)); return; } } setItems(prev => prev.filter(x => x.productId !== productId)); }
  async function clearCart() { if (token && isAuthenticated) { const cart = await api.clearCart(token); setItems(cart.items.map(serverToLocal)); return; } setItems([]); localStorage.removeItem('ms_guest_cart'); }
  async function syncGuestCart(authToken?: string) { const activeToken = authToken || token; const raw = localStorage.getItem('ms_guest_cart'); const snapshot = raw ? JSON.parse(raw) as LocalCartItem[] : [...items]; if (!activeToken || !snapshot.length) return; for (const item of snapshot) await api.addCartItem(activeToken, item.productId, item.quantity); const cart = await api.getCart(activeToken); setItems(cart.items.map(serverToLocal)); localStorage.removeItem('ms_guest_cart'); }
  const count = items.reduce((s, i) => s + i.quantity, 0); const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const value = useMemo(() => ({ items, count, total, isLoading, addToCart, changeQuantity, removeItem, clearCart, syncGuestCart }), [items, count, total, isLoading, token, isAuthenticated]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
function serverToLocal(item: CartItem): LocalCartItem { return { productId: item.productId, productName: item.productName, price: item.price, stockQuantity: item.stockQuantity, imageUrl: item.imageUrl, quantity: item.quantity }; }
export function useCart() { const ctx = useContext(CartContext); if (!ctx) throw new Error('useCart must be used within CartProvider'); return ctx; }

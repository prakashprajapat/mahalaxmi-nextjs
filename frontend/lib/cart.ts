'use client';
import type { CartItem, Product } from '@/types';

const CART_KEY = 'mfh_cart';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveCart(cart: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cart-updated'));
}

export function addToCart(product: Product, quantity = 1, size?: string): void {
  const cart = getCart();
  const key = `${product.dbId}-${size ?? ''}`;
  const idx = cart.findIndex(i => `${i.dbId}-${i.selectedSize ?? ''}` === key);
  if (idx >= 0) {
    cart[idx].quantity += quantity;
  } else {
    cart.push({ ...product, quantity, selectedSize: size });
  }
  saveCart(cart);
}

export function removeFromCart(dbId: number, size?: string): void {
  const cart = getCart().filter(i => `${i.dbId}-${i.selectedSize ?? ''}` !== `${dbId}-${size ?? ''}`);
  saveCart(cart);
}

export function updateQuantity(dbId: number, quantity: number, size?: string): void {
  const cart = getCart();
  const idx = cart.findIndex(i => `${i.dbId}-${i.selectedSize ?? ''}` === `${dbId}-${size ?? ''}`);
  if (idx >= 0) {
    if (quantity <= 0) cart.splice(idx, 1);
    else cart[idx].quantity = quantity;
  }
  saveCart(cart);
}

export function clearCart(): void {
  saveCart([]);
}

export function cartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, i) => sum + (i.discountPrice ?? i.price) * i.quantity, 0);
}

export function cartCount(cart: CartItem[]): number {
  return cart.reduce((sum, i) => sum + i.quantity, 0);
}

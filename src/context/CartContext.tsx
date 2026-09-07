import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, Product, CakeCustomization } from '../types';

interface CartContextType {
  items: CartItem[];
  addProduct: (product: Product, quantity?: number) => void;
  addCustomCake: (customization: CakeCustomization, price: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('smartbaking_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('smartbaking_cart', JSON.stringify(items));
  }, [items]);

  function addProduct(product: Product, quantity = 1) {
    setItems(prev => {
      const existing = prev.find(i => i.product?.id === product.id && !i.is_custom);
      if (existing) {
        return prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, {
        id: `${product.id}-${Date.now()}`,
        product,
        quantity,
        unit_price: product.base_price,
        is_custom: false,
      }];
    });
  }

  function addCustomCake(customization: CakeCustomization, price: number) {
    const id = `custom-${Date.now()}`;
    setItems(prev => [...prev, {
      id,
      customization,
      quantity: 1,
      unit_price: price,
      is_custom: true,
    }]);
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) { removeItem(id); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addProduct, addCustomCake, removeItem, updateQuantity, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

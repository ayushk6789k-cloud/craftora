import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';
import { apiRequest } from '../services/api';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<{ success: boolean; message?: string; error?: string }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<{ success: boolean; message?: string; error?: string }>;
  removeFromCart: (itemId: string) => Promise<boolean>;
  refreshCart: () => Promise<void>;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [itemCount, setItemCount] = useState<number>(0);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  const refreshCart = async () => {
    try {
      const res = await apiRequest('/cart');
      if (res.success && res.data) {
        setItems(res.data.items || []);
        setItemCount(res.data.item_count || 0);
        setSubtotal(res.data.subtotal || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addToCart = async (productId: string, quantity = 1) => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      if (res.success) {
        await refreshCart();
        setIsCartDrawerOpen(true);
        return { success: true, message: res.message };
      }
      return { success: false, error: res.error || 'Failed to add item to cart' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const res = await apiRequest(`/cart/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      });
      if (res.success) {
        await refreshCart();
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const res = await apiRequest(`/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        await refreshCart();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

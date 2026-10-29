import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Product } from '../types';

interface WishlistContextType {
  wishlistIds: string[];
  wishlistProducts: Product[];
  toggleWishlist: (product: Product) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);

  const refreshWishlist = async () => {
    try {
      const res = await apiRequest('/wishlist');
      if (res.success && res.data) {
        const list = res.data.wishlist || [];
        setWishlistIds(list.map((item: any) => item.product_id));
        setWishlistProducts(list.map((item: any) => item.product).filter(Boolean));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshWishlist();
  }, []);

  const isInWishlist = (productId: string) => wishlistIds.includes(productId);

  const toggleWishlist = async (product: Product) => {
    if (isInWishlist(product.id)) {
      // Remove
      setWishlistIds((prev) => prev.filter((id) => id !== product.id));
      setWishlistProducts((prev) => prev.filter((p) => p.id !== product.id));
      await apiRequest(`/wishlist/${product.id}`, { method: 'DELETE' });
      return false;
    } else {
      // Add
      setWishlistIds((prev) => [...prev, product.id]);
      setWishlistProducts((prev) => [...prev, product]);
      await apiRequest('/wishlist', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id }),
      });
      return true;
    }
  };

  const removeFromWishlist = async (productId: string) => {
    setWishlistIds((prev) => prev.filter((id) => id !== productId));
    setWishlistProducts((prev) => prev.filter((p) => p.id !== productId));
    await apiRequest(`/wishlist/${productId}`, { method: 'DELETE' });
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistProducts,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};

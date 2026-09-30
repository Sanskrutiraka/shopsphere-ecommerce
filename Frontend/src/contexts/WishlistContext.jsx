import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState({ items: [] });
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const fetchWishlist = async () => {
    if (!user || user.role !== 'CUSTOMER') {
      setWishlist({ items: [] });
      return;
    }
    try {
      setWishlistLoading(true);
      const { data } = await api.get('/products/wishlist/');
      setWishlist(data || { items: [] });
    } catch {
      setWishlist({ items: [] });
    } finally {
      setWishlistLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const isInWishlist = (productId) => {
    if (!productId || !wishlist.items) return false;
    return wishlist.items.some(
      (item) => item.product?.id === productId || item.product === productId
    );
  };

  const addToWishlist = async (productId) => {
    const res = await api.post('/products/wishlist/', { product_id: productId });
    await fetchWishlist();
    return res.data;
  };

  const removeFromWishlist = async (productId) => {
    const res = await api.delete('/products/wishlist/', { data: { product_id: productId } });
    await fetchWishlist();
    return res.data;
  };

  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
      return { action: 'removed', message: 'Removed from wishlist' };
    } else {
      await addToWishlist(productId);
      return { action: 'added', message: 'Added to wishlist!' };
    }
  };

  const wishlistCount = wishlist.items?.length || 0;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount,
        wishlistLoading,
        isInWishlist,
        fetchWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0, item_count: 0 });
  const [cartLoading, setCartLoading] = useState(false);

  const fetchCart = async () => {
    if (!user || user.role !== 'CUSTOMER') return;
    try {
      setCartLoading(true);
      const { data } = await api.get('/orders/cart/');
      setCart(data);
    } catch {}
    finally { setCartLoading(false); }
  };

  useEffect(() => { fetchCart(); }, [user]);

  const addToCart = async (productId, quantity = 1) => {
    const { data } = await api.post('/orders/cart/', { product_id: productId, quantity });
    setCart(data);
    return data;
  };

  const updateItem = async (itemId, quantity) => {
    const { data } = await api.put('/orders/cart/', { item_id: itemId, quantity });
    setCart(data);
  };

  const removeItem = async (itemId) => {
    const { data } = await api.delete('/orders/cart/', { data: { item_id: itemId } });
    setCart(data);
  };

  const clearCart = async () => {
    await api.delete('/orders/cart/', { data: { clear_all: true } });
    setCart({ items: [], total: 0, item_count: 0 });
  };

  return (
    <CartContext.Provider value={{ cart, cartLoading, fetchCart, addToCart, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

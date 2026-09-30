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
    const { data } = await api.delete('/orders/cart/', { data: { clear_all: true } });
    setCart(data);
  };

  const getItemQuantity = (productId) => {
    const item = cart.items?.find(i => (i.product?.id === productId || i.product_id === productId || i.product === productId));
    return item ? item.quantity : 0;
  };

  const getCartItem = (productId) => {
    return cart.items?.find(i => (i.product?.id === productId || i.product_id === productId || i.product === productId)) || null;
  };

  const updateProductQuantity = async (productId, newQuantity) => {
    const item = getCartItem(productId);
    if (newQuantity <= 0) {
      if (item) {
        return await removeItem(item.id);
      }
      return;
    }
    if (item) {
      return await updateItem(item.id, newQuantity);
    } else {
      return await addToCart(productId, newQuantity);
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      cartLoading,
      fetchCart,
      addToCart,
      updateItem,
      removeItem,
      clearCart,
      getItemQuantity,
      getCartItem,
      updateProductQuantity
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

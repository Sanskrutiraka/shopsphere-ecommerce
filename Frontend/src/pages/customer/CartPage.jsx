import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Package, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

export default function CartPage() {
  const { cart, updateItem, removeItem, clearCart, cartLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (cartLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <h1 className="text-3xl font-black mb-8">Shopping Cart</h1>
        <div className="flex gap-8">
          <div className="flex-1 space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 neo-border" />)}
          </div>
          <div className="w-96 h-64 bg-gray-200 neo-border" />
        </div>
      </div>
    );
  }

  if (!cart.items?.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 bg-gray-100 flex items-center justify-center rounded-full mx-auto mb-6">
          <Package size={48} className="text-gray-400" />
        </div>
        <h1 className="text-3xl font-black mb-4">Your cart is empty</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto font-medium">
          Looks like you haven't added anything to your cart yet. Browse our products to find something you like!
        </p>
        <Link to="/products" className="neo-btn px-8 py-3 bg-[#F97316] text-white font-black inline-flex items-center gap-2">
          Start Shopping <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  const subtotal = parseFloat(cart.total || 0);
  const shipping = subtotal >= 500 ? 0 : 50;
  const total = subtotal + shipping;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
      <h1 className="text-3xl font-black mb-8">Shopping Cart ({cart.item_count} items)</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
          <div className="flex justify-end">
            <button onClick={clearCart} className="text-sm font-bold text-red-500 hover:text-red-700 flex items-center gap-1">
              <Trash2 size={14} /> Clear Cart
            </button>
          </div>
          
          {cart.items.map(item => (
            <div key={item.id} className="neo-card p-4 flex gap-4 items-center">
              <div className="w-20 h-20 bg-gray-100 neo-border flex-shrink-0">
                {item.product?.primary_image?.image_url ? (
                  <img src={item.product.primary_image.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="text-gray-300" /></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product?.slug}`} className="font-black hover:text-[#F97316] line-clamp-1 mb-1">
                  {item.product?.name}
                </Link>
                <div className="text-xs text-gray-500 mb-2">₹{parseFloat(item.unit_price).toLocaleString('en-IN')} each</div>
                
                <div className="flex items-center gap-4">
                  <div className="flex neo-border border-gray-300 w-fit">
                    <button onClick={() => updateItem(item.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center font-black hover:bg-gray-100">−</button>
                    <span className="w-8 h-7 flex items-center justify-center font-black text-sm border-x-2 border-gray-300">{item.quantity}</span>
                    <button onClick={() => updateItem(item.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center font-black hover:bg-gray-100">+</button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-xs font-bold text-red-500 hover:text-red-700 underline">Remove</button>
                </div>
              </div>
              
              <div className="text-right ml-4">
                <div className="font-black text-lg">₹{parseFloat(item.subtotal).toLocaleString('en-IN')}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-96">
          <div className="neo-card p-6 sticky top-24">
            <h2 className="text-xl font-black mb-4 pb-4 border-b-2 border-gray-100">Order Summary</h2>
            
            <div className="space-y-3 mb-6 font-medium text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                {shipping === 0 ? (
                  <span className="font-bold text-green-600">Free</span>
                ) : (
                  <span className="font-bold">₹{shipping}</span>
                )}
              </div>
              {shipping > 0 && (
                <div className="text-[10px] text-gray-400 text-right">Free shipping on orders above ₹500</div>
              )}
            </div>
            
            <div className="flex justify-between items-end border-t-2 border-[#0A0A0A] pt-4 mb-6">
              <span className="font-black">Total</span>
              <span className="text-2xl font-black text-[#F97316]">₹{total.toLocaleString('en-IN')}</span>
            </div>
            
            <button 
              onClick={() => navigate('/checkout')}
              className="neo-btn w-full py-4 bg-[#0A0A0A] text-white font-black flex items-center justify-center gap-2 mb-4"
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>
            
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 p-2 neo-border border-gray-200">
              <ShieldCheck size={14} className="text-green-600" /> Secure Checkout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

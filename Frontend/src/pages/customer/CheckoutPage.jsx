import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Wallet, CreditCard, Banknote, ShieldCheck } from 'lucide-react';
import api from '../../lib/api';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const normalizeListResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  
  const [form, setForm] = useState({
    shipping_name: user?.first_name ? `${user.first_name} ${user.last_name}` : '',
    shipping_phone: user?.phone || '',
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_pincode: '',
    payment_method: 'CARD', // Default
    notes: ''
  });

  useEffect(() => {
    if (!cart.items || cart.items.length === 0) {
      navigate('/cart');
      return;
    }
    
    // Fetch user addresses
    api.get('/auth/addresses/').then(r => {
      const addressList = normalizeListResponse(r.data);
      setAddresses(addressList);
      const defaultAddr = addressList.find(a => a.is_default) || addressList[0];
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.id);
        setForm(f => ({
          ...f,
          shipping_address: `${defaultAddr.address_line1} ${defaultAddr.address_line2}`.trim(),
          shipping_city: defaultAddr.city,
          shipping_state: defaultAddr.state,
          shipping_pincode: defaultAddr.pincode
        }));
      }
    }).catch(() => {});
  }, [cart, navigate]);

  const handleAddressSelect = (id) => {
    setSelectedAddress(id);
    const addr = addresses.find(a => a.id === id);
    if (addr) {
      setForm(f => ({
        ...f,
        shipping_address: `${addr.address_line1} ${addr.address_line2}`.trim(),
        shipping_city: addr.city,
        shipping_state: addr.state,
        shipping_pincode: addr.pincode
      }));
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/orders/place/', form);

      const isOnlinePayment = ['CARD', 'UPI', 'NETBANKING'].includes(form.payment_method);

      if (!isOnlinePayment) {
        toast.success(data.message || 'Order placed successfully!');
        fetchCart();
        navigate(`/orders/${data.order.id}`);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Unable to load Razorpay checkout.');
        return;
      }

      const { data: gatewayData } = await api.post('/payments/razorpay/create-order/', {
        payment_id: data.payment.id,
      });

      const options = {
        key: gatewayData.key_id,
        amount: gatewayData.amount,
        currency: gatewayData.currency,
        name: gatewayData.name,
        description: gatewayData.description,
        order_id: gatewayData.order_id,
        prefill: {
          name: form.shipping_name,
          contact: form.shipping_phone,
        },
        theme: {
          color: '#F97316',
        },
        handler: async (response) => {
          try {
            await api.post('/payments/razorpay/verify/', {
              payment_id: data.payment.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful!');
            fetchCart();
            navigate(`/orders/${data.order.id}`);
          } catch (verifyError) {
            toast.error(verifyError.response?.data?.error || 'Payment verification failed.');
          }
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled. Your order is pending until payment is completed.');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      const errData = err.response?.data;
      if (errData && typeof errData === 'object') {
        const msg = Object.values(errData)[0];
        toast.error(Array.isArray(msg) ? msg[0] : msg);
      } else {
        toast.error('Failed to place order.');
      }
    } finally {
      setLoading(false);
    }
  };

  const subtotal = parseFloat(cart.total || 0);
  const shipping = subtotal >= 500 ? 0 : 50;
  const total = subtotal + shipping;

  const inputCls = "neo-input w-full px-3 py-2 text-sm font-medium";
  const labelCls = "block text-xs font-black mb-1 uppercase tracking-wide";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
      <h1 className="text-3xl font-black mb-8">Checkout</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handlePlaceOrder} className="flex-1 space-y-6">
          
          {/* Shipping Info */}
          <div className="neo-card p-6">
            <h2 className="text-xl font-black mb-4 pb-3 border-b-2 border-gray-100 flex items-center gap-2">
              <span className="w-6 h-6 bg-[#0A0A0A] text-white flex items-center justify-center text-xs neo-border">1</span>
              Shipping Details
            </h2>
            
            {addresses.length > 0 && (
              <div className="mb-6">
                <label className={labelCls}>Saved Addresses</label>
                <div className="grid sm:grid-cols-2 gap-3 mt-2">
                  {addresses.map(a => (
                    <div 
                      key={a.id} 
                      onClick={() => handleAddressSelect(a.id)}
                      className={`p-3 neo-border cursor-pointer transition-colors ${selectedAddress === a.id ? 'bg-orange-50 border-[#F97316] neo-shadow-orange' : 'bg-white hover:bg-gray-50'}`}
                    >
                      <div className="font-bold text-sm mb-1">{a.label} {a.is_default && <span className="text-[10px] bg-[#0A0A0A] text-white px-1">DEFAULT</span>}</div>
                      <div className="text-xs text-gray-600 line-clamp-2">{a.address_line1}, {a.city}, {a.pincode}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 my-4">
                  <div className="flex-1 border-t-2 border-gray-100"></div>
                  <span className="text-xs font-bold text-gray-400">OR ENTER NEW</span>
                  <div className="flex-1 border-t-2 border-gray-100"></div>
                </div>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name</label>
                <input required value={form.shipping_name} onChange={e => setForm({...form, shipping_name: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input required value={form.shipping_phone} onChange={e => setForm({...form, shipping_phone: e.target.value})} className={inputCls} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Address</label>
                <input required value={form.shipping_address} onChange={e => setForm({...form, shipping_address: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input required value={form.shipping_city} onChange={e => setForm({...form, shipping_city: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <input required value={form.shipping_state} onChange={e => setForm({...form, shipping_state: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>PIN Code</label>
                <input required value={form.shipping_pincode} onChange={e => setForm({...form, shipping_pincode: e.target.value})} className={inputCls} />
              </div>
            </div>
            
            <div className="mt-4">
              <label className={labelCls}>Order Notes (Optional)</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={`${inputCls} resize-none`} rows={2}></textarea>
            </div>
          </div>
          
          {/* Payment Method */}
          <div className="neo-card p-6 border-[#F97316]">
            <h2 className="text-xl font-black mb-4 pb-3 border-b-2 border-orange-100 flex items-center gap-2">
              <span className="w-6 h-6 bg-[#F97316] text-white flex items-center justify-center text-xs neo-border border-white/20">2</span>
              Payment Method
            </h2>
            
            <div className="grid sm:grid-cols-2 text-sm font-bold gap-3">
              {[
                { id: 'CARD', label: 'Credit/Debit Card', icon: CreditCard },
                { id: 'UPI', label: 'UPI / Wallet', icon: Wallet },
                { id: 'NETBANKING', label: 'Net Banking', icon: Banknote },
                { id: 'COD', label: 'Cash on Delivery', icon: Banknote }
              ].map(({id, label, icon: Icon}) => (
                <label 
                  key={id} 
                  className={`flex items-center gap-3 p-4 neo-border cursor-pointer transition-all
                    ${form.payment_method === id ? 'bg-[#F97316] text-white neo-shadow border-[#0A0A0A]' : 'bg-white hover:bg-orange-50'}`}
                >
                  <input 
                    type="radio" name="payment" value={id} 
                    checked={form.payment_method === id}
                    onChange={e => setForm({...form, payment_method: e.target.value})}
                    className="hidden" 
                  />
                  <Icon size={18} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 text-xs font-medium text-gray-600 neo-border border-dashed">
              <ShieldCheck size={14} className="inline mr-1 text-green-600" /> 
              Your payment information is processed securely. We do not store credit card details.
            </div>
          </div>
          
          {/* Mobile Submit Button (shows under form on mobile) */}
          <button 
            type="submit" 
            disabled={loading}
            className="lg:hidden neo-btn w-full py-4 bg-[#0A0A0A] text-white font-black text-lg flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : `Place Order • ₹${total.toLocaleString('en-IN')}`}
          </button>
        </form>

        {/* Order Summary Summary */}
        <div className="w-full lg:w-96">
          <div className="neo-card p-6 sticky top-24">
            <h2 className="text-xl font-black mb-4 pb-4 border-b-2 border-gray-100">Order Summary</h2>
            
            <div className="divide-y-2 divide-gray-50 mb-4 max-h-60 overflow-y-auto pr-2">
              {cart.items?.map(item => (
                <div key={item.id} className="py-2 flex gap-3 items-center">
                  <div className="w-12 h-12 bg-gray-100 shrink-0 neo-border">
                    {item.product?.primary_image?.image_url && <img src={item.product.primary_image.image_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{item.product?.name}</div>
                    <div className="text-[10px] text-gray-500">Qty: {item.quantity}</div>
                  </div>
                  <div className="text-xs font-black">₹{parseFloat(item.subtotal).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
            
            <div className="space-y-3 pt-4 border-t-2 border-gray-100 mb-6 font-medium text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-600 font-bold">Free</span> : `₹${shipping}`}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-end border-t-2 border-[#0A0A0A] pt-4 mb-6">
              <span className="font-black text-lg">Total</span>
              <span className="text-2xl font-black text-[#F97316]">₹{total.toLocaleString('en-IN')}</span>
            </div>
            
            {/* Desktop Submit Button */}
            <button 
              onClick={handlePlaceOrder}
              disabled={loading}
              className="hidden lg:flex neo-btn w-full py-4 bg-[#0A0A0A] text-white font-black items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : <>Confirm Order <ArrowRight size={18} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

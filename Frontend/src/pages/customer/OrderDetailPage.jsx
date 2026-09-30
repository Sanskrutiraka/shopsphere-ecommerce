import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Package, Truck, CheckCircle, CreditCard, ChevronDown, ShoppingBag } from 'lucide-react';
import api from '../../lib/api';
import { format } from 'date-fns';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/my-orders/${id}/`).then(r => {
      setOrder(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse"><div className="h-96 bg-gray-200 neo-border" /></div>;
  if (!order) return <div className="max-w-7xl mx-auto px-4 py-8"><h1 className="text-2xl font-black">Order not found</h1></div>;

  const STATUS_STEPS = ['PLACED', 'ACCEPTED', 'PROCESSED', 'DISPATCHED', 'DELIVERED'];
  const isRejected = order.status === 'REJECTED';
  const currentStepIdx = isRejected ? -1 : STATUS_STEPS.indexOf(order.status);
  
  // Track status history dates for timeline
  const historyMap = {};
  order.status_history?.forEach(h => {
    historyMap[h.status] = new Date(h.timestamp);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
      <div className="mb-6">
        <Link to="/orders" className="inline-flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-[#0A0A0A] mb-4">
          <ChevronLeft size={16} /> Back to Orders
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black mb-1">Order #{order.order_number}</h1>
            <p className="text-sm font-medium text-gray-500">Placed on {format(new Date(order.placed_at), 'MMMM dd, yyyy - hh:mm a')}</p>
          </div>
          <div className={`neo-badge px-3 py-1.5 text-sm status-${order.status.toLowerCase()}`}>
            {order.status}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Status Timeline */}
          <div className="neo-card p-6 pb-8 overflow-hidden">
            <h2 className="text-xl font-black mb-8">Order Status</h2>
            
            {isRejected ? (
              <div className="bg-red-50 p-4 neo-border border-red-200 text-red-800 text-sm font-medium">
                <div className="font-black text-base mb-1">Order Cancelled/Rejected</div>
                {order.rejection_reason && <p>Reason: {order.rejection_reason}</p>}
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-1 bg-gray-200 -translate-x-1/2" />
                <div className="absolute left-4 sm:left-1/2 top-0 w-1 bg-[#F97316] -translate-x-1/2 transition-all duration-500" 
                     style={{ height: `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%` }} />
                
                <div className="space-y-8 sm:space-y-0 sm:flex sm:justify-between relative">
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStepIdx;
                    const date = historyMap[step];
                    
                    return (
                      <div key={step} className="flex sm:flex-col items-center sm:text-center relative pl-12 sm:pl-0 sm:w-1/5">
                        <div className={`w-8 h-8 rounded-full neo-border flex items-center justify-center relative z-10 
                          ${isCompleted ? 'bg-[#F97316] text-white border-[#0A0A0A]' : 'bg-white text-gray-400 border-gray-300'}`}>
                          {step === 'PLACED' && <ShoppingBag size={14} strokeWidth={3} />}
                          {step === 'ACCEPTED' && <CheckCircle size={14} strokeWidth={3} />}
                          {step === 'PROCESSED' && <Package size={14} strokeWidth={3} />}
                          {step === 'DISPATCHED' && <Truck size={14} strokeWidth={3} />}
                          {step === 'DELIVERED' && <CheckCircle size={14} strokeWidth={3} />}
                        </div>
                        <div className="ml-4 sm:ml-0 sm:mt-3">
                          <div className={`text-xs font-black uppercase ${isCompleted ? 'text-[#0A0A0A]' : 'text-gray-400'}`}>{step}</div>
                          {date && <div className="text-[10px] font-medium text-gray-500 mt-0.5">{format(date, 'MMM dd, hh:mm a')}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {order.tracking_number && (
              <div className="mt-8 pt-6 border-t-2 border-gray-100 flex items-center gap-3">
                <Truck size={20} className="text-[#F97316]" />
                <div>
                  <div className="text-xs font-bold text-gray-500">Tracking Number</div>
                  <div className="text-sm font-black tracking-wider">{order.tracking_number}</div>
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="neo-card overflow-hidden">
            <h2 className="text-xl font-black p-6 border-b-2 border-[#0A0A0A] bg-gray-50">Items Ordered</h2>
            <div className="divide-y-2 divide-gray-100">
              {order.items.map(item => {
                const itemImg = item.product_image?.image_url || item.product_image?.image;
                const productLink = item.product_slug ? `/products/${item.product_slug}` : (item.product ? `/products/${item.product}` : '#');
                return (
                  <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 neo-border flex-shrink-0">
                      {itemImg ? (
                        <img src={itemImg} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="text-gray-300" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={productLink} className="font-black text-base sm:text-lg hover:text-[#F97316] inline-block mb-1 line-clamp-1">
                        {item.product_name}
                      </Link>
                      <div className="text-xs text-gray-500 mb-2 font-medium">SKU: {item.product_sku}</div>
                      <div className="flex items-baseline gap-2">
                         <span className="font-black">₹{parseFloat(item.unit_price).toLocaleString('en-IN')}</span>
                         <span className="text-xs font-bold text-gray-500">x {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right sm:self-center">
                      <div className="text-sm text-gray-500 font-bold mb-1">Subtotal</div>
                      <div className="font-black text-xl">₹{parseFloat(item.subtotal).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Summary */}
          <div className="neo-card p-6">
            <h2 className="text-xl font-black mb-4">Payment Summary</h2>
            <div className="space-y-3 mb-6 font-medium text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-bold">₹{parseFloat(order.subtotal).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping Charge</span>
                <span className="font-bold">₹{parseFloat(order.shipping_charge).toLocaleString('en-IN')}</span>
              </div>
              {parseFloat(order.discount_amount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-bold">-₹{parseFloat(order.discount_amount).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-end border-t-2 border-[#0A0A0A] pt-4 mb-4">
              <span className="font-black">Total Amount</span>
              <span className="text-2xl font-black text-[#F97316]">₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</span>
            </div>
            
            <div className="p-3 bg-gray-50 neo-border flex items-start gap-3 mt-6">
              <CreditCard size={18} className="mt-0.5 opacity-70" />
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Method</div>
                <div className="text-sm font-black">{order.payment_method}</div>
                <div className={`text-xs font-bold mt-1 ${order.payment_status === 'PAID' ? 'text-green-600' : 'text-orange-500'}`}>
                  Status: {order.payment_status}
                </div>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="neo-card p-6">
            <h2 className="text-xl font-black mb-4">Shipping Details</h2>
            <div className="text-sm font-medium space-y-1">
              <div className="font-black text-base">{order.shipping_name}</div>
              <div className="text-gray-500 mb-2">{order.shipping_phone}</div>
              <div className="leading-relaxed">
                {order.shipping_address}<br/>
                {order.shipping_city}, {order.shipping_state} {order.shipping_pincode}
              </div>
            </div>
            {order.notes && (
              <div className="mt-4 pt-4 border-t-2 border-gray-100">
                <div className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-1">Order Notes</div>
                <p className="text-sm italic">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

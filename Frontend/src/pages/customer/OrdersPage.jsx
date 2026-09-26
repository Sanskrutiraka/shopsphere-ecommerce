import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight, Package, Truck, CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import { format } from 'date-fns';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my-orders/').then(r => {
      setOrders(r.data.results || r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLACED': return 'status-placed';
      case 'ACCEPTED': return 'status-accepted';
      case 'PROCESSED': return 'status-processed';
      case 'DISPATCHED': return 'status-dispatched';
      case 'DELIVERED': return 'status-delivered';
      case 'REJECTED': return 'status-rejected';
      default: return 'bg-gray-100 text-gray-800 border-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PLACED': return <ShoppingBag size={14} />;
      case 'ACCEPTED': return <CheckCircle size={14} />;
      case 'PROCESSED': return <Package size={14} />;
      case 'DISPATCHED': return <Truck size={14} />;
      case 'DELIVERED': return <CheckCircle size={14} />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <h1 className="text-3xl font-black mb-8">My Orders</h1>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 neo-border" />)}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 bg-gray-100 flex items-center justify-center rounded-full mx-auto mb-6">
          <ShoppingBag size={48} className="text-gray-400" />
        </div>
        <h1 className="text-3xl font-black mb-4">No orders yet</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto font-medium">
          You haven't placed any orders. Start browsing our products to find something you like.
        </p>
        <Link to="/products" className="neo-btn px-8 py-3 bg-[#F97316] text-white font-black inline-block">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
      <h1 className="text-3xl font-black mb-8">My Orders</h1>
      
      <div className="space-y-4">
        {orders.map(order => (
          <Link key={order.id} to={`/orders/${order.id}`} className="block block group">
            <div className="neo-card p-0 hover:bg-gray-50 transition-colors">
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-black text-lg">#{order.order_number}</span>
                    <span className={`neo-badge px-2 py-1 flex items-center gap-1 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)} {order.status}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span>{format(new Date(order.placed_at), 'MMM dd, yyyy - hh:mm a')}</span>
                    <span>•</span>
                    <span>{order.item_count} {order.item_count === 1 ? 'item' : 'items'}</span>
                    <span>•</span>
                    <span>Total: <span className="font-bold text-[#0A0A0A]">₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</span></span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t-2 border-gray-100 sm:border-0">
                  <div className="text-sm">
                    <span className="text-gray-500 mr-2">Payment:</span>
                    <span className={`font-bold ${order.payment_status === 'PAID' ? 'text-green-600' : 
                                               order.payment_status === 'FAILED' ? 'text-red-600' : 'text-orange-500'}`}>
                      {order.payment_status}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-[#F97316] group-hover:text-white transition-colors ml-4 neo-border">
                    <ChevronRight size={18} />
                  </div>
                </div>
                
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

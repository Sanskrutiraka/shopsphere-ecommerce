import { useState, useEffect } from 'react';
import { ShoppingBag, ChevronDown } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/admin/orders/');
      setOrders(data.results || data);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.post(`/orders/admin/orders/${id}/status/`, { status });
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      const message = error?.response?.data?.error || 'Failed to update status';
      toast.error(message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLACED': return 'bg-blue-100 text-blue-800 border-blue-800';
      case 'ACCEPTED': return 'bg-emerald-100 text-emerald-800 border-emerald-800';
      case 'PROCESSED': return 'bg-yellow-100 text-yellow-800 border-yellow-800';
      case 'DISPATCHED': return 'bg-purple-100 text-purple-800 border-purple-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-800';
    }
  };

  const statuses = ['PLACED', 'ACCEPTED', 'PROCESSED', 'DISPATCHED', 'DELIVERED', 'REJECTED'];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-[#0A0A0A] text-white flex items-center justify-center neo-border">
          <ShoppingBag size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black mb-1">Order Management</h1>
          <p className="text-sm text-gray-500 font-medium">Track and update customer orders.</p>
        </div>
      </div>

      <div className="neo-card bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead className="bg-[#0A0A0A] text-white font-black uppercase text-xs border-b-2 border-[#0A0A0A]">
              <tr>
                <th className="p-4 border-r-2 border-white/20">Order ID & Date</th>
                <th className="p-4 border-r-2 border-white/20">Customer</th>
                <th className="p-4 border-r-2 border-white/20">Payment</th>
                <th className="p-4 border-r-2 border-white/20">Total</th>
                <th className="p-4 w-48">Status Update</th>
              </tr>
            </thead>
            <tbody className="font-medium">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} className="border-b-2 border-gray-100 hover:bg-gray-50">
                  <td className="p-4 border-r-2 border-gray-100">
                    <div className="font-black text-[#0A0A0A]">#{o.order_number}</div>
                    <div className="text-xs text-gray-500 mt-1">{format(new Date(o.placed_at), 'MMM dd, yyyy - hh:mm a')}</div>
                  </td>
                  <td className="p-4 border-r-2 border-gray-100">
                    <div className="font-black text-sm">{o.shipping_name}</div>
                    <div className="text-xs text-gray-500">{o.shipping_phone}</div>
                  </td>
                  <td className="p-4 border-r-2 border-gray-100">
                    <div className="font-bold text-xs">{o.payment_method}</div>
                    <div className={`text-[10px] uppercase font-black px-1.5 py-0.5 inline-block mt-1 ${o.payment_status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                      {o.payment_status}
                    </div>
                  </td>
                  <td className="p-4 border-r-2 border-gray-100">
                    <div className="font-black text-lg">₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</div>
                    <div className="text-xs text-gray-500">{o.items?.length || o.item_count} items</div>
                  </td>
                  <td className="p-4">
                    <div className="relative">
                      <select 
                        value={o.status}
                        onChange={(e) => handleStatusUpdate(o.id, e.target.value)}
                        className={`neo-input w-full appearance-none px-3 py-1.5 text-xs font-black cursor-pointer ${getStatusColor(o.status)}`}
                      >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

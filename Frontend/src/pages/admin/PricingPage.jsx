import { useState, useEffect } from 'react';
import { Tag, Save, History, ArrowDown } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function PricingPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState({});
  const [historyModal, setHistoryModal] = useState(null); // productId

  const toDateTimeLocalValue = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (num) => String(num).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products/admin/products/');
      setProducts(data.results || data);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleUpdate = async (productId) => {
    const data = updates[productId];
    if (!data) return;
    try {
      await api.post(`/products/admin/pricing/${productId}/`, {
        base_price: data.base_price,
        discount_percentage: data.discount_percentage,
        sale_label: data.sale_label,
        effective_from: data.effective_from,
      });
      toast.success('Price updated');
      setUpdates(prev => { const n = {...prev}; delete n[productId]; return n; });
      fetchProducts();
    } catch { toast.error('Failed to update price'); }
  };

  const getSellingPrice = (base, disc) => {
    const b = parseFloat(base) || 0;
    const d = parseFloat(disc) || 0;
    return b - (b * (d / 100));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-[#F97316] text-white flex items-center justify-center neo-border">
          <Tag size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black mb-1">Pricing & Promotions</h1>
          <p className="text-sm text-gray-500 font-medium">Manage base prices, discounts, and sale labels.</p>
        </div>
      </div>

      <div className="neo-card bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead className="bg-[#0A0A0A] text-white font-black uppercase text-xs border-b-2 border-[#0A0A0A]">
              <tr>
                <th className="p-4 border-r-2 border-white/20">Product</th>
                <th className="p-4 border-r-2 border-white/20">Base Price (₹)</th>
                <th className="p-4 border-r-2 border-white/20 min-w-40">Discount (%)</th>
                <th className="p-4 border-r-2 border-white/20">Sale Label</th>
                <th className="p-4 border-r-2 border-white/20">Effective From</th>
                <th className="p-4 border-r-2 border-white/20 text-right">Final Price</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="font-medium">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : products.map(p => {
                const currentPrice = p.current_price || { base_price: 0, discount_percentage: 0, sale_label: '', effective_from: '' };
                const u = updates[p.id] || {};
                
                const currBase = u.base_price !== undefined ? u.base_price : currentPrice.base_price;
                const currDisc = u.discount_percentage !== undefined ? u.discount_percentage : currentPrice.discount_percentage;
                const currLabel = u.sale_label !== undefined ? u.sale_label : currentPrice.sale_label;
                const currEffectiveFrom = u.effective_from !== undefined
                  ? u.effective_from
                  : toDateTimeLocalValue(currentPrice.effective_from);
                const hasChanges = updates[p.id] !== undefined;
                
                const finalPrice = getSellingPrice(currBase, currDisc);

                return (
                  <tr key={p.id} className="border-b-2 border-gray-100 hover:bg-orange-50">
                    <td className="p-4 border-r-2 border-gray-100 flex items-center gap-3 font-black">
                      {p.primary_image?.image_url && <img src={p.primary_image.image_url} className="w-8 h-8 neo-border object-cover" />}
                      <span className="line-clamp-1 w-48">{p.name}</span>
                    </td>
                    <td className="p-4 border-r-2 border-gray-100">
                      <input type="number" className="w-24 neo-input p-2 font-black" value={currBase} 
                        onChange={e=>setUpdates({...updates, [p.id]: {...(updates[p.id]||currentPrice), base_price: e.target.value}})} />
                    </td>
                    <td className="p-4 border-r-2 border-gray-100 min-w-40">
                      <div className="flex items-center gap-1">
                        <ArrowDown size={14} className="text-red-500" />
                        <input type="number" min="0" max="100" className="w-24 neo-input p-2 font-black text-red-600" value={currDisc} 
                          onChange={e=>setUpdates({...updates, [p.id]: {...(updates[p.id]||currentPrice), discount_percentage: e.target.value}})} />
                      </div>
                    </td>
                    <td className="p-4 border-r-2 border-gray-100">
                      <input type="text" placeholder="e.g. Summer Sale" className="w-32 neo-input p-2 text-xs" value={currLabel} 
                        onChange={e=>setUpdates({...updates, [p.id]: {...(updates[p.id]||currentPrice), sale_label: e.target.value}})} />
                    </td>
                    <td className="p-4 border-r-2 border-gray-100">
                      <input
                        type="datetime-local"
                        className="neo-input w-44 p-2 text-xs font-medium"
                        value={currEffectiveFrom}
                        onChange={e => setUpdates({
                          ...updates,
                          [p.id]: {
                            ...(updates[p.id] || currentPrice),
                            effective_from: e.target.value,
                          }
                        })}
                      />
                    </td>
                    <td className="p-4 border-r-2 border-gray-100 text-right font-black text-lg text-[#F97316]">
                      ₹{finalPrice.toLocaleString('en-IN', {maximumFractionDigits:2})}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {hasChanges ? (
                          <button onClick={() => handleUpdate(p.id)} className="neo-btn bg-[#0A0A0A] text-white px-3 py-1.5 flex items-center gap-1">
                            <Save size={14}/> Save
                          </button>
                        ) : (
                          <span className="px-3 text-xs text-gray-400 font-bold">Synced</span>
                        )}
                        <button onClick={() => setHistoryModal(p.id)} title="Price History" className="p-1.5 bg-gray-100 neo-border hover:bg-gray-200">
                          <History size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

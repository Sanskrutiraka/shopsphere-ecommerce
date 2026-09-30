import { useState, useEffect } from 'react';
import { Boxes, AlertTriangle, Save } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function StockPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState({});

  const fetchStock = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products/admin/stock/');
      setProducts((Array.isArray(data) ? data : []).map((item) => ({
        ...item,
        id: item.product_id,
        name: item.product_name,
        stock: {
          quantity: item.quantity,
          min_level: item.min_level,
          max_level: item.max_level,
          is_below_minimum: item.is_below_minimum,
          is_out_of_stock: item.is_out_of_stock,
        },
      })));
    } catch { toast.error('Failed to load stock data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStock(); }, []);

  const handleUpdate = async (productId) => {
    const data = updates[productId];
    if (!data) return;
    const product = products.find(p => p.id === productId);
    try {
      await api.post('/products/admin/stock/', {
        product_id: productId,
        quantity: data.quantity !== undefined ? data.quantity : product?.stock?.quantity,
        min_level: data.min_level !== undefined ? data.min_level : product?.stock?.min_level,
      });
      toast.success(`Stock updated for ${product?.name || 'product'}`);
      setUpdates(prev => { const n = {...prev}; delete n[productId]; return n; });
      fetchStock();
    } catch { toast.error(`Failed to update ${product?.name || 'stock'}`); }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-[#0A0A0A] text-white flex items-center justify-center neo-border">
          <Boxes size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black mb-1">Inventory Management</h1>
          <p className="text-sm text-gray-500 font-medium">Update stock levels and minimum thresholds.</p>
        </div>
      </div>

      <div className="neo-card bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead className="bg-[#0A0A0A] text-white font-black uppercase text-xs border-b-2 border-[#0A0A0A]">
              <tr>
                <th className="p-4 border-r-2 border-white/20">Product</th>
                <th className="p-4 border-r-2 border-white/20">Current Stock</th>
                <th className="p-4 border-r-2 border-white/20">Min Level</th>
                <th className="p-4 border-r-2 border-white/20">Status</th>
                <th className="p-4 w-24">Action</th>
              </tr>
            </thead>
            <tbody className="font-medium">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : products.map(p => {
                const stock = p.stock || { quantity: 0, min_level: 10, is_below_minimum: true };
                const currQty = updates[p.id]?.quantity !== undefined ? updates[p.id].quantity : stock.quantity;
                const currMin = updates[p.id]?.min_level !== undefined ? updates[p.id].min_level : stock.min_level;
                const hasChanges = updates[p.id] !== undefined;

                const prodImg = p.primary_image?.image_url || p.primary_image?.image || p.image;
                return (
                  <tr key={p.id} className="border-b-2 border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-black border-r-2 border-gray-100 flex items-center gap-3">
                      {prodImg && <img src={prodImg} alt="" className="w-8 h-8 neo-border object-cover shrink-0" />}
                      <div>
                        {p.name}
                        <div className="text-xs text-gray-500 font-medium font-mono mt-0.5">{p.sku}</div>
                      </div>
                    </td>
                    <td className="p-4 border-r-2 border-gray-100">
                      <div className="flex items-center gap-2 max-w-30">
                        <button onClick={() => setUpdates({...updates, [p.id]: {...(updates[p.id]||{}), quantity: Math.max(0, currQty - 1)}})} className="w-8 h-8 neo-border bg-gray-100 font-black">-</button>
                        <input type="number" className="w-16 h-8 text-center neo-input font-black" value={currQty} onChange={e=>setUpdates({...updates, [p.id]: {...(updates[p.id]||{}), quantity: parseInt(e.target.value)||0}})} />
                        <button onClick={() => setUpdates({...updates, [p.id]: {...(updates[p.id]||{}), quantity: currQty + 1}})} className="w-8 h-8 neo-border bg-gray-100 font-black">+</button>
                      </div>
                    </td>
                    <td className="p-4 border-r-2 border-gray-100">
                      <input type="number" className="w-16 h-8 text-center neo-input font-black" value={currMin} onChange={e=>setUpdates({...updates, [p.id]: {...(updates[p.id]||{}), min_level: parseInt(e.target.value)||0}})} />
                    </td>
                    <td className="p-4 border-r-2 border-gray-100">
                      {currQty === 0 ? (
                        <span className="neo-badge bg-red-500 text-white flex items-center gap-1 w-fit"><AlertTriangle size={12}/> Out of Stock</span>
                      ) : currQty <= currMin ? (
                        <span className="neo-badge bg-orange-100 text-orange-800 flex items-center gap-1 w-fit"><AlertTriangle size={12}/> Low Stock</span>
                      ) : (
                        <span className="neo-badge bg-green-100 text-green-800 border-green-800">Healthy</span>
                      )}
                    </td>
                    <td className="p-4">
                      {hasChanges ? (
                        <button onClick={() => handleUpdate(p.id)} className="w-full neo-btn bg-[#F97316] text-white py-1.5 flex items-center justify-center gap-1">
                           Save
                        </button>
                      ) : <span className="text-xs text-gray-400 font-bold block text-center">Synced</span>}
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

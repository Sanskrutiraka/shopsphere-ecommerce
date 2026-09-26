import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [form, setForm] = useState({
    name: '', sku: '', category: '', brand: '', description: '',
    base_price: '', quantity: '', is_active: true, is_featured: false
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products/admin/products/', { params: searchTerm ? { search: searchTerm } : {} }),
        api.get('/products/categories/')
      ]);
      setProducts(prodRes.data.results || prodRes.data);
      setCategories(catRes.data.results || catRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      ['name', 'sku', 'category', 'brand', 'description', 'is_active', 'is_featured'].forEach((key) => {
        formData.append(key, form[key]);
      });
      if (!editingId) {
        formData.append('base_price', form.base_price);
        formData.append('quantity', form.quantity);
      }
      imageFiles.forEach(file => formData.append('images', file));

      if (editingId) {
        await api.put(`/products/admin/products/${editingId}/`, formData, { headers: {'Content-Type': 'multipart/form-data'} });
        try {
          await api.post('/products/admin/stock/', {
            product_id: editingId,
            quantity: form.quantity,
          });
        } catch {
          toast.error('Product saved, but stock update failed');
        }
        toast.success('Product updated');
      } else {
        await api.post('/products/admin/products/', formData, { headers: {'Content-Type': 'multipart/form-data'} });
        toast.success('Product created');
      }
      setShowModal(false);
      setImageFiles([]);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || 'Operation failed');
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategoryId) {
        await api.put(`/products/categories/${editingCategoryId}/`, catForm);
        toast.success('Category updated');
      } else {
        await api.post('/products/categories/', catForm);
        toast.success('Category created');
      }
      setShowCategoryModal(false);
      setEditingCategoryId(null);
      setCatForm({ name: '', description: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || 'Category save failed');
    }
  };

  const openCategoryEdit = (category) => {
    setCatForm({
      name: category.name || '',
      description: category.description || '',
    });
    setEditingCategoryId(category.id);
    setShowCategoryModal(true);
  };

  const handleCategoryDelete = async (categoryId) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/products/categories/${categoryId}/`);
      toast.success('Category deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const openEdit = async (productId) => {
    setEditingId(productId);
    setShowModal(true);
    setIsLoadingEdit(true);
    setImageFiles([]);
    setForm({ name: '', sku: '', category: '', brand: '', description: '', base_price: '', quantity: '', is_active: true, is_featured: false });

    try {
      const { data } = await api.get(`/products/admin/products/${productId}/`);
      setForm({
        name: data.name || '',
        sku: data.sku || '',
        category: data.category?.id ?? data.category ?? '',
        brand: data.brand || '',
        description: data.description || '',
        base_price: data.current_price?.base_price || '',
        quantity: data.stock?.quantity ?? 0,
        is_active: Boolean(data.is_active),
        is_featured: Boolean(data.is_featured),
      });
    } catch {
      toast.error('Failed to load product details');
      setShowModal(false);
      setEditingId(null);
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/admin/products/${id}/`);
      toast.success('Product deleted');
      fetchData();
    } catch { toast.error('Failed to delete'); }
  };

  const generateDescription = async ({ force = false, nameOverride, imageOverride } = {}) => {
    const name = (nameOverride ?? form.name)?.trim();
    const image = imageOverride ?? imageFiles[0];

    if (!name) {
      toast.error('Enter product name first');
      return;
    }
    if (!image) {
      toast.error('Upload at least one image first');
      return;
    }
    if (!force && form.description?.trim()) {
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('image', image);

      const { data } = await api.post('/products/admin/products/generate-description/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setForm(prev => ({ ...prev, description: data?.description || prev.description }));
      toast.success('Description generated');
    } catch {
      toast.error('Failed to generate description');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const imgUpload = async (id, file) => {
    const fd = new FormData();
    fd.append('image', file);
    try {
      await api.post(`/products/admin/products/${id}/images/`, fd, { headers: {'Content-Type': 'multipart/form-data'} });
      toast.success('Image uploaded');
      fetchData();
    } catch { toast.error('Image upload failed'); }
  };

  const inputCls = "neo-input w-full px-3 py-2 text-sm";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1">Product Management</h1>
          <p className="text-sm text-gray-500 font-medium">Manage catalog, categories, and basic details.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setCatForm({name:'', description:''}); setEditingCategoryId(null); setShowCategoryModal(true); }}
            className="neo-btn bg-[#0A0A0A] text-white px-4 py-2 font-black flex items-center gap-2 w-fit">
            <Plus size={18} /> New Category
          </button>
          <button onClick={() => { setEditingId(null); setImageFiles([]); setForm({name:'', sku:'', category:'', brand:'', description:'', base_price:'', quantity: '', is_active:true, is_featured:false}); setShowModal(true); }}
            className="neo-btn bg-[#F97316] text-white px-4 py-2 font-black flex items-center gap-2 w-fit">
            <Plus size={18} /> New Product
          </button>
        </div>
      </div>

      <div className="neo-card bg-white overflow-hidden">
        <div className="p-4 border-b-2 border-[#0A0A0A] bg-gray-50 flex items-center gap-4">
          <div className="flex items-center gap-2 neo-input bg-white px-3 py-1.5 flex-1 max-w-sm">
            <Search size={16} className="text-gray-400" />
            <input
              placeholder="Search SKU or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="outline-none text-sm w-full bg-transparent font-medium"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0A0A0A] text-white font-black uppercase text-xs">
              <tr>
                <th className="p-4">Image</th>
                <th className="p-4">Product Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price / Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-gray-100 font-medium">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : products.map(p => (
                <tr key={p.id} className="hover:bg-orange-50 transition-colors">
                  <td className="p-4">
                    <div className="w-12 h-12 bg-gray-100 neo-border relative group flex items-center justify-center cursor-pointer overflow-hidden">
                       {p.primary_image?.image_url ? 
                         <img src={p.primary_image.image_url} alt="" className="w-full h-full object-cover" /> :
                         <ImageIcon size={20} className="text-gray-400" />
                       }
                       <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer text-[10px] font-bold pb-1">
                         <Plus size={14} /> Upload
                         <input type="file" className="hidden" onChange={(e) => { if(e.target.files[0]) imgUpload(p.id, e.target.files[0]) }} accept="image/*" />
                       </label>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-black text-[15px]">{p.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">SKU: {p.sku} • {p.brand}</div>
                  </td>
                  <td className="p-4 font-bold">{p.category_name}</td>
                  <td className="p-4">
                    <div className="font-black text-[#F97316]">₹{parseFloat(p.current_price?.selling_price || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Stock: {p.stock_qty || 0}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                       {p.is_active ? <span className="neo-badge bg-green-100 text-green-700 border-green-700 px-3 py-1">Active</span> : <span className="neo-badge bg-gray-200 px-3 py-1">Draft</span>}
                       {p.is_featured && <span className="neo-badge bg-[#FBBF24] px-3 py-1">Featured</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p.id)} className="p-1.5 bg-blue-100 text-blue-700 neo-border hover:bg-blue-200"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-red-100 text-red-700 neo-border hover:bg-red-200"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="neo-card p-6 w-full max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black mb-6">{editingId ? 'Edit Product' : 'New Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isLoadingEdit ? (
                <div className="py-10 text-center text-sm font-bold text-gray-500">Loading product details...</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-black mb-1 block">Name</label><input required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} onBlur={() => { if (!editingId && imageFiles.length > 0 && !form.description.trim()) generateDescription(); }} className={inputCls} /></div>
                    <div><label className="text-xs font-black mb-1 block">SKU</label><input required value={form.sku} onChange={e=>setForm({...form, sku: e.target.value})} className={inputCls} /></div>
                    <div><label className="text-xs font-black mb-1 block">Category</label>
                      <select required value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className={inputCls}>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div><label className="text-xs font-black mb-1 block">Brand</label><input value={form.brand} onChange={e=>setForm({...form, brand: e.target.value})} className={inputCls} /></div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-black block">Description</label>
                      <button
                        type="button"
                        disabled={isGeneratingDescription}
                        onClick={() => generateDescription({ force: true })}
                        className="neo-btn bg-[#0A0A0A] text-white px-3 py-1 text-[10px] uppercase font-black disabled:opacity-60"
                      >
                        {isGeneratingDescription ? 'Generating...' : (form.description?.trim() ? 'Regenerate' : 'Generate')}
                      </button>
                    </div>
                    <textarea required value={form.description} onChange={e=>setForm({...form, description: e.target.value})} rows={4} className={inputCls} />
                  </div>

                  {editingId ? (
                    <div>
                      <label className="text-xs font-black mb-1 block">Current Stock Quantity</label>
                      <input type="number" required value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})} className={inputCls} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs font-black mb-1 block">Initial Base Price</label><input type="number" required value={form.base_price} onChange={e=>setForm({...form, base_price: e.target.value})} className={inputCls} /></div>
                      <div><label className="text-xs font-black mb-1 block">Initial Stock Quantity</label><input type="number" required value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})} className={inputCls} /></div>
                    </div>
                  )}

                  <div className="flex gap-6 mt-4">
                    <div className="flex-1 p-3 bg-gray-50 neo-border border-dashed">
                      <label className="text-xs font-black mb-2 block uppercase text-gray-500">Product Images ({imageFiles.length} selected)</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          setImageFiles(files);
                          if (!editingId && files.length > 0 && form.name.trim() && !form.description.trim()) {
                            await generateDescription({
                              nameOverride: form.name,
                              imageOverride: files[0],
                            });
                          }
                        }}
                        className="w-full text-sm font-bold file:mr-4 file:py-1.5 file:px-3 file:border-0 file:text-[10px] file:uppercase file:font-black file:bg-[#0A0A0A] file:text-white cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex gap-6 mt-4 p-4 bg-gray-50 neo-border border-dashed">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-sm">
                      <input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form, is_active: e.target.checked})} className="w-5 h-5 accent-[#F97316] neo-border"/> Is Active
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-sm">
                      <input type="checkbox" checked={form.is_featured} onChange={e=>setForm({...form, is_featured: e.target.checked})} className="w-5 h-5 accent-[#FBBF24] neo-border"/> Feature on Homepage
                    </label>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="neo-btn flex-1 py-3 bg-white font-black">Cancel</button>
                    <button type="submit" className="neo-btn flex-1 py-3 bg-[#F97316] text-white font-black">Save Product</button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="neo-card p-6 w-full max-w-md bg-white">
            <h2 className="text-2xl font-black mb-6">{editingCategoryId ? 'Edit Category' : 'New Category'}</h2>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div><label className="text-xs font-black mb-1 block">Category Name</label><input required value={catForm.name} onChange={e=>setCatForm({...catForm, name: e.target.value})} className={inputCls} /></div>
              <div><label className="text-xs font-black mb-1 block">Description</label><textarea value={catForm.description} onChange={e=>setCatForm({...catForm, description: e.target.value})} rows={3} className={inputCls} /></div>
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => { setShowCategoryModal(false); setEditingCategoryId(null); setCatForm({name:'', description:''}); }} className="neo-btn flex-1 py-3 bg-white font-black">Cancel</button>
                <button type="submit" className="neo-btn flex-1 py-3 bg-[#0A0A0A] text-white font-black">{editingCategoryId ? 'Update Category' : 'Save Category'}</button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t-2 border-gray-100">
              <h3 className="text-sm font-black uppercase text-gray-500 mb-3">Existing Categories</h3>
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {categories.length > 0 ? categories.map((category) => (
                  <div key={category.id} className="neo-border p-2.5 flex items-center justify-between gap-2 bg-gray-50">
                    <div className="min-w-0">
                      <p className="font-black text-sm truncate">{category.name}</p>
                      <p className="text-[11px] text-gray-500">{category.product_count || 0} products</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => openCategoryEdit(category)} className="p-1.5 bg-blue-100 text-blue-700 neo-border hover:bg-blue-200">
                        <Edit size={13} />
                      </button>
                      <button type="button" onClick={() => handleCategoryDelete(category.id)} className="p-1.5 bg-red-100 text-red-700 neo-border hover:bg-red-200">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">No categories found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

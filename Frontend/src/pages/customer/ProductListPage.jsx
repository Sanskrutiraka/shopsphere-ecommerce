import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import api from '../../lib/api';
import ProductCard from '../../components/products/ProductCard';

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const ordering = searchParams.get('ordering') || '-created_at';
  const inStock = searchParams.get('in_stock') || '';
  const featured = searchParams.get('is_featured') || '';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (page > 1) params.set('page', page);
        if (search) params.set('search', search);
        if (category) params.set('category', category);
        if (ordering) params.set('ordering', ordering);
        if (inStock) params.set('in_stock', inStock);
        if (featured) params.set('is_featured', featured);

        const { data } = await api.get(`/products/?${params}`);
        setProducts(data.results || data);
        if (data.count) setTotalPages(Math.ceil(data.count / 12));
      } catch {}
      finally { setLoading(false); }
    };
    fetchProducts();
  }, [searchParams]);

  useEffect(() => {
    api.get('/products/categories/')
      .then(r => setCategories(Array.isArray(r.data) ? r.data : (r.data.results || [])))
      .catch(() => {});
  }, []);

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const clearFilters = () => setSearchParams({});

  const hasFilters = category || inStock || featured || search || ordering !== '-created_at';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">All Products</h1>
          {search && <p className="text-sm text-gray-500 mt-1">Results for "<strong>{search}</strong>"</p>}
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className="neo-btn px-4 py-2 text-sm font-black flex items-center gap-2 bg-white">
          <SlidersHorizontal size={16} />
          Filters {hasFilters && <span className="w-5 h-5 bg-[#F97316] text-white text-[10px] flex items-center justify-center">!</span>}
        </button>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="neo-card p-4 mb-6 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-black uppercase mb-1">Category</label>
            <select value={category} onChange={e => updateParam('category', e.target.value)}
              className="neo-input px-3 py-2 text-sm font-medium pr-8 appearance-none min-w-35">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-1">Sort By</label>
            <select value={ordering} onChange={e => updateParam('ordering', e.target.value)}
              className="neo-input px-3 py-2 text-sm font-medium pr-8 appearance-none min-w-40">
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="current_price_value">Price: Low to High</option>
              <option value="-current_price_value">Price: High to Low</option>
              <option value="name">Name A-Z</option>
              <option value="-name">Name Z-A</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={inStock === 'true'} onChange={e => updateParam('in_stock', e.target.checked ? 'true' : '')}
              className="w-4 h-4 neo-border accent-[#F97316]" />
            <span className="text-sm font-bold">In Stock Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={featured === 'true'} onChange={e => updateParam('is_featured', e.target.checked ? 'true' : '')}
              className="w-4 h-4 neo-border accent-[#F97316]" />
            <span className="text-sm font-bold">Featured Only</span>
          </label>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm font-bold text-red-500 hover:text-red-700 ml-2">
              <X size={14} /> Clear All
            </button>
          )}
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="neo-card p-4 animate-pulse">
              <div className="bg-gray-200 aspect-square mb-3" />
              <div className="h-4 bg-gray-200 mb-2" />
              <div className="h-4 bg-gray-200 w-2/3" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="neo-card p-16 text-center">
          <div className="text-5xl mb-4">📦</div>
          <div className="text-xl font-black mb-2">No products found</div>
          <p className="text-gray-500 text-sm">Try adjusting your filters</p>
          <button onClick={clearFilters} className="neo-btn mt-4 px-6 py-2 bg-[#F97316] text-white font-black text-sm">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          {[...Array(totalPages)].map((_, i) => (
            <button key={i}
              onClick={() => updateParam('page', i + 1)}
              className={`w-10 h-10 font-black text-sm neo-border transition-all
                ${page === i + 1 ? 'bg-[#F97316] text-white neo-shadow' : 'bg-white hover:bg-gray-50 neo-shadow-sm'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

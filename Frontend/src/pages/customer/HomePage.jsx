import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Truck, HeadphonesIcon, Star } from 'lucide-react';
import api from '../../lib/api';
import ProductCard from '../../components/products/ProductCard';
import RecommendedProductsSection from '../../components/products/RecommendedProductsSection';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featRes, catRes] = await Promise.all([
          api.get('/products/?is_featured=true&page_size=8'),
          api.get('/products/categories/'),
        ]);
        setFeatured(featRes.data.results || featRes.data);
        setCategories(catRes.data.slice(0, 6));
      } catch {}
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div className="page-enter">
      {/* Hero Section */}
      <section className="bg-[#F97316] neo-border border-l-0 border-r-0 border-t-0">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 neo-badge bg-[#0A0A0A] text-white px-3 py-1.5 mb-6">
                <Zap size={12} fill="white" />
                <span>Flash Deals Available Now</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-4">
                Shop Smart.<br />
                Live Better.<br />
                <span className="text-[#0A0A0A]">Save More.</span>
              </h1>
              <p className="text-orange-100 text-lg font-medium mb-8 max-w-md">
                Discover thousands of products at unbeatable prices. Fast delivery, easy returns, and 24/7 support.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/products"
                  className="neo-btn bg-[#0A0A0A] text-white px-8 py-3 text-base font-black flex items-center gap-2">
                  Shop Now <ArrowRight size={18} />
                </Link>
                <Link to="/register"
                  className="neo-btn bg-white text-[#0A0A0A] px-8 py-3 text-base font-black">
                  Join Free
                </Link>
              </div>
            </div>
            <div className="hidden md:grid grid-cols-2 gap-3">
              {['🛍️ 10K+ Products', '⚡ Same Day Dispatch', '🔒 Secure Payments', '⭐ 4.8 Rating'].map((item, i) => (
                <div key={i} className={`neo-card p-6 ${i === 1 ? 'bg-[#0A0A0A] text-white' : 'bg-white'}`}>
                  <div className="text-3xl mb-2">{item.split(' ')[0]}</div>
                  <div className="font-black text-sm">{item.split(' ').slice(1).join(' ')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="border-b-2 border-[#0A0A0A] bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck, label: 'Free Shipping', sub: 'On orders above ₹500' },
              { icon: Shield, label: 'Secure Payments', sub: '100% Protected' },
              { icon: HeadphonesIcon, label: '24/7 Support', sub: 'Always here for you' },
              { icon: Star, label: 'Best Quality', sub: 'Genuine products only' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-[#F97316] neo-border border-white/20 flex items-center justify-center shrink-0">
                  <Icon size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-sm font-black">{label}</div>
                  <div className="text-xs text-gray-400">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black">Shop by Category</h2>
            <Link to="/products" className="text-sm font-black text-[#F97316] hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map(cat => (
              <Link key={cat.id} to={`/products?category=${cat.id}`}
                className="neo-card neo-hover p-4 text-center group">
                <div className="w-12 h-12 bg-[#FED7AA] neo-border mx-auto flex items-center justify-center mb-3 group-hover:bg-[#F97316] transition-colors">
                  <span className="text-xl">🛒</span>
                </div>
                <div className="text-sm font-black leading-tight">{cat.name}</div>
                <div className="text-[10px] text-gray-400 mt-1">{cat.product_count} items</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-[#F97316]" />
            <h2 className="text-2xl font-black">Featured Products</h2>
          </div>
          <Link to="/products?is_featured=true" className="text-sm font-black text-[#F97316] hover:underline flex items-center gap-1">
            See All <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="neo-card p-4 animate-pulse">
                <div className="bg-gray-200 aspect-square mb-3" />
                <div className="h-4 bg-gray-200 mb-2" />
                <div className="h-4 bg-gray-200 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Recommendations */}
      <RecommendedProductsSection />

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="neo-card bg-[#0A0A0A] text-white p-8 md:p-12 text-center neo-shadow-lg">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Ready to start shopping?
          </h2>
          <p className="text-gray-400 font-medium mb-8 max-w-md mx-auto">
            Join thousands of happy customers. Create your free account today.
          </p>
          <Link to="/register"
            className="neo-btn bg-[#F97316] text-white px-10 py-3 text-base font-black inline-flex items-center gap-2">
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}

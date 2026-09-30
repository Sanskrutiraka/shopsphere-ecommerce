import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Package, ChevronLeft, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWishlist } from '../../contexts/WishlistContext';
import RecommendedProductsSection from '../../components/products/RecommendedProductsSection';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addToCart, getItemQuantity, updateProductQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [mainImgError, setMainImgError] = useState(false);
  const [qty, setQty] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });

  useEffect(() => {
    api.get(`/products/${slug}/`).then(r => {
      setProduct(r.data);
      setLoading(false);
      setMainImgError(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="animate-pulse grid md:grid-cols-2 gap-8">
        <div className="bg-gray-200 aspect-square neo-border" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-6 bg-gray-200" />)}
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-center">
      <div className="text-5xl mb-4">😕</div>
      <h2 className="text-xl font-black">Product not found</h2>
      <Link to="/products" className="neo-btn mt-4 px-6 py-2 bg-[#F97316] text-white font-black text-sm inline-block">
        Browse Products
      </Link>
    </div>
  );

  const price = product.current_price;
  const images = product.images || [];
  const stock = product.stock;
  const isOutOfStock = !stock || stock.quantity === 0;
  const hasDiscount = price?.discount_percentage > 0;
  const wishlisted = isInWishlist(product.id);
  const inCartQty = getItemQuantity(product.id);

  const handleAddToCart = async () => {
    if (!user) { toast.error('Please login'); return; }
    if (user.role !== 'CUSTOMER') { toast.error('Admins cannot shop'); return; }
    try { await addToCart(product.id, qty); toast.success('Added to cart!'); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleWishlist = async () => {
    if (!user) { toast.error('Please login'); return; }
    if (user.role !== 'CUSTOMER') { toast.error('Only customers can use wishlist'); return; }
    try {
      const res = await toggleWishlist(product.id);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to update wishlist');
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login'); return; }
    try {
      await api.post(`/products/${product.id}/reviews/`, reviewForm);
      toast.success('Review submitted!');
      const { data } = await api.get(`/products/${slug}/`);
      setProduct(data);
      setReviewForm({ rating: 5, title: '', comment: '' });
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to submit review.'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm font-bold mb-6 hover:text-[#F97316] transition-colors">
        <ChevronLeft size={16} /> Back to Products
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div>
          <div className="neo-border neo-shadow aspect-square overflow-hidden bg-gray-100 mb-3">
            {(() => {
              const activeImgObj = images[activeImage] || images[0] || product.primary_image;
              const activeSrc = activeImgObj?.image_url || activeImgObj?.image || (typeof activeImgObj === 'string' ? activeImgObj : null) || product.image;
              return activeSrc && !mainImgError ? (
                <img 
                  src={activeSrc} 
                  alt={product.name} 
                  onError={() => setMainImgError(true)}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Package size={80} className="text-gray-300" /></div>
              );
            })()}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => {
                const thumbSrc = img?.image_url || img?.image || (typeof img === 'string' ? img : '');
                return (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 shrink-0 neo-border overflow-hidden transition-all
                      ${i === activeImage ? 'neo-shadow border-[#F97316]' : 'opacity-60 hover:opacity-100'}`}>
                    <img src={thumbSrc} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.category && (
            <span className="text-xs font-black uppercase tracking-widest text-gray-400">{product.category.name}</span>
          )}
          <h1 className="text-2xl md:text-3xl font-black mt-1 mb-2">{product.name}</h1>

          {product.avg_rating && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={16} fill={s <= product.avg_rating ? '#F97316' : 'none'} className="text-[#F97316]" />
                ))}
              </div>
              <span className="text-sm font-bold">{product.avg_rating}</span>
              <span className="text-sm text-gray-400">({product.reviews?.length} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="neo-card-orange p-4 mb-4">
            {price ? (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black">₹{parseFloat(price.selling_price).toLocaleString('en-IN')}</span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-gray-400 line-through">₹{parseFloat(price.base_price).toLocaleString('en-IN')}</span>
                    <span className="neo-badge bg-[#F97316] text-white px-2 py-0.5">{price.discount_percentage}% OFF</span>
                  </>
                )}
              </div>
            ) : <span className="text-gray-400 font-bold">Price not set</span>}
            {price?.sale_label && <div className="text-sm font-bold text-[#F97316] mt-1">🏷️ {price.sale_label}</div>}
          </div>

          {/* Stock */}
          <div className={`flex items-center gap-2 text-sm font-black mb-4 ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
            <AlertCircle size={14} />
            {isOutOfStock ? 'Out of Stock' : `In Stock (${stock.quantity} available)`}
          </div>

          {/* Brand / SKU */}
          {product.brand && <div className="text-sm text-gray-500 mb-1"><strong>Brand:</strong> {product.brand}</div>}
          <div className="text-sm text-gray-500 mb-4"><strong>SKU:</strong> {product.sku}</div>

          {/* Quantity */}
          {!isOutOfStock && (
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm font-black uppercase">Qty:</label>
              <div className="flex neo-border neo-shadow">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-9 h-9 font-black hover:bg-[#F97316] hover:text-white transition-colors neo-border border-l-0 border-y-0">−</button>
                <span className="w-12 h-9 flex items-center justify-center font-black text-sm">{qty}</span>
                <button onClick={() => setQty(q => Math.min(stock.quantity, q + 1))}
                  className="w-9 h-9 font-black hover:bg-[#F97316] hover:text-white transition-colors neo-border border-r-0 border-y-0">+</button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {isOutOfStock ? (
              <button disabled className="flex-1 neo-btn py-3 font-black flex items-center justify-center gap-2 bg-gray-200 text-gray-400 cursor-not-allowed">
                <ShoppingCart size={18} /> Out of Stock
              </button>
            ) : inCartQty > 0 ? (
              <div className="flex-1 h-12 bg-white neo-border neo-shadow flex items-center justify-between overflow-hidden">
                <button
                  type="button"
                  onClick={() => updateProductQuantity(product.id, inCartQty - 1)}
                  className="w-14 h-full flex items-center justify-center font-black text-xl hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer border-r-2 border-[#0A0A0A]"
                  title="Decrease quantity"
                >
                  −
                </button>
                <div className="flex flex-col items-center justify-center flex-1">
                  <span className="font-black text-base text-[#0A0A0A]">{inCartQty} in Cart</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateProductQuantity(product.id, Math.min(stock?.quantity || 999, inCartQty + 1))}
                  className="w-14 h-full flex items-center justify-center font-black text-xl hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer border-l-2 border-[#0A0A0A]"
                  title="Increase quantity"
                >
                  +
                </button>
              </div>
            ) : (
              <button onClick={handleAddToCart}
                className="flex-1 neo-btn py-3 font-black flex items-center justify-center gap-2 bg-[#F97316] text-white hover:bg-[#EA580C] cursor-pointer">
                <ShoppingCart size={18} /> Add to Cart
              </button>
            )}
            <button
              onClick={handleWishlist}
              className={`neo-btn px-4 py-3 transition-colors flex items-center justify-center cursor-pointer
                ${wishlisted ? 'bg-red-50 border-red-500' : 'bg-white hover:bg-red-50'}`}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                size={18}
                strokeWidth={2.5}
                fill={wishlisted ? '#EF4444' : 'none'}
                className={wishlisted ? 'text-red-500' : 'text-gray-700 hover:text-red-500'}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="neo-card p-6 mb-8">
        <h2 className="text-lg font-black mb-3">Product Description</h2>
        <p className="text-gray-600 leading-relaxed font-medium">{product.description}</p>
      </div>

      {/* Reviews */}
      <div className="neo-card p-6">
        <h2 className="text-lg font-black mb-4">Customer Reviews ({product.reviews?.length || 0})</h2>
        {product.reviews?.map(r => (
          <div key={r.id} className="border-b-2 border-gray-100 pb-4 mb-4 last:border-0 last:mb-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => <Star key={s} size={13} fill={s <= r.rating ? '#F97316' : 'none'} className="text-[#F97316]" />)}
              </div>
              <span className="text-xs font-black">{r.user_name}</span>
              <span className="text-xs text-gray-400 ml-auto">{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
            </div>
            {r.title && <p className="text-sm font-black">{r.title}</p>}
            <p className="text-sm text-gray-600">{r.comment}</p>
          </div>
        ))}

        {user?.role === 'CUSTOMER' && (
          <form onSubmit={handleReview} className="mt-4 pt-4 border-t-2 border-gray-100 space-y-3">
            <h3 className="font-black">Write a Review</h3>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: s }))}>
                  <Star size={20} fill={s <= reviewForm.rating ? '#F97316' : 'none'} className="text-[#F97316]" />
                </button>
              ))}
            </div>
            <input value={reviewForm.title} onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Review title (optional)" className="neo-input w-full px-3 py-2 text-sm" />
            <textarea value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
              placeholder="Share your experience..." rows={3} required
              className="neo-input w-full px-3 py-2 text-sm resize-none" />
            <button type="submit" className="neo-btn px-6 py-2 bg-[#F97316] text-white font-black text-sm">Submit Review</button>
          </form>
        )}
      </div>

      <div className="mt-8">
        <RecommendedProductsSection
          title="Recommended Next"
          subtitle="Picked from your recent browsing and review history"
          limit={4}
          wrapperClassName="bg-transparent"
          containerClassName="max-w-none px-0"
          gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          emptyMessage="Log in and browse a few products to unlock personalized recommendations."
        />
      </div>
    </div>
  );
}

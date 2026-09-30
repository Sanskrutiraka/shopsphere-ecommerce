import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Package } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWishlist } from '../../contexts/WishlistContext';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addToCart, getItemQuantity, updateProductQuantity } = useCart();
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [imgError, setImgError] = useState(false);

  const price = product.current_price;
  const image = product.primary_image;
  const imageUrl = image?.image_url || image?.image || (typeof image === 'string' ? image : null) || product.image;
  const isOutOfStock = product.stock_qty === 0;
  const hasDiscount = price?.discount_percentage > 0;
  const wishlisted = isInWishlist(product.id);
  const cartQty = getItemQuantity(product.id);

  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Please login to add to cart'); return; }
    if (user.role !== 'CUSTOMER') { toast.error('Admins cannot add to cart'); return; }
    try {
      await addToCart(product.id, 1);
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
    }
  };

  const handleUpdateQuantity = async (e, newQty) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Please login to update cart'); return; }
    if (user.role !== 'CUSTOMER') { toast.error('Admins cannot shop'); return; }
    try {
      await updateProductQuantity(product.id, newQty);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update cart');
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Please login to use wishlist'); return; }
    if (user.role !== 'CUSTOMER') { toast.error('Only customer accounts can use wishlist'); return; }
    try {
      const res = await toggleWishlist(product.id);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to update wishlist');
    }
  };

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="neo-card neo-hover overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 neo-border border-l-0 border-r-0 border-t-0">
          {imageUrl && !imgError ? (
            <img 
              src={imageUrl} 
              alt={image?.alt_text || product.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={48} className="text-gray-300" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <span className="neo-badge bg-[#F97316] text-white px-2 py-0.5">
                -{price.discount_percentage}%
              </span>
            )}
            {product.is_featured && (
              <span className="neo-badge bg-[#FBBF24] text-black px-2 py-0.5">
                Featured
              </span>
            )}
            {isOutOfStock && (
              <span className="neo-badge bg-red-500 text-white px-2 py-0.5">
                Out of Stock
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            type="button"
            className={`absolute top-2 right-2 w-8 h-8 neo-border neo-shadow-sm flex items-center justify-center transition-all z-10 cursor-pointer
              ${wishlisted
                ? 'bg-red-50 border-red-500 opacity-100'
                : 'bg-white hover:bg-red-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
              }`}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              size={15}
              strokeWidth={2.5}
              fill={wishlisted ? '#EF4444' : 'none'}
              className={wishlisted ? 'text-red-500' : 'text-gray-700 hover:text-red-500'}
            />
          </button>
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1">
          {product.category_name && (
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
              {product.category_name}
            </span>
          )}
          <h3 className="font-black text-sm leading-tight mb-1 line-clamp-2 flex-1">
            {product.name}
          </h3>

          {/* Rating */}
          {product.avg_rating && (
            <div className="flex items-center gap-1 mb-2">
              <Star size={12} fill="#F97316" className="text-[#F97316]" />
              <span className="text-xs font-bold">{product.avg_rating}</span>
              <span className="text-[10px] text-gray-400">({product.review_count})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            {price ? (
              <>
                <span className="text-lg font-black text-[#0A0A0A]">
                  ₹{parseFloat(price.selling_price).toLocaleString('en-IN')}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-gray-400 line-through">
                    ₹{parseFloat(price.base_price).toLocaleString('en-IN')}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-gray-400 font-bold">Price TBD</span>
            )}
          </div>

          {/* Add to Cart / Quantity Controller */}
          {isOutOfStock ? (
            <button
              disabled
              className="neo-btn w-full py-2 text-xs font-black flex items-center justify-center gap-1.5 bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300 shadow-none"
            >
              <ShoppingCart size={13} strokeWidth={2.5} />
              Out of Stock
            </button>
          ) : cartQty > 0 ? (
            <div 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="w-full h-[34px] bg-white neo-border neo-shadow-sm flex items-center justify-between overflow-hidden"
            >
              <button
                type="button"
                onClick={(e) => handleUpdateQuantity(e, cartQty - 1)}
                className="w-10 h-full flex items-center justify-center font-black text-base hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer border-r-2 border-[#0A0A0A]"
                title="Decrease quantity"
              >
                −
              </button>
              <span className="flex-1 text-center font-black text-sm text-[#0A0A0A] select-none">
                {cartQty}
              </span>
              <button
                type="button"
                onClick={(e) => handleUpdateQuantity(e, cartQty + 1)}
                className="w-10 h-full flex items-center justify-center font-black text-base hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer border-l-2 border-[#0A0A0A]"
                title="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className="neo-btn w-full py-2 text-xs font-black flex items-center justify-center gap-1.5 bg-[#F97316] text-white hover:bg-[#EA580C] cursor-pointer"
            >
              <ShoppingCart size={13} strokeWidth={2.5} />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

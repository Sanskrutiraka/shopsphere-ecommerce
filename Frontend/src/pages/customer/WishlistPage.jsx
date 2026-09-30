import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart, ArrowRight, Package } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { wishlist, wishlistLoading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const handleAddToCart = async (productId, e) => {
    e.preventDefault();
    try {
      await addToCart(productId, 1);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  if (wishlistLoading && (!wishlist.items || wishlist.items.length === 0)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-96 bg-gray-200 neo-border" />
      </div>
    );
  }

  if (wishlist.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 bg-red-50 flex items-center justify-center rounded-full mx-auto mb-6">
          <Heart size={48} className="text-red-300" fill="#fecaca" />
        </div>
        <h1 className="text-3xl font-black mb-4">Your wishlist is empty</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto font-medium">Save items you love to your wishlist to buy them later.</p>
        <Link to="/products" className="neo-btn px-8 py-3 bg-[#F97316] text-white font-black inline-flex items-center gap-2">
          Discover Products <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
      <div className="flex items-center gap-3 mb-8">
        <Heart size={28} className="text-red-500" fill="#ef4444" />
        <h1 className="text-3xl font-black">My Wishlist</h1>
        <span className="neo-badge bg-[#0A0A0A] text-white px-2 py-1 ml-2">{wishlist.items.length} items</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {wishlist.items.map(item => {
          const product = item.product;
          if (!product) return null;
          const price = product.current_price;
          const isOutOfStock = product.stock_qty === 0;

          return (
            <div key={item.id} className="neo-card flex flex-col group relative">
              <button
                onClick={(e) => { e.preventDefault(); handleRemove(product.id); }}
                className="absolute top-2 right-2 z-10 w-8 h-8 bg-white neo-border neo-shadow-sm flex items-center justify-center text-red-500 hover:bg-red-50 hover:scale-110 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                title="Remove"
                aria-label="Remove from wishlist"
              >
                <Trash2 size={14} strokeWidth={2.5} />
              </button>

              <Link to={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden bg-gray-100 border-b-2 border-[#0A0A0A]">
                {(() => {
                  const wishImgUrl = product.primary_image?.image_url || product.primary_image?.image || (typeof product.primary_image === 'string' ? product.primary_image : null) || product.image;
                  return wishImgUrl ? (
                    <img src={wishImgUrl} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="text-gray-300" /></div>
                  );
                })()}
                {isOutOfStock && <span className="absolute top-2 left-2 neo-badge bg-red-500 text-white px-2 py-0.5">Out of Stock</span>}
              </Link>

              <div className="p-3.5 flex flex-col flex-1">
                <Link to={`/products/${product.slug}`} className="font-black text-sm line-clamp-2 hover:text-[#F97316] mb-2 flex-1">
                  {product.name}
                </Link>
                <div className="font-black text-lg mb-3">
                  {price ? `₹${parseFloat(price.selling_price).toLocaleString('en-IN')}` : 'Price TBD'}
                </div>
                <button
                  onClick={(e) => handleAddToCart(product.id, e)}
                  disabled={isOutOfStock}
                  className={`neo-btn w-full py-2.5 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer
                    ${isOutOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-[#0A0A0A] text-white'}`}
                >
                  <ShoppingCart size={14} /> {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Search, LogOut, LayoutDashboard, Package, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="neo-border border-l-0 border-r-0 border-t-0 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-[#F97316] neo-border flex items-center justify-center neo-shadow-sm">
              <Package size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black tracking-tight text-[#0A0A0A]">
              Shop<span className="text-[#F97316]">Sphere</span>
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg hidden md:flex">
            <div className="flex w-full neo-border neo-shadow-sm overflow-hidden">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 px-4 py-2 text-sm font-medium outline-none bg-white border-r-2 border-[#0A0A0A]"
              />
              <button
                type="submit"
                className="px-4 bg-[#F97316] hover:bg-[#EA6C0A] transition-colors"
              >
                <Search size={16} className="text-white" strokeWidth={2.5} />
              </button>
            </div>
          </form>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1 ml-auto">
            <Link to="/products" className="px-3 py-1.5 text-sm font-bold hover:text-[#F97316] transition-colors">
              Products
            </Link>

            {user ? (
              <>
                {isAdmin ? (
                  <Link to="/admin"
                    className="neo-btn px-3 py-1.5 text-sm bg-[#F97316] text-white flex items-center gap-1.5">
                    <LayoutDashboard size={14} />
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/wishlist" className="relative p-2 neo-hover" title="Wishlist">
                      <Heart size={20} strokeWidth={2.5} fill="#EF4444" className="text-red-500 hover:scale-110 transition-transform" />
                    </Link>
                    <Link to="/cart" className="relative p-2 neo-hover" title="Cart">
                      <ShoppingCart size={20} strokeWidth={2.5} />
                      {cart.item_count > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#F97316] text-white text-[10px] font-black flex items-center justify-center neo-border neo-shadow-sm">
                          {cart.item_count}
                        </span>
                      )}
                    </Link>
                    <Link to="/orders" className="px-3 py-1.5 text-sm font-bold hover:text-[#F97316] transition-colors">
                      Orders
                    </Link>
                    <Link to="/profile" className="p-2 neo-hover" title="Profile">
                      <User size={20} strokeWidth={2.5} />
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 neo-hover text-red-600 hover:text-red-700"
                  title="Logout"
                >
                  <LogOut size={20} strokeWidth={2.5} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-1.5 text-sm font-bold hover:text-[#F97316] transition-colors">
                  Login
                </Link>
                <Link to="/register"
                  className="neo-btn px-4 py-1.5 text-sm bg-[#F97316] text-white">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right Icons (Cart, Wishlist, Hamburger) */}
          <div className="flex md:hidden items-center gap-2 ml-auto">
            {user && !isAdmin && (
              <>
                <Link to="/wishlist" className="p-1.5 relative" aria-label="Wishlist">
                  <Heart size={20} strokeWidth={2.5} fill="#EF4444" className="text-red-500" />
                </Link>
                <Link to="/cart" className="p-1.5 text-[#0A0A0A] hover:text-[#F97316] relative" aria-label="Cart">
                  <ShoppingCart size={20} strokeWidth={2.5} />
                  {cart.item_count > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F97316] text-white text-[9px] font-black flex items-center justify-center neo-border">
                      {cart.item_count}
                    </span>
                  )}
                </Link>
              </>
            )}

            <button
              className="p-1.5 neo-border bg-gray-50 text-[#0A0A0A] hover:bg-orange-50 cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t-2 border-[#0A0A0A] mt-2 pt-4 space-y-3">
            <form onSubmit={handleSearch} className="flex neo-border neo-shadow-sm overflow-hidden mb-3">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 px-3 py-2 text-sm font-medium outline-none bg-white border-r-2 border-[#0A0A0A]"
              />
              <button type="submit" className="px-4 bg-[#F97316] text-white hover:bg-[#EA6C0A]">
                <Search size={16} />
              </button>
            </form>

            <div className="grid grid-cols-1 gap-1">
              <Link to="/products" className="py-2.5 px-3 rounded-none font-bold hover:bg-orange-50 border-b border-gray-100 flex items-center justify-between" onClick={() => setMenuOpen(false)}>
                <span>Products Catalog</span>
                <span className="text-xs text-gray-400">→</span>
              </Link>
              {user ? (
                <>
                  {!isAdmin && (
                    <>
                      <Link to="/wishlist" className="py-2.5 px-3 font-bold hover:bg-orange-50 border-b border-gray-100 flex items-center justify-between" onClick={() => setMenuOpen(false)}>
                        <span>Wishlist</span>
                        <Heart size={16} strokeWidth={2.5} fill="#EF4444" className="text-red-500" />
                      </Link>
                      <Link to="/cart" className="py-2.5 px-3 font-bold hover:bg-orange-50 border-b border-gray-100 flex items-center justify-between" onClick={() => setMenuOpen(false)}>
                        <span>Shopping Cart ({cart.item_count})</span>
                        <ShoppingCart size={16} className="text-[#F97316]" />
                      </Link>
                      <Link to="/orders" className="py-2.5 px-3 font-bold hover:bg-orange-50 border-b border-gray-100 flex items-center justify-between" onClick={() => setMenuOpen(false)}>
                        <span>My Orders</span>
                        <Package size={16} />
                      </Link>
                      <Link to="/profile" className="py-2.5 px-3 font-bold hover:bg-orange-50 border-b border-gray-100 flex items-center justify-between" onClick={() => setMenuOpen(false)}>
                        <span>Account & Profile</span>
                        <User size={16} />
                      </Link>
                    </>
                  )}
                  {isAdmin && (
                    <Link to="/admin" className="py-2.5 px-3 font-bold bg-[#F97316] text-white neo-border flex items-center justify-between mb-2" onClick={() => setMenuOpen(false)}>
                      <span className="flex items-center gap-2"><LayoutDashboard size={16} /> Admin Dashboard</span>
                      <span>→</span>
                    </Link>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                    className="w-full text-left py-2.5 px-3 font-bold text-red-600 hover:bg-red-50 flex items-center justify-between cursor-pointer"
                  >
                    <span>Sign Out</span>
                    <LogOut size={16} />
                  </button>
                </>
              ) : (
                <div className="pt-2 flex flex-col gap-2">
                  <Link to="/login" className="neo-btn py-2.5 text-center font-bold bg-white" onClick={() => setMenuOpen(false)}>
                    Login
                  </Link>
                  <Link to="/register" className="neo-btn py-2.5 text-center font-bold bg-[#F97316] text-white" onClick={() => setMenuOpen(false)}>
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

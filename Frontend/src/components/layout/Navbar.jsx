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
                    <Link to="/wishlist" className="relative p-2 neo-hover">
                      <Heart size={20} strokeWidth={2.5} />
                    </Link>
                    <Link to="/cart" className="relative p-2 neo-hover">
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
                    <Link to="/profile" className="p-2 neo-hover">
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

          {/* Mobile menu toggle */}
          <button
            className="md:hidden ml-auto p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t-2 border-[#0A0A0A] mt-2 pt-4 space-y-2">
            <form onSubmit={handleSearch} className="flex neo-border neo-shadow-sm overflow-hidden mb-3">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 px-4 py-2 text-sm font-medium outline-none bg-white border-r-2 border-[#0A0A0A]"
              />
              <button type="submit" className="px-4 bg-[#F97316]">
                <Search size={16} className="text-white" />
              </button>
            </form>
            {user ? (
              <>
                <Link to="/products" className="block py-2 font-bold" onClick={() => setMenuOpen(false)}>Products</Link>
                {!isAdmin && (
                  <>
                    <Link to="/wishlist" className="block py-2 font-bold" onClick={() => setMenuOpen(false)}>Wishlist</Link>
                    <Link to="/cart" className="block py-2 font-bold" onClick={() => setMenuOpen(false)}>Cart ({cart.item_count})</Link>
                    <Link to="/orders" className="block py-2 font-bold" onClick={() => setMenuOpen(false)}>My Orders</Link>
                    <Link to="/profile" className="block py-2 font-bold" onClick={() => setMenuOpen(false)}>Profile</Link>
                  </>
                )}
                {isAdmin && <Link to="/admin" className="block py-2 font-bold" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
                <button onClick={handleLogout} className="block py-2 font-bold text-red-600">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 font-bold" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" className="block py-2 font-bold text-[#F97316]" onClick={() => setMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

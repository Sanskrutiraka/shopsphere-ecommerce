import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, BarChart3, ShoppingBag,
  Users, Tag, Boxes, FileText, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard',  icon: LayoutDashboard, to: '/admin' },
  { label: 'Products',   icon: Package,         to: '/admin/products' },
  { label: 'Stock',      icon: Boxes,           to: '/admin/stock' },
  { label: 'Pricing',    icon: Tag,             to: '/admin/pricing' },
  { label: 'Orders',     icon: ShoppingBag,     to: '/admin/orders' },
  { label: 'Users',      icon: Users,           to: '/admin/users' },
  { label: 'Logs',       icon: BarChart3,       to: '/admin/logs' },
  { label: 'Reports',    icon: FileText,        to: '/admin/reports' },
];

export default function AdminSidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <aside className="w-64 h-screen bg-[#0A0A0A] text-white fixed left-0 top-0 flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b-2 border-white/10">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F97316] flex items-center justify-center border border-white/30">
            <Package size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-base font-black leading-none">ShopSphere</div>
            <div className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Admin Panel</div>
          </div>
        </Link>
      </div>

      {/* Admin Info */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="text-xs text-gray-400 font-medium mb-0.5">Logged in as</div>
        <div className="text-sm font-bold truncate">{user?.first_name} {user?.last_name}</div>
        <div className="text-[10px] text-orange-400 font-bold uppercase">{user?.role}</div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, to }) => {
          const active = to === '/admin' ? pathname === '/admin' : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-all
                ${active
                  ? 'bg-[#F97316] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
            >
              <Icon size={16} strokeWidth={2.5} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} strokeWidth={2.5} />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all"
        >
          <LogOut size={16} strokeWidth={2.5} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

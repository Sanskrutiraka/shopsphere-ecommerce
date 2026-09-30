import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Menu, Package } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Customer Pages
import HomePage from './pages/customer/HomePage';
import ProductListPage from './pages/customer/ProductListPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrdersPage from './pages/customer/OrdersPage';
import OrderDetailPage from './pages/customer/OrderDetailPage';
import WishlistPage from './pages/customer/WishlistPage';
import ProfilePage from './pages/customer/ProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/DashboardPage';
import AdminProducts from './pages/admin/ProductsPage';
import AdminStock from './pages/admin/StockPage';
import AdminPricing from './pages/admin/PricingPage';
import AdminOrders from './pages/admin/OrdersPage';
import AdminUsers from './pages/admin/UsersPage';
import AdminReports from './pages/admin/ReportsPage';
import AdminLogs from './pages/admin/LogsPage';

// Layout
import Navbar from './components/layout/Navbar';
import AdminSidebar from './components/layout/AdminSidebar';
import ChatbotWidget from './components/chatbot/ChatbotWidget';

function PrivateRoute({ children, adminOnly = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role === 'CUSTOMER') return <Navigate to="/" replace />;
  return children;
}

function CustomerLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <main className="page-enter">{children}</main>
      <ChatbotWidget />
    </div>
  );
}

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col lg:flex-row">
      {/* Mobile Admin Header */}
      <header className="lg:hidden bg-[#0A0A0A] text-white px-4 py-3 border-b-2 border-[#0A0A0A] flex items-center justify-between sticky top-0 z-30 shadow-md">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 bg-[#F97316] text-white neo-border flex items-center justify-center cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#F97316] flex items-center justify-center border border-white/30">
            <Package size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-black text-sm">ShopSphere <span className="text-[#F97316] text-xs">Admin</span></span>
        </div>
        <div className="w-8" />
      </header>

      {/* Sidebar (drawer on mobile, fixed on desktop) */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 w-full lg:ml-64 p-4 sm:p-6 md:p-8 page-enter overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={user ? <Navigate to={user.role === 'CUSTOMER' ? '/' : '/admin'} /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />

      {/* Customer Routes */}
      <Route path="/" element={<CustomerLayout><HomePage /></CustomerLayout>} />
      <Route path="/products" element={<CustomerLayout><ProductListPage /></CustomerLayout>} />
      <Route path="/products/:slug" element={<CustomerLayout><ProductDetailPage /></CustomerLayout>} />
      <Route path="/cart" element={<PrivateRoute><CustomerLayout><CartPage /></CustomerLayout></PrivateRoute>} />
      <Route path="/checkout" element={<PrivateRoute><CustomerLayout><CheckoutPage /></CustomerLayout></PrivateRoute>} />
      <Route path="/orders" element={<PrivateRoute><CustomerLayout><OrdersPage /></CustomerLayout></PrivateRoute>} />
      <Route path="/orders/:id" element={<PrivateRoute><CustomerLayout><OrderDetailPage /></CustomerLayout></PrivateRoute>} />
      <Route path="/wishlist" element={<PrivateRoute><CustomerLayout><WishlistPage /></CustomerLayout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><CustomerLayout><ProfilePage /></CustomerLayout></PrivateRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<PrivateRoute adminOnly><AdminLayout><AdminDashboard /></AdminLayout></PrivateRoute>} />
      <Route path="/admin/products" element={<PrivateRoute adminOnly><AdminLayout><AdminProducts /></AdminLayout></PrivateRoute>} />
      <Route path="/admin/stock" element={<PrivateRoute adminOnly><AdminLayout><AdminStock /></AdminLayout></PrivateRoute>} />
      <Route path="/admin/pricing" element={<PrivateRoute adminOnly><AdminLayout><AdminPricing /></AdminLayout></PrivateRoute>} />
      <Route path="/admin/orders" element={<PrivateRoute adminOnly><AdminLayout><AdminOrders /></AdminLayout></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute adminOnly><AdminLayout><AdminUsers /></AdminLayout></PrivateRoute>} />
      <Route path="/admin/reports" element={<PrivateRoute adminOnly><AdminLayout><AdminReports /></AdminLayout></PrivateRoute>} />
      <Route path="/admin/logs" element={<PrivateRoute adminOnly><AdminLayout><AdminLogs /></AdminLayout></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  border: '2px solid #0A0A0A',
                  boxShadow: '3px 3px 0px #0A0A0A',
                  borderRadius: '0px',
                  fontWeight: '600',
                  fontFamily: 'Geist Variable, sans-serif',
                },
                success: { iconTheme: { primary: '#F97316', secondary: '#fff' } },
              }}
            />
            <AppRoutes />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
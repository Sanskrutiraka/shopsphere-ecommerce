import { useState, useEffect, useRef } from 'react';
import { Package, Users, ShoppingBag, Banknote, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('week');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.get('/auth/admin/dashboard/', { params: { period: chartPeriod } }).then(r => {
      setStats(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [chartPeriod]);

  const recentLogs = Array.isArray(stats?.recent_logs) ? stats.recent_logs : [];
  const todayOrderStatuses = Array.isArray(stats?.today_order_statuses) ? stats.today_order_statuses : [];
  const trendingProducts = Array.isArray(stats?.trending_products) ? stats.trending_products : [];
  const lowStockProducts = Array.isArray(stats?.low_stock_products) ? stats.low_stock_products : [];
  const topCustomerToday = stats?.top_customer_today || null;
  const todayOrdersCount = Number(stats?.today_orders_count || 0);
  const LOG_ROW_HEIGHT = 80;
  const VISIBLE_LOG_ROWS = 3;
  const logScrollRef = useRef(null);
  const rowVirtualizer = useVirtualizer({
    count: recentLogs.length,
    getScrollElement: () => logScrollRef.current,
    estimateSize: () => LOG_ROW_HEIGHT,
    overscan: 5,
  });
  const logListHeight = Math.min(recentLogs.length, VISIBLE_LOG_ROWS) * LOG_ROW_HEIGHT;

  if (loading) return <div className="animate-pulse h-96 bg-gray-200 neo-border" />;
  if (!stats) return <div>Failed to load dashboard data.</div>;

  const StatCard = ({ title, value, icon: Icon, color, sub }) => (
    <div className="neo-card p-6 flex items-start justify-between bg-white relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${color} opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500`} />
      <div>
        <p className="text-sm font-black text-gray-500 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black mb-1">{value}</h3>
        {sub && <p className="text-xs font-bold text-gray-400">{sub}</p>}
      </div>
      <div className={`w-12 h-12 flex items-center justify-center neo-border ${color} text-white neo-shadow-sm`}>
        <Icon size={24} />
      </div>
    </div>
  );

  const chartData = Array.isArray(stats?.revenue_series)
    ? stats.revenue_series.map((item) => ({ name: item.label, revenue: Number(item.revenue) || 0 }))
    : [];

  const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1">Dashboard Overview</h1>
          <p className="text-gray-500 font-medium text-sm">Welcome back! Here's what's happening today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard title="Total Revenue" value={formatMoney(stats.total_revenue)} icon={Banknote} color="bg-green-500" />
        <StatCard title="Total Orders" value={stats.total_orders} icon={ShoppingBag} color="bg-blue-500" />
        <StatCard title="Total Products" value={stats.total_products} icon={Package} color="bg-[#F97316]" />
        <StatCard title="Total Users" value={stats.total_users} icon={Users} color="bg-purple-500" sub={`${stats.total_customers} Customers`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard title="Low Stock Items" value={lowStockProducts.length} icon={Package} color="bg-red-500" sub="At or below minimum level" />
        <StatCard
          title="Top Customer Today"
          value={topCustomerToday?.name || 'No sales yet'}
          icon={Users}
          color="bg-purple-500"
          sub={topCustomerToday ? `${formatMoney(topCustomerToday.total_spent)} across ${topCustomerToday.orders_count} orders` : 'No orders completed today'}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 neo-card p-6 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black flex items-center gap-2">
              <TrendingUp size={18} className="text-[#F97316]" /> Revenue Overview
            </h2>
            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
              className="neo-input px-3 py-1 text-xs font-bold bg-gray-50 uppercase"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#6B7280' }} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ border: '2px solid #0A0A0A', boxShadow: '3px 3px 0px #0A0A0A', borderRadius: 0, fontWeight: 700 }}
                  itemStyle={{ color: '#0A0A0A' }}
                  formatter={(value) => [`₹${Number(value || 0).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="neo-card p-6 bg-white flex flex-col">
          <h2 className="text-lg font-black mb-6">Recent Activity Logs</h2>
          {recentLogs.length > 0 ? (
            <div
              ref={logScrollRef}
              className="overflow-y-auto pr-2"
              style={{ height: `${logListHeight}px`, maxHeight: `${logListHeight}px` }}
            >
              <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const log = recentLogs[virtualRow.index];
                  const actionText = String(log?.action_type || 'UNKNOWN').replace(/_/g, ' ').toLowerCase();
                  const timestampText = log?.timestamp ? format(new Date(log.timestamp), 'MMM dd, hh:mm a') : '-';

                  return (
                    <div
                      key={log?.id || virtualRow.key}
                      className="border-b-2 border-gray-100 relative pl-4 pr-1"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${LOG_ROW_HEIGHT}px`,
                        paddingTop: '6px',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <div className="absolute left-0 top-1.5 w-2 h-2 bg-[#F97316]" />
                      <div className="text-xs text-gray-400 font-bold mb-0.5">{timestampText}</div>
                      <div className="text-sm font-medium leading-tight">
                        <span className="font-black">{log?.admin_email || 'System'}</span> {actionText} {log?.model_name && `on ${log.model_name}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 font-medium">No recent activity</div>
          )}
          <div className="mt-4 pt-4 border-t-2 border-gray-100 text-center">
            <button
              onClick={() => navigate('/admin/logs')}
              className="text-xs font-black text-[#F97316] hover:underline uppercase tracking-wide"
            >
              View All Logs
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8 mb-8">
        <div className="neo-card p-6 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black">Order Status Today</h2>
            <div className="text-xs font-black uppercase text-gray-500">{todayOrdersCount} Orders</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {todayOrderStatuses.map((status) => (
              <div key={status.status} className="p-4 bg-gray-50 neo-border">
                <div className="text-[10px] font-black uppercase text-gray-500 mb-2">{status.label}</div>
                <div className="text-2xl font-black">{status.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="neo-card p-6 bg-white">
          <h2 className="text-lg font-black mb-6">Top Customer Today</h2>
          {topCustomerToday ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 neo-border">
                <div className="text-xs font-black uppercase text-gray-500 mb-1">Customer</div>
                <div className="text-2xl font-black leading-tight">{topCustomerToday.name}</div>
                <div className="text-sm text-gray-500 font-medium mt-1">{topCustomerToday.email}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 neo-border">
                  <div className="text-[10px] font-black uppercase text-gray-500 mb-1">Orders</div>
                  <div className="text-2xl font-black">{topCustomerToday.orders_count}</div>
                </div>
                <div className="p-4 bg-gray-50 neo-border">
                  <div className="text-[10px] font-black uppercase text-gray-500 mb-1">Spent</div>
                  <div className="text-2xl font-black">{formatMoney(topCustomerToday.total_spent)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 font-medium">No completed orders today.</div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="neo-card p-6 bg-white overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black">Trending Products Today</h2>
            <div className="text-xs font-black uppercase text-gray-500">Top {trendingProducts.length}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
              <thead className="bg-[#0A0A0A] text-white font-black uppercase text-xs border-b-2 border-[#0A0A0A]">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Units</th>
                  <th className="p-3">Revenue</th>
                </tr>
              </thead>
              <tbody className="font-medium">
                {trendingProducts.length > 0 ? trendingProducts.map((product) => (
                  <tr key={`${product.product_id || product.product_sku}`} className="border-b-2 border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-black text-sm">{product.product_name}</td>
                    <td className="p-3 text-xs text-gray-500">{product.product_sku}</td>
                    <td className="p-3 text-sm">{product.units_sold}</td>
                    <td className="p-3 text-sm">{formatMoney(product.revenue)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="p-6 text-center text-gray-500">No sales data for today.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="neo-card p-6 bg-white overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black">Low Stock Alerts</h2>
            <div className="text-xs font-black uppercase text-gray-500">{lowStockProducts.length} Items</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
              <thead className="bg-[#0A0A0A] text-white font-black uppercase text-xs border-b-2 border-[#0A0A0A]">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Min</th>
                </tr>
              </thead>
              <tbody className="font-medium">
                {lowStockProducts.length > 0 ? lowStockProducts.map((item) => (
                  <tr key={item.product_id} className="border-b-2 border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-black text-sm">{item.product_name}</td>
                    <td className="p-3 text-xs text-gray-500">{item.sku}</td>
                    <td className="p-3 text-sm">
                      <span className={`px-2 py-1 text-[10px] font-black uppercase neo-border ${item.is_out_of_stock ? 'bg-red-100 text-red-800 border-red-300' : 'bg-orange-100 text-orange-800 border-orange-300'}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{item.min_level}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="p-6 text-center text-gray-500">All products are above minimum stock.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

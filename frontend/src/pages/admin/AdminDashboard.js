import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { TrendingUp, ShoppingBag, Package, AlertTriangle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchAnalytics();
  }, [navigate]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />

      <div className="md:ml-64 p-8">
        <div className="mb-8">
          <h1 className="font-playfair text-4xl font-bold text-stone-900 mb-2" data-testid="dashboard-title">Dashboard</h1>
          <p className="text-stone-600">Welcome back! Here's what's happening with your shop.</p>
        </div>

        {loading ? (
          <div className="text-center py-12" data-testid="loading-state">
            <p className="text-stone-500">Loading analytics...</p>
          </div>
        ) : analytics && (
          <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm" data-testid="stat-sales">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-stone-500 font-medium">Total Sales</span>
                </div>
                <p className="font-outfit text-3xl font-bold text-stone-900" data-testid="total-sales">
                  ₹{analytics.total_sales.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm" data-testid="stat-orders">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-indigo-600" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-stone-500 font-medium">Total Orders</span>
                </div>
                <p className="font-outfit text-3xl font-bold text-stone-900" data-testid="total-orders">{analytics.total_orders}</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm" data-testid="stat-pending">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <Package className="h-6 w-6 text-amber-600" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-stone-500 font-medium">Pending Orders</span>
                </div>
                <p className="font-outfit text-3xl font-bold text-stone-900" data-testid="pending-orders">{analytics.pending_orders}</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm" data-testid="stat-low-stock">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-rose-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-rose-600" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-stone-500 font-medium">Low Stock Items</span>
                </div>
                <p className="font-outfit text-3xl font-bold text-stone-900" data-testid="low-stock-count">{analytics.low_stock_count}</p>
              </div>
            </div>

            {/* Best Selling Products */}
            {analytics.best_selling_products.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6" data-testid="best-sellers">
                <h2 className="font-playfair text-2xl font-semibold text-stone-900 mb-6">Best Selling Products</h2>
                <div className="space-y-4">
                  {analytics.best_selling_products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0" data-testid={`best-seller-${index}`}>
                      <div>
                        <p className="font-medium text-stone-900">{product.product_name}</p>
                        <p className="text-sm text-stone-500">{product.quantity} units sold</p>
                      </div>
                      <p className="font-semibold text-stone-900">₹{product.revenue.toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

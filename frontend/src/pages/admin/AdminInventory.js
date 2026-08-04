import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Minus, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminInventory = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockInputs, setStockInputs] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  const getAdminToken = () => localStorage.getItem('adminToken') || localStorage.getItem('token');

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchProducts();
  }, [navigate]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
      setFilteredProducts(response.data);

      const initialInputs = {};
      response.data.forEach(p => {
        initialInputs[p.id] = p.stock;
      });
      setStockInputs(initialInputs);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load inventory products');
      setLoading(false);
    }
  };

  const handleStockInputChange = (productId, value) => {
    const val = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
    setStockInputs(prev => ({ ...prev, [productId]: val }));
  };

  const handleAdjustStock = (productId, delta) => {
    setStockInputs(prev => {
      const current = typeof prev[productId] === 'number' ? prev[productId] : 0;
      return { ...prev, [productId]: Math.max(0, current + delta) };
    });
  };

  const handleSaveStock = async (product) => {
    const token = getAdminToken();
    if (!token) {
      toast.error('Admin authentication required');
      navigate('/admin/login');
      return;
    }

    const newStock = parseInt(stockInputs[product.id], 10);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }

    setUpdatingId(product.id);
    try {
      const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
      
      // Try PATCH stock endpoint first
      try {
        await axios.patch(`${API}/products/${product.id}/stock`, { stock: newStock }, authHeaders);
      } catch (patchErr) {
        // Fallback to full PUT update if PATCH endpoint unavailable
        const parsedTags = typeof product.tags === 'string'
          ? product.tags.split(',').map(t => t.trim()).filter(Boolean)
          : (Array.isArray(product.tags) ? product.tags : []);

        const fullProductData = {
          name: product.name,
          description: product.description,
          category: product.category,
          fabric: product.fabric || 'Silk',
          occasion: product.occasion || 'Festive',
          price: product.price,
          stock: newStock,
          tags: parsedTags,
          featured: Boolean(product.featured),
          new_arrival: Boolean(product.new_arrival),
          images: product.images && product.images.length > 0 ? product.images : []
        };
        await axios.put(`${API}/products/${product.id}`, fullProductData, authHeaders);
      }

      toast.success(`Stock for "${product.name}" updated to ${newStock}!`);
      
      // Update local product state
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p));
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-rose-100 text-rose-700 border-rose-200' };
    if (stock < 5) return { label: 'Low Stock', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: 'Good Stock', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  };

  const lowStockProducts = filteredProducts.filter(p => p.stock < 5 && p.stock > 0);
  const outOfStockProducts = filteredProducts.filter(p => p.stock === 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />

      <div className="md:ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-playfair text-4xl font-bold text-stone-900 mb-2" data-testid="inventory-title">My Stock</h1>
            <p className="text-stone-600">Monitor and update product inventory levels in real-time</p>
          </div>
          <Button
            onClick={fetchProducts}
            variant="outline"
            className="flex items-center gap-2 bg-white"
            data-testid="refresh-inventory-button"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
            <Input
              type="text"
              placeholder="Search by product name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-white border-slate-200 shadow-sm"
              data-testid="inventory-search"
            />
          </div>
        </div>

        {/* Alerts */}
        {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {lowStockProducts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm" data-testid="low-stock-alert">
                <h3 className="font-semibold text-amber-900 mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Low Stock Alert
                </h3>
                <p className="text-sm text-amber-700">{lowStockProducts.length} product(s) running low on stock (less than 5 remaining)</p>
              </div>
            )}
            {outOfStockProducts.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm" data-testid="out-of-stock-alert">
                <h3 className="font-semibold text-rose-900 mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Out of Stock
                </h3>
                <p className="text-sm text-rose-700">{outOfStockProducts.length} product(s) are completely out of stock</p>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12" data-testid="loading-state">
            <p className="text-stone-500">Loading inventory...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="inventory-table">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-600">Product</th>
                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-600">Category</th>
                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-600">Price</th>
                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-600">Current Stock</th>
                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-600">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-600">Update Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(product => {
                    const stockStatus = getStockStatus(product.stock);
                    const isChanged = stockInputs[product.id] !== product.stock;
                    const isSaving = updatingId === product.id;

                    return (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-colors" data-testid={`inventory-row-${product.id}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={product.images && product.images[0] ? product.images[0] : "https://images.unsplash.com/photo-1742287724816-4a8a1cc7ad5c"}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                            />
                            <div>
                              <p className="font-semibold text-stone-900">{product.name}</p>
                              <p className="text-xs text-stone-500 line-clamp-1">{product.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-600 font-medium">{product.category}</td>
                        <td className="px-6 py-4 text-sm font-bold text-stone-900">₹{product.price.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">
                          <span className="font-extrabold text-xl text-stone-900" data-testid={`stock-${product.id}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${stockStatus.color}`} data-testid={`status-${product.id}`}>
                            {stockStatus.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(product.id, -1)}
                              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-stone-100 transition-colors"
                              title="Decrease stock"
                              data-testid={`decrement-stock-${product.id}`}
                            >
                              <Minus className="h-3 w-3 text-stone-600" />
                            </button>
                            <Input
                              type="number"
                              min="0"
                              value={stockInputs[product.id] !== undefined ? stockInputs[product.id] : product.stock}
                              onChange={(e) => handleStockInputChange(product.id, e.target.value)}
                              className="w-20 h-8 text-center text-sm font-semibold border-slate-300"
                              data-testid={`stock-input-${product.id}`}
                            />
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(product.id, 1)}
                              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-stone-100 transition-colors"
                              title="Increase stock"
                              data-testid={`increment-stock-${product.id}`}
                            >
                              <Plus className="h-3 w-3 text-stone-600" />
                            </button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveStock(product)}
                              disabled={isSaving || !isChanged}
                              className={`h-8 px-3 text-xs font-semibold rounded-lg transition-colors ${
                                isChanged ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-100 text-slate-400'
                              }`}
                              data-testid={`save-stock-${product.id}`}
                            >
                              {isSaving ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInventory;

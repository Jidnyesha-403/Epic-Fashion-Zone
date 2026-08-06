import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

export const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchOrders();
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setOrders(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem('adminToken');
    try {
      await axios.put(`${API}/orders/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Order status updated!');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-700';
      case 'Packed':
        return 'bg-indigo-100 text-indigo-700';
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-stone-100 text-stone-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />

      <div className="md:ml-64 p-8">
        <div className="mb-8">
          <h1 className="font-playfair text-4xl font-bold text-stone-900 mb-2" data-testid="orders-title">Orders</h1>
          <p className="text-stone-600">Manage customer orders and update status</p>
        </div>

        {loading ? (
          <div className="text-center py-12" data-testid="loading-state">
            <p className="text-stone-500">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center" data-testid="no-orders">
            <p className="text-stone-500">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="orders-list">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6" data-testid={`order-card-${order.id}`}>
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-stone-900 mb-1" data-testid={`order-number-${order.id}`}>
                      Order #{order.order_number}
                    </h3>
                    <p className="text-sm text-stone-500">
                      {format(new Date(order.created_at), 'MMM dd, yyyy hh:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`} data-testid={`order-status-${order.id}`}>
                      {order.status}
                    </span>
                    <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                      <SelectTrigger className="w-40" data-testid={`status-select-${order.id}`}>
                        <SelectValue>Update Status</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Packed">Packed</SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <h4 className="text-sm font-semibold text-stone-700 mb-2">Customer Details</h4>
                    <div className="text-sm text-stone-600 space-y-1">
                      <p data-testid={`customer-name-${order.id}`}>{order.customer_name}</p>
                      <p data-testid={`customer-email-${order.id}`}>{order.email}</p>
                      <p data-testid={`customer-phone-${order.id}`}>{order.phone}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-700 mb-2">Delivery Address</h4>
                    <p className="text-sm text-stone-600" data-testid={`delivery-address-${order.id}`}>
                      {order.address}, {order.city}, {order.state} - {order.pincode}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-sm font-semibold text-stone-700 mb-3">Order Items</h4>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4" data-testid={`order-item-${order.id}-${index}`}>
                        <img src={item.image} alt={item.product_name} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <p className="font-medium text-stone-900">{item.product_name}</p>
                          <p className="text-sm text-stone-500">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</p>
                        </div>
                        <p className="font-semibold text-stone-900">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 mt-4 pt-4 flex items-center justify-between">
                  <span className="text-sm text-stone-600">Payment: {order.payment_method}</span>
                  <div className="text-right">
                    <p className="text-sm text-stone-500 mb-1">Order Total</p>
                    <p className="font-semibold text-xl text-stone-900" data-testid={`order-total-${order.id}`}>
                      ₹{order.total.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;

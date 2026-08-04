import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/admin/login`, formData);
      localStorage.setItem('adminToken', response.data.access_token);
      toast.success('Login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100/50 to-indigo-100/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_ethnic-treasures-12/artifacts/0qjx6l1g_Screenshot_20250308_115550_WhatsApp.jpg" 
              alt="Epic Fashion Zone Logo" 
              className="h-16 w-16 object-contain"
            />
            <h1 className="font-playfair text-4xl font-bold text-indigo-950">Epic Fashion Zone</h1>
          </div>
          <p className="text-stone-600">Admin Portal</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-lg border border-stone-100">
          <h2 className="font-playfair text-2xl font-semibold text-stone-900 mb-6">Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                className="mt-1 h-11"
                data-testid="admin-email-input"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                className="mt-1 h-11"
                data-testid="admin-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-950 hover:bg-indigo-900 text-white h-12 text-lg font-medium rounded-lg"
              data-testid="admin-login-button"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

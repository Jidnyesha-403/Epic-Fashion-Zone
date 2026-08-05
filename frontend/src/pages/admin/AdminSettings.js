import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Eye, EyeOff, Save } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

export const AdminSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [settings, setSettings] = useState({
    razorpay_key_id: "",
    razorpay_key_secret: "",
    razorpay_mode: "test"
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchSettings();
  }, [navigate]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/settings/payment`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings({
        ...response.data,
        razorpay_key_secret: "" // Never load secret for security
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!settings.razorpay_key_secret) {
      toast.error("Please enter Razorpay Key Secret");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('adminToken');

    try {
      await axios.put(`${API}/settings/payment`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payment settings updated successfully!');
      setSettings(prev => ({ ...prev, razorpay_key_secret: "" }));
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />

      <div className="md:ml-64 p-8">
        <div className="mb-8">
          <h1 className="font-playfair text-4xl font-bold text-stone-900 mb-2" data-testid="settings-title">
            Payment Settings
          </h1>
          <p className="text-stone-600">Configure Razorpay payment gateway credentials</p>
        </div>

        <div className="max-w-2xl">
          <div className="bg-white rounded-xl p-8 border border-slate-100 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Info Banner */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-900 mb-2">How to get Razorpay credentials:</h3>
                <ol className="text-sm text-indigo-700 space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://dashboard.razorpay.com/" target="_blank" rel="noopener noreferrer" className="underline">Razorpay Dashboard</a></li>
                  <li>Navigate to Settings → API Keys</li>
                  <li>Generate/Copy your Key ID and Key Secret</li>
                  <li>Use test keys for testing, live keys for production</li>
                </ol>
              </div>

              {/* Mode Selection */}
              <div>
                <Label htmlFor="razorpay_mode">Payment Mode</Label>
                <Select 
                  value={settings.razorpay_mode} 
                  onValueChange={(value) => setSettings(prev => ({ ...prev, razorpay_mode: value }))}
                >
                  <SelectTrigger className="mt-1 h-11" data-testid="mode-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Test Mode (for testing)</SelectItem>
                    <SelectItem value="live">Live Mode (production)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-stone-500 mt-1">
                  Use test mode for testing payments without real transactions
                </p>
              </div>

              {/* Key ID */}
              <div>
                <Label htmlFor="razorpay_key_id">Razorpay Key ID</Label>
                <Input
                  id="razorpay_key_id"
                  value={settings.razorpay_key_id}
                  onChange={(e) => setSettings(prev => ({ ...prev, razorpay_key_id: e.target.value }))}
                  placeholder="rzp_test_xxxxxxxxxx or rzp_live_xxxxxxxxxx"
                  required
                  className="mt-1 h-11"
                  data-testid="key-id-input"
                />
              </div>

              {/* Key Secret */}
              <div>
                <Label htmlFor="razorpay_key_secret">Razorpay Key Secret</Label>
                <div className="relative mt-1">
                  <Input
                    id="razorpay_key_secret"
                    type={showSecret ? "text" : "password"}
                    value={settings.razorpay_key_secret}
                    onChange={(e) => setSettings(prev => ({ ...prev, razorpay_key_secret: e.target.value }))}
                    placeholder="Enter your Razorpay Key Secret"
                    required
                    className="h-11 pr-10"
                    data-testid="key-secret-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    data-testid="toggle-secret-visibility"
                  >
                    {showSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-sm text-stone-500 mt-1">
                  Your secret is encrypted and never exposed to customers
                </p>
              </div>

              {/* Security Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Security:</strong> Your Razorpay credentials are stored securely and never exposed in frontend code. 
                  Only the Key ID is sent to customers during checkout.
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-lg font-medium rounded-lg"
                data-testid="save-settings-button"
              >
                <Save className="mr-2 h-5 w-5" />
                {loading ? 'Saving...' : 'Save Payment Settings'}
              </Button>
            </form>
          </div>

          {/* Current Configuration */}
          <div className="mt-6 bg-stone-100 rounded-lg p-4">
            <h3 className="font-semibold text-stone-900 mb-2">Current Configuration:</h3>
            <div className="text-sm text-stone-600 space-y-1">
              <p><strong>Mode:</strong> {settings.razorpay_mode === "test" ? "Test Mode" : "Live Mode"}</p>
              <p><strong>Key ID:</strong> {settings.razorpay_key_id || "Not configured"}</p>
              <p><strong>Status:</strong> {settings.razorpay_key_id ? "✓ Configured" : "⚠ Not configured"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

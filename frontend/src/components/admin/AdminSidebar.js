import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, Archive, Settings, LogOut } from "lucide-react";

export const AdminSidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  const links = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/products', icon: Package, label: 'My Products' },
    { path: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/admin/inventory', icon: Archive, label: 'My Stock' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 p-6 hidden md:block" data-testid="admin-sidebar">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <img 
            src="https://customer-assets.emergentagent.com/job_ethnic-treasures-12/artifacts/0qjx6l1g_Screenshot_20250308_115550_WhatsApp.jpg" 
            alt="Epic Fashion Zone Logo" 
            className="h-10 w-10 object-contain"
          />
          <h1 className="font-playfair text-2xl font-bold text-indigo-950">Epic Fashion Zone</h1>
        </div>
        <p className="text-sm text-stone-500 mt-1">Admin Portal</p>
      </div>

      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`admin-sidebar-link flex items-center space-x-3 px-4 py-3 rounded-lg ${
              isActive(link.path)
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-stone-600 hover:bg-slate-50'
            }`}
            data-testid={`sidebar-link-${link.label.toLowerCase().replace(' ', '-')}`}
          >
            <link.icon className="h-5 w-5" />
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="admin-sidebar-link flex items-center space-x-3 px-4 py-3 rounded-lg text-rose-600 hover:bg-rose-50 w-full mt-8"
        data-testid="logout-button"
      >
        <LogOut className="h-5 w-5" />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default AdminSidebar;

import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { FaUsers, FaImages, FaConciergeBell, FaHeartbeat, FaSignOutAlt, FaFileContract, FaQuoteRight, FaLayerGroup, FaTrash } from 'react-icons/fa';

const navItems = [
  { to: '/admin/leads', icon: FaUsers, label: 'Leads' },
  { to: '/admin/portfolio', icon: FaImages, label: 'Portfolio' },
  { to: '/admin/services', icon: FaConciergeBell, label: 'Services' },
  { to: '/admin/health', icon: FaHeartbeat, label: 'API Health' },
  { to: '/admin/reviews', icon: FaQuoteRight, label: 'Reviews' },
  { to: '/admin/legal', icon: FaFileContract, label: 'Legal' },
  { to: '/admin/visionboards', icon: FaLayerGroup, label: 'Vision Boards' },
  { to: '/admin/trash', icon: FaTrash, label: 'Recycle Bin' },
];

const AdminLayout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('intedesign_admin_token');
    if (!token) navigate('/admin/login', { replace: true });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('intedesign_admin_token');
    localStorage.removeItem('intedesign_admin_email');
    navigate('/admin/login');
  };

  const email = localStorage.getItem('intedesign_admin_email') || 'Admin';

  return (
    <div className="min-h-screen bg-[#080808] text-white flex">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-white/3 border-r border-white/8 flex flex-col">
        <div className="p-6 border-b border-white/8">
          <p className="text-lg font-serif tracking-[0.25em] uppercase text-white">InteDesign</p>
          <p className="text-[9px] text-white/25 tracking-widest uppercase mt-0.5">Admin Console</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs tracking-widest uppercase transition-all ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/35 hover:text-white/70 hover:bg-white/5'
                }`
              }
            >
              <Icon className="text-sm" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/8">
          <p className="text-[9px] text-white/25 mb-2 truncate">{email}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-white/30 hover:text-red-400/70 transition-colors"
          >
            <FaSignOutAlt className="text-xs" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

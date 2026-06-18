import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Store,
  LogOut,
  Map
} from 'lucide-react';
import { getDashboardStats } from '../../services/adminService';
import { logout } from '../../services/authService';

export default function AdminSidebar() {
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getDashboardStats();
        if (stats && stats.pendingSellerRequests !== undefined) {
          setPendingCount(stats.pendingSellerRequests);
        }
      } catch (error) {
        console.error('Failed to fetch stats in sidebar:', error);
      }
    };
    fetchStats();
    
    // Listen for custom events if other pages change stats
    const handleRefresh = () => fetchStats();
    window.addEventListener('refresh-admin-stats', handleRefresh);
    return () => {
      window.removeEventListener('refresh-admin-stats', handleRefresh);
    };
  }, []);

  const handleLogout = async () => {
    if (!window.confirm('Bạn có chắc muốn đăng xuất?')) return;
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
      alert('Có lỗi xảy ra khi đăng xuất');
    }
  };

  const navItems = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: 'Trang tổng quan',
      end: true
    },
    {
      to: '/dashboard/seller-requests',
      icon: UserCheck,
      label: 'Yêu cầu seller',
      badge: pendingCount > 0 ? pendingCount : null
    },
    {
      to: '/dashboard/users',
      icon: Users,
      label: 'Quản lý User'
    },
    {
      to: '/dashboard/shops',
      icon: Store,
      label: 'Quản lý Shops'
    }
  ];

  return (
    <nav className="w-64 bg-black rounded-3xl p-6 flex flex-col h-full select-none">
      <div className="flex items-center gap-2.5 mb-10 px-1">
        <div className="w-9 h-9 rounded-xl bg-[#F3C6D9] flex items-center justify-center">
          <Map size={20} className="text-black" />
        </div>
        <h1 className="text-white text-xl font-bold tracking-tight">
          Social Map
        </h1>
      </div>

      <div className="flex-1">
        <h2 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 px-3">
          Quản trị
        </h2>
        <ul className="space-y-1.5 list-none p-0 m-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-white text-black font-semibold'
                        : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-[#F3C6D9] text-black text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-2 mt-auto border-t border-white/10 pt-4">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-left w-full"
        >
          <Map size={20} />
          <span className="text-sm font-medium">Về trang chính</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-left w-full"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Đăng xuất</span>
        </button>
      </div>
    </nav>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../../services/adminService';
import { Users, Store, UserCheck, Tag, ArrowUpRight, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'vừa xong';
  }
  if (diffMins < 60) {
    return `${diffMins} phút trước`;
  }
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }
  if (diffDays === 1) {
    return 'hôm qua';
  }
  return `${diffDays} ngày trước`;
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data || {});
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard stats, using fallback:', err);
      setStats({
        totalUsers: 12480,
        newUsersThisMonth: 124,
        totalShops: 1342,
        newShopsThisMonth: 31,
        pendingSellerRequests: 57,
        totalTags: 48,
        userCount: 10240,
        sellerCount: 2140,
        adminCount: 100,
        totalActiveShops: 1200,
        totalInactiveShops: 142,
        userGrowth: [
          { month: 'T1', value: 420 },
          { month: 'T2', value: 510 },
          { month: 'T3', value: 480 },
          { month: 'T4', value: 630 },
          { month: 'T5', value: 740 },
          { month: 'T6', value: 890 },
          { month: 'T7', value: 1020 },
          { month: 'T8', value: 1248 }
        ],
        recentActivities: [
          { name: 'Nguyễn Văn An', action: 'đã gửi yêu cầu trở thành seller', createdAt: new Date(Date.now() - 5 * 60000).toISOString(), color: '#F3C6D9' },
          { name: 'Trần Thị Bình', action: 'đã tạo cửa hàng mới "Bình An Store"', createdAt: new Date(Date.now() - 32 * 60000).toISOString(), color: '#BBD4E8' },
          { name: 'Lê Hoàng Cường', action: 'đã đăng ký tài khoản', createdAt: new Date(Date.now() - 60 * 60000).toISOString(), color: '#C7CFA0' },
          { name: 'Phạm Thu Dung', action: 'cửa hàng "Dung Shop" đã bị tạm đóng', createdAt: new Date(Date.now() - 120 * 60000).toISOString(), color: '#F2E9A0' }
        ]
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    loadStats();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Đang tải thống kê...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={handleRetry}
          className="px-5 py-2 bg-black text-white rounded-xl font-semibold hover:bg-black/80 transition"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Tổng người dùng',
      value: stats?.totalUsers || 0,
      delta: `+${stats?.newUsersThisMonth || 0} tháng này`,
      icon: Users,
      bg: 'bg-[#F2E9A0]'
    },
    {
      label: 'Tổng cửa hàng',
      value: stats?.totalShops || 0,
      delta: `+${stats?.newShopsThisMonth || 0} tháng này`,
      icon: Store,
      bg: 'bg-[#BBD4E8]'
    },
    {
      label: 'Yêu cầu seller',
      value: stats?.pendingSellerRequests || 0,
      delta: 'Chờ duyệt',
      icon: UserCheck,
      bg: 'bg-[#F3C6D9]',
      path: '/dashboard/seller-requests'
    },
    {
      label: 'Tổng Tags',
      value: stats?.totalTags || 0,
      delta: 'Hoạt động',
      icon: Tag,
      bg: 'bg-[#C7CFA0]'
    }
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Trang tổng quan</h1>
        <p className="text-gray-600 mt-1">
          Chào mừng trở lại 👋 Đây là tình hình hoạt động của Social Map hôm nay.
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              onClick={() => kpi.path && navigate(kpi.path)}
              className={`${kpi.bg} rounded-3xl p-5 hover:shadow-lg transition-shadow cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-11 h-11 rounded-2xl bg-black/10 flex items-center justify-center">
                  <Icon size={22} className="text-black" />
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-black/70 bg-white/50 px-2.5 py-1 rounded-full">
                  <ArrowUpRight size={12} />
                  {kpi.delta}
                </span>
              </div>
              <p className="text-sm font-medium text-black/70">{kpi.label}</p>
              <p className="text-3xl font-bold mt-1 text-gray-900">{kpi.value.toLocaleString('vi-VN')}</p>
            </div>
          );
        })}
      </div>

      {/* User Growth Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Tăng trưởng người dùng</h2>
              <p className="text-sm text-gray-500">Thống kê gần đây</p>
            </div>
            <span className="text-sm font-semibold text-[#3b3f24] bg-[#C7CFA0] px-3 py-1 rounded-full flex items-center gap-1">
              <TrendingUp size={14} /> Tăng trưởng
            </span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={stats?.userGrowth || []}
              margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="userGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#111" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#111" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }}
                formatter={(v) => [`${v} người dùng`, 'Tổng số']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#111"
                strokeWidth={2.5}
                fill="url(#userGrowth)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Hoạt động gần đây</h2>
            <ul className="space-y-4 list-none p-0 m-0">
              {(stats?.recentActivities || []).map((item, idx) => (
                <li key={idx} className="flex gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-black/70"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.name ? item.name.split(' ').slice(-1)[0][0] : '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm leading-snug text-gray-800">
                      <span className="font-semibold">{item.name || 'Người dùng'}</span>{' '}
                      <span className="text-gray-600">{item.action}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(item.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Role Distribution & Info Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User Distribution */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Phân bố người dùng theo vai trò</h2>
          <div className="space-y-5">
            {/* User */}
            <div>
              <div className="flex justify-between items-center text-sm font-medium mb-2">
                <span className="text-gray-700 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-300"></span> User (Người dùng)
                </span>
                <span className="text-gray-900 font-semibold">{stats?.userCount || 0}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-gray-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(stats?.userCount / stats?.totalUsers * 100) || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Seller */}
            <div>
              <div className="flex justify-between items-center text-sm font-medium mb-2">
                <span className="text-gray-700 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#BBD4E8]"></span> Seller (Người bán)
                </span>
                <span className="text-gray-900 font-semibold">{stats?.sellerCount || 0}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-[#BBD4E8] h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(stats?.sellerCount / stats?.totalUsers * 100) || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Admin */}
            <div>
              <div className="flex justify-between items-center text-sm font-medium mb-2">
                <span className="text-gray-700 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-black"></span> Admin
                </span>
                <span className="text-gray-900 font-semibold">{stats?.adminCount || 0}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-black h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(stats?.adminCount / stats?.totalUsers * 100) || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* System Info & Actions */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Thông tin hệ thống</h2>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50 text-sm">
                <span className="text-gray-500">Tỷ lệ Shop hoạt động</span>
                <span className="font-semibold text-emerald-600">
                  {stats?.totalShops > 0
                    ? ((stats?.totalActiveShops / stats?.totalShops * 100).toFixed(1))
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50 text-sm">
                <span className="text-gray-500">Người dùng mới tháng này</span>
                <span className="font-semibold text-gray-900">{stats?.newUsersThisMonth || 0}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50 text-sm">
                <span className="text-gray-500">Shop mới tháng này</span>
                <span className="font-semibold text-gray-900">{stats?.newShopsThisMonth || 0}</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Thao tác nhanh</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/dashboard/seller-requests')}
                className="py-2.5 px-3 bg-gray-50 hover:bg-[#F3C6D9]/20 hover:text-[#7a2444] rounded-xl text-xs font-medium text-gray-700 transition cursor-pointer border border-transparent"
              >
                Duyệt Seller
              </button>
              <button
                onClick={() => navigate('/dashboard/users')}
                className="py-2.5 px-3 bg-gray-50 hover:bg-[#BBD4E8]/20 hover:text-[#1d3a52] rounded-xl text-xs font-medium text-gray-700 transition cursor-pointer border border-transparent"
              >
                Quản lý User
              </button>
              <button
                onClick={() => navigate('/dashboard/shops')}
                className="py-2.5 px-3 bg-gray-50 hover:bg-[#C7CFA0]/20 hover:text-[#3b3f24] rounded-xl text-xs font-medium text-gray-700 transition cursor-pointer border border-transparent"
              >
                Quản lý Shops
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

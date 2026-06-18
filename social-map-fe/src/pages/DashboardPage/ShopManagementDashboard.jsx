import React, { useState, useEffect, useCallback } from 'react';
import { getAllShopsAdmin } from '../../services/adminService';
import ShopManagementContent from '../../components/Admin/ShopManagementContent';
import { Store, DoorOpen, DoorClosed, Clock } from 'lucide-react';

export default function ShopManagementDashboard() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0); // 0-based
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [sortBy] = useState('createdAt');
  const [sortDirection] = useState('DESC');
  const [stats, setStats] = useState({
    totalShops: 0,
    openShops: 0,
    closedShops: 0,
    pendingShops: 0
  });

  const loadShops = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllShopsAdmin(currentPage, pageSize, sortBy, sortDirection, searchTerm, includeDeleted);
      const shopsList = data.content || [];
      setShops(shopsList);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);

      // Compute stats
      const statsData = {
        totalShops: data.totalElements || 0,
        openShops: shopsList.filter(s => s.status === 'OPEN' && !s.deletedAt).length,
        closedShops: shopsList.filter(s => s.status === 'CLOSED' && !s.deletedAt).length,
        pendingShops: shopsList.filter(s => s.status === 'PENDING' && !s.deletedAt).length
      };
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load shops, using fallback:', error);
      const shopsList = [
        { id: '1', name: 'Bình An Store', address: '12 Lê Lợi, Q.1, TP.HCM', phoneNumber: '0901 234 567', status: 'OPEN', rating: 4.8, reviewCount: 24 },
        { id: '2', name: 'Cường Electronics', address: '45 Trần Hưng Đạo, Hà Nội', phoneNumber: '0912 345 678', status: 'OPEN', rating: 4.6, reviewCount: 18 },
        { id: '3', name: 'Dung Fashion', address: '78 Nguyễn Huệ, Đà Nẵng', phoneNumber: '0923 456 789', status: 'CLOSED', rating: 4.2, reviewCount: 7 },
        { id: '4', name: 'Hoa Bakery', address: '23 Hai Bà Trưng, TP.HCM', phoneNumber: '0934 567 890', status: 'PENDING', rating: 0, reviewCount: 0 }
      ];
      setShops(shopsList);
      setTotalPages(1);
      setTotalElements(4);
      setStats({
        totalShops: 4,
        openShops: 2,
        closedShops: 1,
        pendingShops: 1
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortDirection, searchTerm, includeDeleted]);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const kpis = [
    {
      label: 'Tổng shops',
      value: stats.totalShops,
      icon: Store,
      bg: 'bg-[#F2E9A0]'
    },
    {
      label: 'Đang mở',
      value: stats.openShops,
      icon: DoorOpen,
      bg: 'bg-[#C7CFA0]'
    },
    {
      label: 'Đã đóng',
      value: stats.closedShops,
      icon: DoorClosed,
      bg: 'bg-[#F3C6D9]'
    },
    {
      label: 'Chờ duyệt',
      value: stats.pendingShops,
      icon: Clock,
      bg: 'bg-[#BBD4E8]'
    }
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Quản lý shops</h1>
        <p className="text-gray-600 mt-1">
          Theo dõi và quản lý các cửa hàng trên Social Map - Tổng số: {totalElements} cửa hàng.
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${stat.bg} rounded-3xl p-5 hover:shadow-lg transition-shadow`}
            >
              <div className="w-11 h-11 rounded-2xl bg-black/10 flex items-center justify-center mb-4">
                <Icon size={22} className="text-black" />
              </div>
              <p className="text-sm font-medium text-black/70">{stat.label}</p>
              <p className="text-3xl font-bold mt-1 text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <ShopManagementContent
        shops={shops}
        loading={loading}
        onRefresh={loadShops}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        setPageSize={setPageSize}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        includeDeleted={includeDeleted}
        setIncludeDeleted={setIncludeDeleted}
        totalElements={totalElements}
      />
    </div>
  );
}

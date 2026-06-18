import React, { useState, useEffect } from 'react';
import { getMyShops, deleteShop } from '../../services/shopService';
import CreateShopModal from '../../components/Shop/CreateShopModal';
import {
  Search, Pencil, Trash2, Eye, Plus, X,
  Star, MapPin, Phone, ShoppingBag, Clock, Store, DoorOpen, DoorClosed
} from 'lucide-react';
import StatusBadge from '../../components/Admin/StatusBadge';
import './ShopManagementPage.css';

export default function ShopManagementPage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState(null);

  useEffect(() => {
    loadMyShops();
  }, []);

  const loadMyShops = async () => {
    try {
      setLoading(true);
      setError('');
      const myShops = await getMyShops();
      setShops(myShops || []);
    } catch (err) {
      setError('Không thể tải danh sách cửa hàng. Vui lòng thử lại.');
      console.error('Error loading shops:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shopId, shopName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa cửa hàng "${shopName}"?`)) {
      return;
    }

    try {
      await deleteShop(shopId);
      alert('Xóa cửa hàng thành công!');
      loadMyShops();
    } catch (err) {
      setError('Không thể xóa cửa hàng. Vui lòng thử lại.');
      console.error('Error deleting shop:', err);
    }
  };

  const handleShopCreated = (newShop) => {
    loadMyShops();
    setIsCreateModalOpen(false);
  };

  const handleShopUpdated = (updatedShop) => {
    loadMyShops();
    setEditingShop(null);
  };

  const handleEdit = (shop) => {
    setEditingShop(shop);
  };

  // Client-side filtering
  const filteredShops = shops.filter(shop =>
    shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute stats
  const stats = {
    total: shops.length,
    open: shops.filter(s => s.status === 'OPEN' && !s.deletedAt).length,
    closed: shops.filter(s => s.status === 'CLOSED' && !s.deletedAt).length,
    pending: shops.filter(s => s.status === 'PENDING' && !s.deletedAt).length
  };

  const kpis = [
    {
      label: 'Tổng shops của tôi',
      value: stats.total,
      icon: Store,
      bg: 'bg-[#F2E9A0]'
    },
    {
      label: 'Đang hoạt động',
      value: stats.open,
      icon: DoorOpen,
      bg: 'bg-[#C7CFA0]'
    },
    {
      label: 'Tạm đóng cửa',
      value: stats.closed,
      icon: DoorClosed,
      bg: 'bg-[#F3C6D9]'
    },
    {
      label: 'Chờ duyệt',
      value: stats.pending,
      icon: Clock,
      bg: 'bg-[#BBD4E8]'
    }
  ];

  const statusMeta = {
    OPEN: { label: 'Đang mở', variant: 'success' },
    CLOSED: { label: 'Đã đóng', variant: 'danger' },
    PENDING: { label: 'Chờ duyệt', variant: 'warning' }
  };

  if (loading && shops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Đang tải danh sách cửa hàng của bạn...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Store size={28} className="text-black" />
            <span>Quản lý cửa hàng</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Theo dõi, cập nhật thông tin và quản lý các cửa hàng của bạn.
          </p>
        </div>
        {!loading && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-black/85 transition border-none cursor-pointer flex items-center gap-1.5 self-start md:self-auto"
          >
            <Plus size={16} /> Tạo cửa hàng mới
          </button>
        )}
      </header>

      {error && (
        <div className="bg-[#F3C6D9] text-[#7a2444] px-4 py-3 rounded-xl text-sm font-semibold border border-red-200">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {shops.length > 0 && (
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
      )}

      {/* Filters Bar */}
      {shops.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm cửa hàng theo tên hoặc địa chỉ..."
              className="w-full pl-11 pr-10 py-2.5 bg-gray-50 border border-gray-100 rounded-full text-sm outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Hiển thị {filteredShops.length} trên {shops.length} cửa hàng
          </div>
        </div>
      )}

      {/* Shops List / Table View */}
      {shops.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm text-center max-w-xl mx-auto flex flex-col items-center justify-center gap-4 mt-6">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mt-2">Bạn chưa có cửa hàng nào</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Tạo cửa hàng của bạn trên bản đồ để bắt đầu đăng tin, nhận đánh giá và kết nối với khách hàng.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-black/85 transition border-none cursor-pointer flex items-center gap-1.5 mt-2"
          >
            <Plus size={16} /> Tạo cửa hàng đầu tiên
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] border-collapse">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="px-4 py-3 pb-4 w-16 text-center">STT</th>
                  <th className="px-4 py-3 pb-4">Cửa hàng</th>
                  <th className="px-4 py-3 pb-4">Địa chỉ</th>
                  <th className="px-4 py-3 pb-4">Số điện thoại</th>
                  <th className="px-4 py-3 pb-4">Trạng thái</th>
                  <th className="px-4 py-3 pb-4">Đánh giá</th>
                  <th className="px-4 py-3 pb-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredShops.map((shop, idx) => (
                  <tr key={shop.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-4 text-sm text-gray-400 font-medium text-center">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {shop.imageShopUrl && shop.imageShopUrl.length > 0 ? (
                          <img
                            src={shop.imageShopUrl[0]}
                            alt={shop.name}
                            className="w-11 h-11 rounded-xl object-cover flex-shrink-0 bg-gray-100"
                            onError={(e) => { e.target.src = '/icons/location.svg'; }}
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                            <ShoppingBag size={20} />
                          </div>
                        )}
                        <span className="font-semibold text-sm text-gray-900 truncate max-w-[180px]">{shop.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-[220px] truncate">
                      <div className="flex items-center gap-1">
                        <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{shop.address || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {shop.phoneNumber ? (
                        <a href={`tel:${shop.phoneNumber}`} className="flex items-center gap-1 text-gray-600 hover:text-black transition decoration-none">
                          <Phone size={13} className="text-gray-400" /> {shop.phoneNumber}
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge
                        label={statusMeta[shop.status]?.label || shop.status}
                        variant={statusMeta[shop.status]?.variant || 'neutral'}
                      />
                    </td>
                    <td className="px-4 py-4">
                      {shop.rating > 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-800">
                          <Star size={14} className="text-[#e0b73a] fill-[#e0b73a]" />
                          {shop.rating.toFixed(1)} <span className="text-gray-400 font-normal">({shop.reviewCount || 0})</span>
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(shop)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#BBD4E8]/20 hover:text-[#1d3a52] transition border-none bg-transparent cursor-pointer text-gray-400"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(shop.id, shop.name)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#F3C6D9]/20 hover:text-[#7a2444] transition border-none bg-transparent cursor-pointer text-gray-400"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                        <button
                          onClick={() => window.open(`/shop/${shop.id}`, '_blank')}
                          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 hover:text-black transition border-none bg-transparent cursor-pointer text-gray-400"
                          title="Xem chi tiết"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredShops.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                      Không tìm thấy cửa hàng nào khớp với tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <CreateShopModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onShopCreated={handleShopCreated}
        />
      )}

      {editingShop && (
        <CreateShopModal
          isOpen={!!editingShop}
          onClose={() => setEditingShop(null)}
          onShopCreated={handleShopUpdated}
          initialData={editingShop}
          isEditing={true}
        />
      )}
    </div>
  );
}

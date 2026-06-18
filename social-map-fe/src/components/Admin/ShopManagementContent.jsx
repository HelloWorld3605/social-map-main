import React, { useState, useEffect, useRef } from 'react';
import { deleteShopAdmin, restoreShopAdmin, deleteMultipleShopsAdmin, updateShopStatus } from '../../services/adminService';
import { createShop } from '../../services/shopService';
import { UploadService } from '../../services/UploadService';
import StatusBadge from './StatusBadge';
import Pagination from './Pagination';
import {
  Search, Pencil, Trash2, Eye, Plus, X,
  Star, MapPin, Phone, Save, RotateCcw,
  ShoppingBag, ChevronDown, Check, Clock, Compass, FileText, Upload
} from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function ShopManagementContent({
  shops: initialShops,
  loading: initialLoading,
  onRefresh,
  currentPage,
  setCurrentPage,
  totalPages,
  pageSize,
  setPageSize,
  searchTerm,
  setSearchTerm,
  includeDeleted,
  setIncludeDeleted,
  totalElements
}) {
  const [shops, setShops] = useState(initialShops || []);
  const [loading, setLoading] = useState(initialLoading || false);

  // Selection for bulk delete
  const [selectedShops, setSelectedShops] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);

  // Local search
  const [localSearch, setLocalSearch] = useState(searchTerm || '');

  useEffect(() => {
    if (initialShops) {
      setShops(initialShops);
      setSelectedShops([]);
      setSelectAll(false);
    }
  }, [initialShops]);

  useEffect(() => {
    setLoading(initialLoading);
  }, [initialLoading]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(localSearch);
    setCurrentPage(0);
  };

  const handleSelectAll = (e) => {
    setSelectAll(e.target.checked);
    if (e.target.checked) {
      // Select only non-deleted shops
      setSelectedShops(shops.filter(s => !s.deletedAt).map(s => s.id));
    } else {
      setSelectedShops([]);
    }
  };

  const handleSelectShop = (shopId, isDeleted) => {
    if (isDeleted) return;
    setSelectedShops(prev => {
      if (prev.includes(shopId)) {
        return prev.filter(id => id !== shopId);
      } else {
        return [...prev, shopId];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedShops.length === 0) {
      alert('Vui lòng chọn ít nhất một cửa hàng để xóa');
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn xóa ${selectedShops.length} cửa hàng đã chọn?`)) {
      return;
    }
    try {
      await deleteMultipleShopsAdmin(selectedShops);
      alert(`Đã xóa ${selectedShops.length} cửa hàng thành công!`);
      setSelectedShops([]);
      setSelectAll(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to delete shops:', err);
      alert('Không thể xóa cửa hàng. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (shopId, shopName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa cửa hàng "${shopName}"?`)) {
      return;
    }
    try {
      await deleteShopAdmin(shopId);
      alert('Xóa cửa hàng thành công!');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to delete shop:', err);
      alert('Không thể xóa cửa hàng. Vui lòng thử lại.');
    }
  };

  const handleRestore = async (shopId, shopName) => {
    if (!window.confirm(`Bạn có chắc muốn khôi phục cửa hàng "${shopName}"?`)) {
      return;
    }
    try {
      await restoreShopAdmin(shopId);
      alert('Khôi phục cửa hàng thành công!');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to restore shop:', err);
      alert('Không thể khôi phục cửa hàng. Vui lòng thử lại.');
    }
  };

  const handleEdit = (shop) => {
    setSelectedShop(shop);
    setShowEditModal(true);
  };

  const statusMeta = {
    OPEN: { label: 'Đang mở', variant: 'success' },
    CLOSED: { label: 'Đã đóng', variant: 'danger' },
    PENDING: { label: 'Chờ duyệt', variant: 'warning' }
  };

  if (loading && shops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Đang tải danh sách cửa hàng...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
              className="w-full pl-11 pr-10 py-2.5 bg-gray-50 border border-gray-100 rounded-full text-sm outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10 transition"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  setSearchTerm('');
                  setCurrentPage(0);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </form>

          {/* Show Deleted */}
          <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => {
                setIncludeDeleted(e.target.checked);
                setCurrentPage(0);
              }}
              className="w-4.5 h-4.5 rounded text-black border-gray-300 focus:ring-black"
            />
            Hiển thị shop đã xóa
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Page Size */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Hiển thị</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 pr-8 outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10 transition cursor-pointer font-medium text-gray-800"
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedShops.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-[#F3C6D9] text-[#7a2444] rounded-xl text-sm font-semibold hover:brightness-95 transition border-none cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={15} /> Xóa {selectedShops.length} mục
            </button>
          )}

          {/* Add Shop Button */}
          <button
            onClick={() => handleEdit(null)}
            className="px-4 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-black/85 transition border-none cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={16} /> Thêm Shop
          </button>
        </div>
      </div>

      {/* Shop Table */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] border-collapse">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="px-4 py-3 pb-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-black border-gray-300 focus:ring-black cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 pb-4 w-16">STT</th>
                <th className="px-4 py-3 pb-4">Cửa hàng</th>
                <th className="px-4 py-3 pb-4">Địa chỉ</th>
                <th className="px-4 py-3 pb-4">Số điện thoại</th>
                <th className="px-4 py-3 pb-4">Trạng thái</th>
                <th className="px-4 py-3 pb-4">Đánh giá</th>
                <th className="px-4 py-3 pb-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shops.map((shop, idx) => (
                <tr key={shop.id} className={`hover:bg-gray-50/70 transition-colors ${shop.deletedAt ? 'bg-red-50/20' : ''}`}>
                  <td className="px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedShops.includes(shop.id)}
                      onChange={() => handleSelectShop(shop.id, !!shop.deletedAt)}
                      disabled={!!shop.deletedAt}
                      className="w-4 h-4 rounded text-black border-gray-300 focus:ring-black cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-400 font-medium">
                    {currentPage * pageSize + idx + 1}
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
                    {shop.deletedAt ? (
                      <StatusBadge label="Đã xóa" variant="neutral" />
                    ) : (
                      <StatusBadge
                        label={statusMeta[shop.status]?.label || shop.status}
                        variant={statusMeta[shop.status]?.variant || 'neutral'}
                      />
                    )}
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
                      {!shop.deletedAt ? (
                        <>
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
                        </>
                      ) : (
                        <button
                          onClick={() => handleRestore(shop.id, shop.name)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#C7CFA0]/20 hover:text-[#3b3f24] transition border-none bg-transparent cursor-pointer text-gray-400"
                          title="Khôi phục"
                        >
                          <RotateCcw size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {shops.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                    Chưa có cửa hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalElements}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      {showEditModal && (
        <ShopEditModal
          shop={selectedShop}
          onClose={() => {
            setShowEditModal(false);
            setSelectedShop(null);
          }}
          onSave={() => {
            if (onRefresh) onRefresh();
            setShowEditModal(false);
            setSelectedShop(null);
          }}
        />
      )}
    </div>
  );
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoidHVhbmhhaTM2MjAwNSIsImEiOiJjbWdicGFvbW8xMml5Mmpxd3N1NW83amQzIn0.gXamOjOWJNMeQl4eMkHnSg';

const reverseGeocode = async (lng, lat) => {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=vi`
    );
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    return '';
  } catch (err) {
    console.error('Reverse geocode failed', err);
    return '';
  }
};

// Sub-component: Shop Edit Modal
function ShopEditModal({ shop, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: shop?.name || '',
    address: shop?.address || '',
    phoneNumber: shop?.phoneNumber || '',
    description: shop?.description || '',
    latitude: shop?.latitude || 21.0285,
    longitude: shop?.longitude || 105.8542,
    openingTime: shop?.openingTime ? shop.openingTime.substring(0, 5) : '08:00',
    closingTime: shop?.closingTime ? shop.closingTime.substring(0, 5) : '22:00',
    imageShopUrl: shop?.imageShopUrl || [],
    status: shop?.status || 'PENDING'
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const isDraggingOrClicking = useRef(false);

  // Initialize Mapbox map
  useEffect(() => {
    const initTimeout = setTimeout(() => {
      const mapContainer = document.getElementById('admin-shop-map');
      if (!mapContainer) return;

      const lng = parseFloat(formData.longitude) || 105.8542;
      const lat = parseFloat(formData.latitude) || 21.0285;

      const map = new mapboxgl.Map({
        container: 'admin-shop-map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: 14
      });

      const marker = new mapboxgl.Marker({
        draggable: !shop,
        color: '#10b981'
      })
        .setLngLat([lng, lat])
        .addTo(map);

      markerRef.current = marker;
      mapRef.current = map;

      if (!shop) {
        // Handle dragging marker
        marker.on('drag', () => {
          isDraggingOrClicking.current = true;
          const lngLat = marker.getLngLat();
          setFormData(prev => ({
            ...prev,
            latitude: lngLat.lat,
            longitude: lngLat.lng
          }));
        });

        marker.on('dragend', async () => {
          const lngLat = marker.getLngLat();
          const address = await reverseGeocode(lngLat.lng, lngLat.lat);
          setFormData(prev => ({
            ...prev,
            latitude: lngLat.lat,
            longitude: lngLat.lng,
            address: address || prev.address
          }));
          isDraggingOrClicking.current = false;
        });

        // Handle clicking on map
        map.on('click', async (e) => {
          isDraggingOrClicking.current = true;
          const { lng: clickLng, lat: clickLat } = e.lngLat;
          marker.setLngLat([clickLng, clickLat]);
          const address = await reverseGeocode(clickLng, clickLat);
          setFormData(prev => ({
            ...prev,
            latitude: clickLat,
            longitude: clickLng,
            address: address || prev.address
          }));
          isDraggingOrClicking.current = false;
        });
      }
    }, 150);

    return () => {
      clearTimeout(initTimeout);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, []);

  // Update map/marker when manual inputs change
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || isDraggingOrClicking.current) return;
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    const currentLngLat = markerRef.current.getLngLat();
    if (Math.abs(currentLngLat.lat - lat) > 0.0001 || Math.abs(currentLngLat.lng - lng) > 0.0001) {
      markerRef.current.setLngLat([lng, lat]);
      mapRef.current.flyTo({ center: [lng, lat] });
    }
  }, [formData.latitude, formData.longitude]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (formData.imageShopUrl.length + files.length > 10) {
      setUploadError(`Chỉ có thể tải lên tối đa 10 ảnh. Hiện tại: ${formData.imageShopUrl.length}/10`);
      return;
    }

    setUploadingImage(true);
    setUploadError('');

    try {
      const uploadPromises = files.map(file => {
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} không phải là hình ảnh`);
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} quá lớn. Tối đa 5MB`);
        }
        return UploadService.uploadFile(file);
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      setFormData(prev => ({
        ...prev,
        imageShopUrl: [...prev.imageShopUrl, ...uploadedUrls]
      }));
      e.target.value = '';
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      imageShopUrl: prev.imageShopUrl.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (shop) {
      try {
        await updateShopStatus(shop.id, formData.status);
        alert('Cập nhật trạng thái shop thành công!');
        onSave();
      } catch (err) {
        console.error('Failed to update shop status:', err);
        alert('Có lỗi xảy ra khi cập nhật shop!');
      }
    } else {
      try {
        const shopData = {
          name: formData.name,
          address: formData.address,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          description: formData.description,
          phoneNumber: formData.phoneNumber,
          openingTime: formData.openingTime + ':00',
          closingTime: formData.closingTime + ':00',
          imageShopUrl: formData.imageShopUrl.length > 0 ? formData.imageShopUrl : []
        };
        await createShop(shopData);
        alert('Thêm shop mới thành công!');
        onSave();
      } catch (err) {
        console.error('Failed to create shop:', err);
        alert(err.message || 'Có lỗi xảy ra khi thêm shop!');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-5xl rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col gap-4 mx-4 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <style>{`
          #admin-shop-map.mapboxgl-map {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            width: 100% !important;
            height: 100% !important;
            min-height: 250px;
            border-radius: 16px;
            overflow: hidden;
            flex-grow: 1;
            margin-top: 8px !important;
          }
          .admin-shop-form-column::-webkit-scrollbar {
            width: 4px;
          }
          .admin-shop-form-column::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          @media (min-width: 1024px) {
            .admin-shop-split-container {
              height: 60vh;
            }
            .admin-shop-form-column {
              height: 100%;
            }
            .admin-shop-map-column {
              height: 100%;
            }
            #admin-shop-map.mapboxgl-map {
              min-height: 280px;
            }
          }
        `}</style>
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="text-black" size={20} />
            <span>{shop ? `Chỉnh sửa: ${shop.name}` : 'Thêm Cửa Hàng Mới'}</span>
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition border-none bg-transparent cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-6 admin-shop-split-container">
            
            {/* Left Column: Form Fields */}
            <div className="w-full lg:w-1/2 overflow-y-auto pr-2 flex flex-col gap-4 admin-shop-form-column">
              
              {/* Tên cửa hàng */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Tên cửa hàng *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10 transition text-sm disabled:opacity-60 font-medium"
                  disabled={!!shop}
                  required
                />
              </div>

              {/* Địa chỉ */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Địa chỉ *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Click vào bản đồ hoặc tự nhập địa chỉ"
                  className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10 transition text-sm disabled:opacity-60 font-medium"
                  disabled={!!shop}
                  required
                />
              </div>

              {/* Coordinates Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Compass size={14} className="text-gray-500" /> Vĩ độ (Latitude) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10 transition text-sm disabled:opacity-60"
                    disabled={!!shop}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Compass size={14} className="text-gray-500" /> Kinh độ (Longitude) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10 transition text-sm disabled:opacity-60"
                    disabled={!!shop}
                    required
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Phone size={14} className="text-gray-500" /> Số điện thoại
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="VD: 0901234567"
                  pattern="^(0|\+84)(\d{9})$"
                  title="Số điện thoại không hợp lệ (VD: 090xxxxxxx)"
                  className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10 transition text-sm disabled:opacity-60"
                  disabled={!!shop}
                />
              </div>

              {/* Hours Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Clock size={14} className="text-gray-500" /> Giờ mở cửa *
                  </label>
                  <input
                    type="time"
                    value={formData.openingTime}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10 transition text-sm disabled:opacity-60 w-full"
                    disabled={!!shop}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Clock size={14} className="text-gray-500" /> Giờ đóng cửa *
                  </label>
                  <input
                    type="time"
                    value={formData.closingTime}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10 transition text-sm disabled:opacity-60 w-full"
                    disabled={!!shop}
                    required
                  />
                </div>
              </div>

              {/* Mô tả */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <FileText size={14} className="text-gray-500" /> Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả về cửa hàng..."
                  rows={3}
                  maxLength={500}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10 transition text-sm disabled:opacity-60 resize-none"
                  disabled={!!shop}
                />
              </div>

              {/* Trạng thái */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Trạng thái</label>
                <div className="relative">
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10 transition text-sm text-gray-800 cursor-pointer"
                  >
                    <option value="OPEN">Đang mở</option>
                    <option value="CLOSED">Đã đóng</option>
                    <option value="PENDING">Chờ duyệt</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>
              </div>

              {/* Hình ảnh cửa hàng */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Upload size={14} className="text-gray-500" /> Hình ảnh ({formData.imageShopUrl.length}/10)
                </label>

                {!shop && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="admin-shop-images" className={`border border-dashed border-gray-300 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-black/30 transition text-gray-500 ${uploadingImage ? 'pointer-events-none opacity-60' : ''}`}>
                      {uploadingImage ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm font-medium">Đang tải ảnh lên...</span>
                        </div>
                      ) : (
                        <>
                          <Upload size={20} className="mb-1" />
                          <span className="text-xs font-semibold">Nhấp vào để chọn ảnh tải lên</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">Tối đa 10 ảnh, mỗi ảnh ≤ 5MB</span>
                        </>
                      )}
                    </label>
                    <input
                      type="file"
                      id="admin-shop-images"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImage || formData.imageShopUrl.length >= 10}
                      className="hidden"
                    />
                    {uploadError && <p className="text-xs text-red-500 font-semibold">{uploadError}</p>}
                  </div>
                )}

                {formData.imageShopUrl.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {formData.imageShopUrl.map((url, index) => (
                      <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                        <img src={url} alt={`Shop ${index + 1}`} className="w-full h-full object-cover" />
                        {!shop && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/75 text-white rounded-full flex items-center justify-center hover:bg-black transition border-none cursor-pointer"
                            disabled={uploadingImage}
                            aria-label="Remove image"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Map Picker */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4 admin-shop-map-column">
              
              <div className="flex items-center gap-2 text-[#166534] bg-emerald-50/50 border border-emerald-100/50 px-3 py-2 rounded-xl text-xs font-semibold">
                <MapPin size={14} />
                <span>Kéo marker hoặc click bản đồ để chọn vị trí chính xác</span>
              </div>

              <div 
                id="admin-shop-map" 
                className="w-full flex-1 rounded-2xl overflow-hidden border border-gray-200 relative bg-gray-50 shadow-inner"
              />
              {!shop && (
                <p className="text-[11px] text-gray-400">
                  * Click lên bản đồ hoặc kéo marker để cập nhật tọa độ và tự động lấy địa chỉ (bạn vẫn có thể sửa địa chỉ theo ý muốn).
                </p>
              )}
            </div>

          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition border-none cursor-pointer"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-black text-white hover:bg-black/85 transition border-none cursor-pointer flex items-center gap-1.5"
            >
              <Save size={15} /> Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { deleteShopAdmin, restoreShopAdmin, deleteMultipleShopsAdmin } from '../../services/adminService';
import {
    FiSearch, FiEdit2, FiTrash2, FiEye, FiPlus, FiX,
    FiAlertTriangle, FiMapPin, FiPhone, FiCheckCircle,
    FiXCircle, FiClock, FiStar, FiShoppingBag, FiInbox, FiSave,
    FiRefreshCw, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import './ShopManagement.css';

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
    setIncludeDeleted
}) {
    const [shops, setShops] = useState(initialShops || []);
    const [loading, setLoading] = useState(initialLoading || false);
    const [error, setError] = useState(null);

    // Selection for bulk delete
    const [selectedShops, setSelectedShops] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedShop, setSelectedShop] = useState(null);

    // Local search (for immediate filtering before API call)
    const [localSearch, setLocalSearch] = useState(searchTerm || '');

    // Update when props change
    useEffect(() => {
        if (initialShops) {
            setShops(initialShops);
            // Reset selection when shops change
            setSelectedShops([]);
            setSelectAll(false);
        }
    }, [initialShops]);

    useEffect(() => {
        setLoading(initialLoading);
    }, [initialLoading]);

    // Handle search submit
    const handleSearch = (e) => {
        e.preventDefault();
        setSearchTerm(localSearch);
        setCurrentPage(0);
    };

    // Handle select all checkbox
    const handleSelectAll = (e) => {
        setSelectAll(e.target.checked);
        if (e.target.checked) {
            // Select all shops that are not deleted
            setSelectedShops(shops.filter(s => !s.deletedAt).map(s => s.id));
        } else {
            setSelectedShops([]);
        }
    };

    // Handle individual shop selection
    const handleSelectShop = (shopId, isDeleted) => {
        if (isDeleted) return; // Don't allow selecting deleted shops

        setSelectedShops(prev => {
            if (prev.includes(shopId)) {
                return prev.filter(id => id !== shopId);
            } else {
                return [...prev, shopId];
            }
        });
    };

    // Handle bulk delete
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
            if (onRefresh) onRefresh();
            alert('Xóa cửa hàng thành công!');
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
            if (onRefresh) onRefresh();
            alert('Khôi phục cửa hàng thành công!');
        } catch (err) {
            console.error('Failed to restore shop:', err);
            alert('Không thể khôi phục cửa hàng. Vui lòng thử lại.');
        }
    };

    const handleEdit = (shop) => {
        setSelectedShop(shop);
        setShowEditModal(true);
    };

    if (loading) {
        return (
            <div className="shop-management-loading">
                <div className="spinner"></div>
                <p>Đang tải danh sách cửa hàng...</p>
            </div>
        );
    }

    return (
        <div className="shop-management-content">
            {error && (
                <div className="error-banner">
                    <span><FiAlertTriangle size={18} /></span>
                    <span>{error}</span>
                    <button onClick={onRefresh}>Thử lại</button>
                </div>
            )}

            {/* Search & Filter Bar */}
            <div className="shop-filters">
                <form onSubmit={handleSearch} className="search-box">
                    <span className="shop-search-icon"><FiSearch size={18} /></span>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                    />
                    {localSearch && (
                        <button
                            type="button"
                            className="clear-search"
                            onClick={() => {
                                setLocalSearch('');
                                setSearchTerm('');
                            }}
                        >
                            <FiX size={14} />
                        </button>
                    )}
                    <button type="submit" className="search-btn">Tìm</button>
                </form>

                <div className="filter-options">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={includeDeleted}
                            onChange={(e) => {
                                setIncludeDeleted(e.target.checked);
                                setCurrentPage(0);
                            }}
                        />
                        Hiển thị shop đã xóa
                    </label>

                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(0);
                        }}
                        className="page-size-select"
                    >
                        <option value={10}>10 / trang</option>
                        <option value={20}>20 / trang</option>
                        <option value={50}>50 / trang</option>
                    </select>
                </div>

                {/* Bulk Actions */}
                {selectedShops.length > 0 && (
                    <div className="bulk-actions">
                        <span>{selectedShops.length} đã chọn</span>
                        <button className="btn-bulk-delete" onClick={handleBulkDelete}>
                            <FiTrash2 size={16} /> Xóa đã chọn
                        </button>
                    </div>
                )}

                <button className="btn-add-shop" onClick={() => handleEdit(null)}>
                    <FiPlus size={16} /> Thêm Shop
                </button>
            </div>

            {/* Shop Table */}
            <div className="shop-table-container">
                <table className="shop-table">
                    <thead>
                        <tr>
                            <th className="checkbox-col">
                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={handleSelectAll}
                                    title="Chọn tất cả"
                                />
                            </th>
                            <th>ID</th>
                            <th>Hình ảnh</th>
                            <th>Tên cửa hàng</th>
                            <th>Địa chỉ</th>
                            <th>Số điện thoại</th>
                            <th>Trạng thái</th>
                            <th>Đánh giá</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shops.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="no-data">
                                    {searchTerm
                                        ? <><FiSearch size={16} /> Không tìm thấy cửa hàng nào</>
                                        : <><FiInbox size={16} /> Chưa có cửa hàng nào</>}
                                </td>
                            </tr>
                        ) : (
                            shops.map(shop => (
                                <tr key={shop.id} className={shop.deletedAt ? 'deleted-row' : ''}>
                                    <td className="checkbox-col">
                                        <input
                                            type="checkbox"
                                            checked={selectedShops.includes(shop.id)}
                                            onChange={() => handleSelectShop(shop.id, !!shop.deletedAt)}
                                            disabled={!!shop.deletedAt}
                                        />
                                    </td>
                                    <td className="shop-id">
                                        {shop.id.substring(0, 8)}...
                                    </td>
                                    <td className="shop-image">
                                        {shop.imageShopUrl && shop.imageShopUrl.length > 0 ? (
                                            <img
                                                src={shop.imageShopUrl[0]}
                                                alt={shop.name}
                                                onError={(e) => e.target.src = '/icons/location.svg'}
                                            />
                                        ) : (
                                            <div className="no-image"><FiShoppingBag size={24} /></div>
                                        )}
                                    </td>
                                    <td className="shop-name">
                                        <strong>{shop.name}</strong>
                                    </td>
                                    <td className="shop-address">
                                        <FiMapPin size={14} /> {shop.address || 'N/A'}
                                    </td>
                                    <td className="shop-phone">
                                        {shop.phoneNumber ? (
                                            <a href={`tel:${shop.phoneNumber}`}>
                                                <FiPhone size={14} /> {shop.phoneNumber}
                                            </a>
                                        ) : 'N/A'}
                                    </td>
                                    <td className="shop-status">
                                        {shop.deletedAt ? (
                                            <span className="status-badge status-deleted">
                                                <FiTrash2 size={14} /> Đã xóa
                                            </span>
                                        ) : (
                                            <span className={`status-badge status-${shop.status.toLowerCase()}`}>
                                                {shop.status === 'OPEN' && <><FiCheckCircle size={14} /> Đang mở</>}
                                                {shop.status === 'CLOSED' && <><FiXCircle size={14} /> Đã đóng</>}
                                                {shop.status === 'PENDING' && <><FiClock size={14} /> Chờ duyệt</>}
                                            </span>
                                        )}
                                    </td>
                                    <td className="shop-rating">
                                        <FiStar size={14} /> {shop.rating || 0} ({shop.reviewCount || 0})
                                    </td>
                                    <td className="shop-actions">
                                        {!shop.deletedAt ? (
                                            <>
                                                <button
                                                    className="btn-edit"
                                                    onClick={() => handleEdit(shop)}
                                                    title="Chỉnh sửa"
                                                >
                                                    <FiEdit2 size={16} />
                                                </button>
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => handleDelete(shop.id, shop.name)}
                                                    title="Xóa"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                                <button
                                                    className="btn-view"
                                                    onClick={() => window.open(`/shop/${shop.id}`, '_blank')}
                                                    title="Xem chi tiết"
                                                >
                                                    <FiEye size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className="btn-restore"
                                                onClick={() => handleRestore(shop.id, shop.name)}
                                                title="Khôi phục"
                                            >
                                                <FiRefreshCw size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="pagination-btn"
                    >
                        <FiChevronLeft size={16} /> Trước
                    </button>

                    <div className="pagination-numbers">
                        {[...Array(totalPages)].map((_, index) => {
                            const pageNumber = index;
                            // Show first, last, current, and adjacent pages
                            if (
                                pageNumber === 0 ||
                                pageNumber === totalPages - 1 ||
                                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                            ) {
                                return (
                                    <button
                                        key={pageNumber}
                                        onClick={() => setCurrentPage(pageNumber)}
                                        className={`pagination-number ${currentPage === pageNumber ? 'active' : ''}`}
                                    >
                                        {pageNumber + 1}
                                    </button>
                                );
                            } else if (
                                pageNumber === currentPage - 2 ||
                                pageNumber === currentPage + 2
                            ) {
                                return <span key={pageNumber} className="pagination-dots">...</span>;
                            }
                            return null;
                        })}
                    </div>

                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages - 1}
                        className="pagination-btn"
                    >
                        Sau <FiChevronRight size={16} />
                    </button>
                </div>
            )}

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

// Simple Edit Modal Component
function ShopEditModal({ shop, onClose, onSave }) {
    const [formData, setFormData] = useState({
        name: shop?.name || '',
        address: shop?.address || '',
        phoneNumber: shop?.phoneNumber || '',
        description: shop?.description || '',
        status: shop?.status || 'PENDING'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        // TODO: Implement save logic with API
        console.log('Save shop:', formData);
        alert('Chức năng đang phát triển!');
        onSave();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{shop ? <><FiEdit2 size={18} /> Chỉnh Sửa Cửa Hàng</> : <><FiPlus size={18} /> Thêm Cửa Hàng Mới</>}</h2>
                    <button className="modal-close" onClick={onClose}><FiX size={18} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Tên cửa hàng *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Địa chỉ *</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Số điện thoại</label>
                        <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        />
                    </div>

                    <div className="form-group">
                        <label>Mô tả</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label>Trạng thái</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                        >
                            <option value="OPEN">Đang mở</option>
                            <option value="CLOSED">Đã đóng</option>
                            <option value="PENDING">Chờ duyệt</option>
                        </select>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            Hủy
                        </button>
                        <button type="submit" className="btn-save">
                            <FiSave size={16} /> Lưu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


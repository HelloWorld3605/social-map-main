import React, { useState, useEffect } from 'react';
import { deleteShop } from '../../services/shopService';
import './ShopManagement.css';

export default function ShopManagementContent({ shops: initialShops, loading: initialLoading, onRefresh }) {
    const [shops, setShops] = useState(initialShops || []);
    const [filteredShops, setFilteredShops] = useState(initialShops || []);
    const [loading, setLoading] = useState(initialLoading || false);
    const [error, setError] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [shopsPerPage] = useState(10);

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedShop, setSelectedShop] = useState(null);

    // Update when props change
    useEffect(() => {
        if (initialShops) {
            setShops(initialShops);
            setFilteredShops(initialShops);
        }
    }, [initialShops]);

    useEffect(() => {
        setLoading(initialLoading);
    }, [initialLoading]);

    useEffect(() => {
        filterShops();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, statusFilter, shops]);


    const filterShops = () => {
        let filtered = shops;

        // Search by name or address
        if (searchTerm) {
            filtered = filtered.filter(shop =>
                shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shop.address.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(shop => shop.status === statusFilter);
        }

        setFilteredShops(filtered);
        setCurrentPage(1); // Reset to first page when filtering
    };

    const handleDelete = async (shopId, shopName) => {
        if (!window.confirm(`Bạn có chắc muốn xóa cửa hàng "${shopName}"?`)) {
            return;
        }

        try {
            await deleteShop(shopId);
            setShops(shops.filter(s => s.id !== shopId));
            if (onRefresh) onRefresh();
            alert('Xóa cửa hàng thành công!');
        } catch (err) {
            console.error('Failed to delete shop:', err);
            alert('Không thể xóa cửa hàng. Vui lòng thử lại.');
        }
    };

    const handleEdit = (shop) => {
        setSelectedShop(shop);
        setShowEditModal(true);
    };

    // Pagination logic
    const indexOfLastShop = currentPage * shopsPerPage;
    const indexOfFirstShop = indexOfLastShop - shopsPerPage;
    const currentShops = filteredShops.slice(indexOfFirstShop, indexOfLastShop);
    const totalPages = Math.ceil(filteredShops.length / shopsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
                    <span>⚠️</span>
                    <span>{error}</span>
                    <button onClick={onRefresh}>Thử lại</button>
                </div>
            )}

            {/* Search & Filter Bar */}
            <div className="shop-filters">
                <div className="search-box">
                    <span className="shop-search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            className="clear-search"
                            onClick={() => setSearchTerm('')}
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="filter-group">
                    <label>Trạng thái:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">Tất cả</option>
                        <option value="OPEN">Đang mở</option>
                        <option value="CLOSED">Đã đóng</option>
                        <option value="PENDING">Chờ duyệt</option>
                    </select>
                </div>

                <div className="results-info">
                    Hiển thị <strong>{currentShops.length}</strong> / <strong>{filteredShops.length}</strong> cửa hàng
                </div>

                <button className="btn-add-shop" onClick={() => handleEdit(null)}>
                    ➕ Thêm Shop
                </button>
            </div>

            {/* Shop Table */}
            <div className="shop-table-container">
                <table className="shop-table">
                    <thead>
                        <tr>
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
                        {currentShops.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="no-data">
                                    {searchTerm || statusFilter !== 'ALL'
                                        ? '🔍 Không tìm thấy cửa hàng nào'
                                        : '📭 Chưa có cửa hàng nào'}
                                </td>
                            </tr>
                        ) : (
                            currentShops.map(shop => (
                                <tr key={shop.id}>
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
                                            <div className="no-image">🏪</div>
                                        )}
                                    </td>
                                    <td className="shop-name">
                                        <strong>{shop.name}</strong>
                                    </td>
                                    <td className="shop-address">
                                        📍 {shop.address || 'N/A'}
                                    </td>
                                    <td className="shop-phone">
                                        {shop.phoneNumber ? (
                                            <a href={`tel:${shop.phoneNumber}`}>
                                                📞 {shop.phoneNumber}
                                            </a>
                                        ) : 'N/A'}
                                    </td>
                                    <td className="shop-status">
                                        <span className={`status-badge status-${shop.status.toLowerCase()}`}>
                                            {shop.status === 'OPEN' && '✅ Đang mở'}
                                            {shop.status === 'CLOSED' && '⛔ Đã đóng'}
                                            {shop.status === 'PENDING' && '⏳ Chờ duyệt'}
                                        </span>
                                    </td>
                                    <td className="shop-rating">
                                        ⭐ {shop.rating || 0} ({shop.reviewCount || 0})
                                    </td>
                                    <td className="shop-actions">
                                        <button
                                            className="btn-edit"
                                            onClick={() => handleEdit(shop)}
                                            title="Chỉnh sửa"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(shop.id, shop.name)}
                                            title="Xóa"
                                        >
                                            🗑️
                                        </button>
                                        <button
                                            className="btn-view"
                                            onClick={() => window.open(`/shop/${shop.id}`, '_blank')}
                                            title="Xem chi tiết"
                                        >
                                            👁️
                                        </button>
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
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                    >
                        ‹ Trước
                    </button>

                    <div className="pagination-numbers">
                        {[...Array(totalPages)].map((_, index) => {
                            const pageNumber = index + 1;
                            // Show first, last, current, and adjacent pages
                            if (
                                pageNumber === 1 ||
                                pageNumber === totalPages ||
                                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                            ) {
                                return (
                                    <button
                                        key={pageNumber}
                                        onClick={() => paginate(pageNumber)}
                                        className={`pagination-number ${currentPage === pageNumber ? 'active' : ''}`}
                                    >
                                        {pageNumber}
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
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                    >
                        Sau ›
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
                    <h2>{shop ? '✏️ Chỉnh Sửa Cửa Hàng' : '➕ Thêm Cửa Hàng Mới'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
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
                            💾 Lưu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


import React, { useState, useEffect } from 'react';
import { getMyShops, deleteShop } from '../../services/shopService';
import CreateShopModal from '../../components/Shop/CreateShopModal';
import './ShopManagementPage.css';

export default function ShopManagementPage() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingShop, setEditingShop] = useState(null);

    useEffect(() => {
        loadMyShops();
    }, []);

    const loadMyShops = async () => {
        try {
            setLoading(true);
            const myShops = await getMyShops();
            setShops(myShops);
        } catch (err) {
            setError('Không thể tải danh sách cửa hàng');
            console.error('Error loading shops:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteShop = async (shopId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa cửa hàng này?')) {
            return;
        }

        try {
            await deleteShop(shopId);
            setShops(shops.filter(shop => shop.id !== shopId));
        } catch (err) {
            setError('Không thể xóa cửa hàng');
            console.error('Error deleting shop:', err);
        }
    };

    const handleShopCreated = (newShop) => {
        setShops([...shops, newShop]);
        setIsCreateModalOpen(false);
    };

    const handleShopUpdated = (updatedShop) => {
        setShops(shops.map(shop => shop.id === updatedShop.id ? updatedShop : shop));
        setEditingShop(null);
    };

    if (loading) {
        return <div className="shop-management-loading">Đang tải...</div>;
    }

    return (
        <div className="shop-management-page">
            <div className="shop-management-header">
                <h1>Quản lý cửa hàng</h1>
                <button
                    className="create-shop-btn"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    + Tạo cửa hàng mới
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="shops-list">
                {shops.length === 0 ? (
                    <div className="no-shops">
                        <p>Bạn chưa có cửa hàng nào.</p>
                        <button
                            className="create-first-shop-btn"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            Tạo cửa hàng đầu tiên
                        </button>
                    </div>
                ) : (
                    shops.map(shop => (
                        <div key={shop.id} className="shop-card">
                            <div className="shop-info">
                                <h3>{shop.name}</h3>
                                <p className="shop-address">{shop.address}</p>
                                <p className="shop-description">{shop.description}</p>
                                <p className="shop-phone">📞 {shop.phoneNumber}</p>
                                <p className="shop-hours">
                                    🕒 {shop.openingTime} - {shop.closingTime}
                                </p>
                            </div>
                            <div className="shop-actions">
                                <button
                                    className="edit-btn"
                                    onClick={() => setEditingShop(shop)}
                                >
                                    Chỉnh sửa
                                </button>
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteShop(shop.id)}
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

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

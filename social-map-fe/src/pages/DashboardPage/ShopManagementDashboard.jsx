import React, { useState, useEffect, useCallback } from 'react';
import { getAllShopsAdmin } from '../../services/adminService';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import ShopManagementContent from '../../components/Admin/ShopManagementContent';
import { FiShoppingBag, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import './DashboardPage.css';

export default function ShopManagementDashboard() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
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

            // Calculate stats from current page (approximate)
            const statsData = {
                totalShops: data.totalElements || 0,
                openShops: shopsList.filter(s => s.status === 'OPEN' && !s.deletedAt).length,
                closedShops: shopsList.filter(s => s.status === 'CLOSED' && !s.deletedAt).length,
                pendingShops: shopsList.filter(s => s.status === 'PENDING' && !s.deletedAt).length
            };
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load shops:', error);
            setShops([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, sortBy, sortDirection, searchTerm, includeDeleted]);

    useEffect(() => {
        loadShops();
    }, [loadShops]);

    return (
        <>
            <AdminSidebar />
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h1><FiShoppingBag style={{ marginRight: '8px' }} /> Quản Lý Cửa Hàng</h1>
                    <p className="dashboard-subtitle">Quản lý tất cả cửa hàng trong hệ thống - Tổng số: {totalElements}</p>
                </div>

                {/* Shop Stats */}
                <div className="stats-grid">
                    <div className="stat-card primary">
                        <div className="stat-icon"><FiShoppingBag size={24} /></div>
                        <div className="stat-content">
                            <h3>Tổng cửa hàng</h3>
                            <p className="stat-number">{stats.totalShops}</p>
                        </div>
                    </div>

                    <div className="stat-card success">
                        <div className="stat-icon"><FiCheckCircle size={24} /></div>
                        <div className="stat-content">
                            <h3>Đang mở</h3>
                            <p className="stat-number">{stats.openShops}</p>
                        </div>
                    </div>

                    <div className="stat-card danger">
                        <div className="stat-icon"><FiXCircle size={24} /></div>
                        <div className="stat-content">
                            <h3>Đã đóng</h3>
                            <p className="stat-number">{stats.closedShops}</p>
                        </div>
                    </div>

                    <div className="stat-card warning">
                        <div className="stat-icon"><FiClock size={24} /></div>
                        <div className="stat-content">
                            <h3>Chờ duyệt</h3>
                            <p className="stat-number">{stats.pendingShops}</p>
                        </div>
                    </div>
                </div>

                {/* Shop Management Content */}
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
                />
            </div>
        </>
    );
}


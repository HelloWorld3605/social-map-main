import React, { useState, useEffect } from 'react';
import { getAllShops } from '../../services/shopService';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import ShopManagementContent from '../../components/Admin/ShopManagementContent';
import { FiShoppingBag, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import './DashboardPage.css';

export default function ShopManagementDashboard() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalShops: 0,
        openShops: 0,
        closedShops: 0,
        pendingShops: 0
    });

    useEffect(() => {
        loadShops();
    }, []);

    const loadShops = async () => {
        try {
            setLoading(true);
            const data = await getAllShops();
            setShops(data);

            // Calculate stats
            const stats = {
                totalShops: data.length,
                openShops: data.filter(s => s.status === 'OPEN').length,
                closedShops: data.filter(s => s.status === 'CLOSED').length,
                pendingShops: data.filter(s => s.status === 'PENDING').length
            };
            setStats(stats);
        } catch (error) {
            console.error('Failed to load shops:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AdminSidebar />
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h1><FiShoppingBag style={{ marginRight: '8px' }} /> Quản Lý Cửa Hàng</h1>
                    <p className="dashboard-subtitle">Quản lý tất cả cửa hàng trong hệ thống</p>
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
                />
            </div>
        </>
    );
}


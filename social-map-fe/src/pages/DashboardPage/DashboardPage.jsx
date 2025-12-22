import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../../services/adminService';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import {
    FiUsers,
    FiHome,
    FiCheckCircle,
    FiAlertTriangle,
    FiTag
} from 'react-icons/fi';
import './DashboardPage.css';

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
            const data = await getDashboardStats(); // api helper already returns response.data
            console.log('Dashboard stats data:', data);
            setStats(data || {});
            setError(null);
        } catch (err) {
            console.error('Failed to load dashboard stats:', err);
            setError('Không thể tải thống kê. Vui lòng thử lại.');
            setStats({}); // Set empty object on error
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
            <div className="dashboard-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Đang tải thống kê...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <div className="error-container">
                    <p className="error-message">{error}</p>
                    <button onClick={handleRetry} className="retry-button">
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <AdminSidebar pendingCount={stats?.pendingSellerRequests || 0} />
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h1>Admin Dashboard</h1>
                    <p className="dashboard-subtitle">Tổng quan hệ thống Social Map</p>
                </div>

            {/* Overview Stats */}
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-icon">
                        <FiUsers size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>Tổng người dùng</h3>
                        <p className="stat-number">{stats?.totalUsers || 0}</p>
                        <span className="stat-badge success">+{stats?.newUsersThisMonth || 0} tháng này</span>
                    </div>
                </div>

                <div className="stat-card secondary">
                    <div className="stat-icon">
                        <FiHome size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>Tổng cửa hàng</h3>
                        <p className="stat-number">{stats?.totalShops || 0}</p>
                        <span className="stat-badge success">+{stats?.newShopsThisMonth || 0} tháng này</span>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-icon">
                        <FiCheckCircle size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>Shop hoạt động</h3>
                        <p className="stat-number">{stats?.totalActiveShops || 0}</p>
                        <span className="stat-badge">Đang mở cửa</span>
                    </div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon">
                        <FiAlertTriangle size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>Shop không hoạt động</h3>
                        <p className="stat-number">{stats?.totalInactiveShops || 0}</p>
                        <span className="stat-badge">Đã đóng/Tạm ngưng</span>
                    </div>
                </div>
            </div>

            {/* User Distribution */}
            <div className="section-row">
                <div className="chart-card">
                    <h2>Phân bố người dùng theo vai trò</h2>
                    <div className="role-distribution">
                        <div className="role-item">
                            <div className="role-bar">
                                <div
                                    className="role-fill user"
                                    style={{ width: `${(stats?.userCount / stats?.totalUsers * 100) || 0}%` }}
                                ></div>
                            </div>
                            <div className="role-info">
                                <span className="role-label">
                                    <span className="role-dot user"></span>
                                    User (Người dùng)
                                </span>
                                <span className="role-count">{stats?.userCount || 0}</span>
                            </div>
                        </div>

                        <div className="role-item">
                            <div className="role-bar">
                                <div
                                    className="role-fill seller"
                                    style={{ width: `${(stats?.sellerCount / stats?.totalUsers * 100) || 0}%` }}
                                ></div>
                            </div>
                            <div className="role-info">
                                <span className="role-label">
                                    <span className="role-dot seller"></span>
                                    Seller (Người bán)
                                </span>
                                <span className="role-count">{stats?.sellerCount || 0}</span>
                            </div>
                        </div>

                        <div className="role-item">
                            <div className="role-bar">
                                <div
                                    className="role-fill admin"
                                    style={{ width: `${(stats?.adminCount / stats?.totalUsers * 100) || 0}%` }}
                                ></div>
                            </div>
                            <div className="role-info">
                                <span className="role-label">
                                    <span className="role-dot admin"></span>
                                    Admin
                                </span>
                                <span className="role-count">{stats?.adminCount || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="info-card">
                    <h2>Thông tin hệ thống</h2>
                    <div className="info-list">
                        <div className="info-item">
                            <span className="info-label">Tổng Tags:</span>
                            <span className="info-value">{stats?.totalTags || 0}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Tỷ lệ Shop hoạt động:</span>
                            <span className="info-value success">
                                {stats?.totalShops > 0
                                    ? ((stats?.totalActiveShops / stats?.totalShops * 100).toFixed(1))
                                    : 0}%
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Người dùng mới tháng này:</span>
                            <span className="info-value">{stats?.newUsersThisMonth || 0}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Shop mới tháng này:</span>
                            <span className="info-value">{stats?.newShopsThisMonth || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="action-buttons">
                    <button className="action-btn primary" onClick={() => navigate('/dashboard/seller-requests')}>
                        <FiCheckCircle size={18} />
                        Xem Seller Requests
                    </button>
                    <button className="action-btn secondary" onClick={() => navigate('/dashboard/users')}>
                        <FiUsers size={18} />
                        Quản lý Users
                    </button>
                    <button className="action-btn success" onClick={() => navigate('/dashboard/shops')}>
                        <FiHome size={18} />
                        Quản lý Shops
                    </button>
                    <button className="action-btn info" onClick={() => navigate('/dashboard/tags')}>
                        <FiTag size={18} />
                        Quản lý Tags
                    </button>
                </div>
            </div>
            </div>
        </>
    );
}

import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../../services/adminService';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import './DashboardPage.css';

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                    <button onClick={loadStats} className="retry-button">
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
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <h3>Tổng người dùng</h3>
                        <p className="stat-number">{stats?.totalUsers || 0}</p>
                        <span className="stat-badge success">+{stats?.newUsersThisMonth || 0} tháng này</span>
                    </div>
                </div>

                <div className="stat-card secondary">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <h3>Tổng cửa hàng</h3>
                        <p className="stat-number">{stats?.totalShops || 0}</p>
                        <span className="stat-badge success">+{stats?.newShopsThisMonth || 0} tháng này</span>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <h3>Shop hoạt động</h3>
                        <p className="stat-number">{stats?.totalActiveShops || 0}</p>
                        <span className="stat-badge">Đang mở cửa</span>
                    </div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
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
                <h2>Thao tác nhanh</h2>
                <div className="action-buttons">
                    <button className="action-btn primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Quản lý người dùng
                    </button>
                    <button className="action-btn secondary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Quản lý cửa hàng
                    </button>
                    <button className="action-btn success">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Quản lý Tags
                    </button>
                    <button className="action-btn info" onClick={loadStats}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Làm mới dữ liệu
                    </button>
                </div>
            </div>
            </div>
        </>
    );
}


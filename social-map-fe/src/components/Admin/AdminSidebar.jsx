import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminSidebar.css';

export default function AdminSidebar({ pendingCount = 0 }) {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            path: '/dashboard',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            label: 'Tổng quan',
        },
        {
            path: '/dashboard/seller-requests',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            label: 'Yêu cầu Seller',
            badge: pendingCount > 0 ? pendingCount : null,
        },
        {
            path: '/dashboard/users',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            label: 'Quản lý Users',
        },
        {
            path: '/dashboard/shops',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            label: 'Quản lý Shops',
        },
        {
            path: '/dashboard/tags',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            ),
            label: 'Quản lý Tags',
        },
    ];

    return (
        <aside className="admin-sidebar">
            <div className="admin-sidebar-header">
                <h2>Admin Panel</h2>
            </div>

            <nav className="admin-sidebar-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`admin-sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                        <span className="admin-sidebar-icon">{item.icon}</span>
                        <span className="admin-sidebar-label">{item.label}</span>
                        {item.badge && (
                            <span className="admin-sidebar-badge">{item.badge}</span>
                        )}
                    </button>
                ))}
            </nav>

            <div className="admin-sidebar-footer">
                <button
                    onClick={() => navigate('/home')}
                    className="admin-sidebar-item"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Về trang chính</span>
                </button>
            </div>
        </aside>
    );
}


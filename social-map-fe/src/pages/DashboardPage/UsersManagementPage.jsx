import React, { useState, useEffect } from 'react';
import { getAllUsers, deleteUser, restoreUser, updateUser } from '../../services/adminService';
import { getDashboardStats } from '../../services/adminService';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import './UsersManagementPage.css';

export default function UsersManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [includeDeleted, setIncludeDeleted] = useState(false);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('DESC');
    const [pendingCount, setPendingCount] = useState(0);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        email: '',
        displayName: '',
        role: '',
        emailVerified: false
    });

    useEffect(() => {
        loadUsers();
        loadPendingCount();
    }, [currentPage, pageSize, searchTerm, includeDeleted, sortBy, sortDirection]);

    const loadPendingCount = async () => {
        try {
            const data = await getDashboardStats();
            setPendingCount(data?.pendingSellerRequests || 0);
        } catch (error) {
            console.error('Failed to load pending count:', error);
        }
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers(currentPage, pageSize, sortBy, sortDirection, searchTerm, includeDeleted);
            setUsers(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (error) {
            console.error('Failed to load users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(0); // Reset to first page
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortBy(field);
            setSortDirection('DESC');
        }
    };

    const handleDelete = async (userId) => {
        if (!confirm('Bạn có chắc muốn xóa user này?')) return;

        try {
            await deleteUser(userId);
            alert('Đã xóa user thành công!');
            loadUsers();
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('Có lỗi xảy ra khi xóa user!');
        }
    };

    const handleRestore = async (userId) => {
        if (!confirm('Bạn có chắc muốn khôi phục user này?')) return;

        try {
            await restoreUser(userId);
            alert('Đã khôi phục user thành công!');
            loadUsers();
        } catch (error) {
            console.error('Failed to restore user:', error);
            alert('Có lỗi xảy ra khi khôi phục user!');
        }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setEditForm({
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            emailVerified: user.emailVerified
        });
        setShowEditModal(true);
    };

    const handleEdit = async () => {
        try {
            await updateUser(editingUser.id, editForm);
            alert('Cập nhật user thành công!');
            setShowEditModal(false);
            loadUsers();
        } catch (error) {
            console.error('Failed to update user:', error);
            alert('Có lỗi xảy ra khi cập nhật user!');
        }
    };

    const getRoleBadge = (role) => {
        const badges = {
            USER: { label: 'User', className: 'role-badge user' },
            SELLER: { label: 'Seller', className: 'role-badge seller' },
            ADMIN: { label: 'Admin', className: 'role-badge admin' },
            SUPER_ADMIN: { label: 'Super Admin', className: 'role-badge super-admin' },
            MODERATOR: { label: 'Moderator', className: 'role-badge moderator' },
            PREMIUM: { label: 'Premium', className: 'role-badge premium' },
        };
        const badge = badges[role] || badges.USER;
        return <span className={badge.className}>{badge.label}</span>;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    if (loading && users.length === 0) {
        return (
            <>
                <AdminSidebar pendingCount={pendingCount} />
                <div className="users-management-container">
                    <div className="loading">Đang tải...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <AdminSidebar pendingCount={pendingCount} />
            <div className="users-management-container">
                <div className="page-header">
                    <h1>Quản lý Users</h1>
                    <p>Tổng số: {totalElements} users</p>
                </div>

                {/* Filters */}
                <div className="filters-section">
                    <form onSubmit={handleSearch} className="search-form">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm theo tên hoặc email..."
                            className="search-input"
                        />
                        <button type="submit" className="search-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Tìm kiếm
                        </button>
                    </form>

                    <div className="filter-options">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={includeDeleted}
                                onChange={(e) => setIncludeDeleted(e.target.checked)}
                            />
                            Hiển thị user đã xóa
                        </label>

                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="page-size-select"
                        >
                            <option value={10}>10 / trang</option>
                            <option value={20}>20 / trang</option>
                            <option value={50}>50 / trang</option>
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div className="table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('displayName')} className="sortable">
                                    Tên {sortBy === 'displayName' && (sortDirection === 'ASC' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('email')} className="sortable">
                                    Email {sortBy === 'email' && (sortDirection === 'ASC' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('role')} className="sortable">
                                    Role {sortBy === 'role' && (sortDirection === 'ASC' ? '↑' : '↓')}
                                </th>
                                <th>Verified</th>
                                <th>Bạn bè</th>
                                <th>Shops</th>
                                <th onClick={() => handleSort('createdAt')} className="sortable">
                                    Ngày tạo {sortBy === 'createdAt' && (sortDirection === 'ASC' ? '↑' : '↓')}
                                </th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className={user.deletedAt ? 'deleted-row' : ''}>
                                    <td>
                                        <div className="user-cell">
                                            <img
                                                src={user.avatarUrl || '/channels/myprofile.jpg'}
                                                alt={user.displayName}
                                                className="user-avatar"
                                            />
                                            <span>{user.displayName}</span>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>{getRoleBadge(user.role)}</td>
                                    <td>
                                        {user.emailVerified ? (
                                            <span className="verified-badge">✓</span>
                                        ) : (
                                            <span className="unverified-badge">✗</span>
                                        )}
                                    </td>
                                    <td>{user.friendsCount || 0}</td>
                                    <td>{user.shopsCount || 0}</td>
                                    <td>{formatDate(user.createdAt)}</td>
                                    <td>
                                        {user.deletedAt ? (
                                            <span className="status-badge deleted">Đã xóa</span>
                                        ) : (
                                            <span className="status-badge active">Hoạt động</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {!user.deletedAt ? (
                                                <>
                                                    <button
                                                        className="btn-edit"
                                                        onClick={() => openEditModal(user)}
                                                        title="Sửa"
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="btn-delete"
                                                        onClick={() => handleDelete(user.id)}
                                                        title="Xóa"
                                                        disabled={user.role === 'SUPER_ADMIN'}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    className="btn-restore"
                                                    onClick={() => handleRestore(user.id)}
                                                    title="Khôi phục"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="pagination">
                    <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="pagination-btn"
                    >
                        ← Trước
                    </button>

                    <span className="pagination-info">
                        Trang {currentPage + 1} / {totalPages} (Tổng {totalElements} users)
                    </span>

                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                        className="pagination-btn"
                    >
                        Sau →
                    </button>
                </div>

                {/* Edit Modal */}
                {showEditModal && (
                    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Chỉnh sửa User</h2>
                                <button onClick={() => setShowEditModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Email:</label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tên hiển thị:</label>
                                    <input
                                        type="text"
                                        value={editForm.displayName}
                                        onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Role:</label>
                                    <select
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    >
                                        <option value="USER">User (Người dùng thường)</option>
                                        <option value="SELLER">Seller (Người bán hàng)</option>
                                        <option value="PREMIUM">Premium (Người dùng trả phí)</option>
                                        <option value="MODERATOR">Moderator (Kiểm duyệt viên)</option>
                                        <option value="ADMIN">Admin (Quản trị viên)</option>
                                    </select>
                                    <small style={{ display: 'block', marginTop: '0.5rem', color: '#64748b' }}>
                                        SUPER_ADMIN không thể thay đổi qua UI
                                    </small>
                                </div>
                                <div className="form-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={editForm.emailVerified}
                                            onChange={(e) => setEditForm({ ...editForm, emailVerified: e.target.checked })}
                                        />
                                        Email đã xác thực
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-cancel" onClick={() => setShowEditModal(false)}>
                                    Hủy
                                </button>
                                <button className="btn-save" onClick={handleEdit}>
                                    Lưu
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}


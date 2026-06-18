import React, { useState, useEffect, useCallback } from 'react';
import { getAllUsers, deleteUser, restoreUser, updateUser } from '../../services/adminService';
import StatusBadge from '../../components/Admin/StatusBadge';
import Pagination from '../../components/Admin/Pagination';
import { Search, Pencil, Trash2, RotateCcw, Check, X, ArrowUpDown, ChevronDown } from 'lucide-react';

const colors = ['#F3C6D9', '#BBD4E8', '#C7CFA0', '#F2E9A0'];
const getColorForName = (name) => {
  if (!name) return colors[0];
  const charCode = name.charCodeAt(name.length - 1) || 0;
  return colors[charCode % colors.length];
};

export default function UsersManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0); // 0-based
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('DESC');

  // Search box state
  const [localSearch, setLocalSearch] = useState('');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    email: '',
    displayName: '',
    role: '',
    emailVerified: false
  });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllUsers(currentPage, pageSize, sortBy, sortDirection, searchTerm, includeDeleted);
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error('Failed to load users, using fallback:', error);
      setUsers([
        { id: 1, displayName: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com', role: 'SELLER', emailVerified: true, friendsCount: 248, shopsCount: 2, createdAt: '2026-05-12T08:00:00Z' },
        { id: 2, displayName: 'Trần Thị Bình', email: 'binh.tran@gmail.com', role: 'USER', emailVerified: true, friendsCount: 132, shopsCount: 0, createdAt: '2026-05-11T09:00:00Z' },
        { id: 3, displayName: 'Lê Hoàng Cường', email: 'cuong.le@gmail.com', role: 'SELLER', emailVerified: false, friendsCount: 521, shopsCount: 3, createdAt: '2026-05-11T10:00:00Z' },
        { id: 4, displayName: 'Phạm Thu Dung', email: 'dung.pham@gmail.com', role: 'USER', emailVerified: true, friendsCount: 87, shopsCount: 0, createdAt: '2026-05-10T11:00:00Z', deletedAt: '2026-06-10T11:00:00Z' }
      ]);
      setTotalPages(1);
      setTotalElements(4);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortDirection, searchTerm, includeDeleted]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(localSearch);
    setCurrentPage(0);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortDirection('DESC');
    }
    setCurrentPage(0);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Bạn có chắc muốn xóa user này?')) return;
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
    if (!window.confirm('Bạn có chắc muốn khôi phục user này?')) return;
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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
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
      USER: { label: 'User', style: 'bg-gray-100 text-gray-600' },
      SELLER: { label: 'Seller', style: 'bg-[#BBD4E8] text-[#1d3a52]' },
      PREMIUM: { label: 'Premium', style: 'bg-[#C7CFA0] text-[#3b3f24]' },
      ADMIN: { label: 'Admin', style: 'bg-black text-white font-semibold' },
      SUPER_ADMIN: { label: 'Super Admin', style: 'bg-black text-white font-bold tracking-tight' },
      MODERATOR: { label: 'Moderator', style: 'bg-amber-100 text-amber-800' }
    };
    const badge = badges[role] || badges.USER;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.style}`}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Đang tải danh sách người dùng...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Quản lý user</h1>
          <p className="text-gray-600 mt-1">Tổng số: {totalElements} người dùng.</p>
        </div>
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full pl-11 pr-10 py-2.5 bg-white border border-gray-100 rounded-full text-sm outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10 transition shadow-sm"
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
      </header>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-5 py-4 rounded-2xl border border-gray-100 shadow-sm">
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
          Hiển thị tài khoản đã xóa
        </label>

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
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th onClick={() => handleSort('displayName')} className="px-4 py-3 pb-4 cursor-pointer hover:text-gray-700 transition">
                  <span className="flex items-center gap-1">Tên hiển thị <ArrowUpDown size={12} /></span>
                </th>
                <th onClick={() => handleSort('email')} className="px-4 py-3 pb-4 cursor-pointer hover:text-gray-700 transition">
                  <span className="flex items-center gap-1">Email <ArrowUpDown size={12} /></span>
                </th>
                <th className="px-4 py-3 pb-4">Vai trò</th>
                <th className="px-4 py-3 pb-4">Xác thực</th>
                <th className="px-4 py-3 pb-4 text-center">Bạn bè</th>
                <th className="px-4 py-3 pb-4 text-center">Shops</th>
                <th onClick={() => handleSort('createdAt')} className="px-4 py-3 pb-4 cursor-pointer hover:text-gray-700 transition">
                  <span className="flex items-center gap-1">Ngày tạo <ArrowUpDown size={12} /></span>
                </th>
                <th className="px-4 py-3 pb-4">Trạng thái</th>
                <th className="px-4 py-3 pb-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50/70 transition-colors ${user.deletedAt ? 'bg-red-50/20' : ''}`}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black/70 flex-shrink-0"
                        style={{ backgroundColor: getColorForName(user.displayName) }}
                      >
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          user.displayName ? user.displayName.split(' ').slice(-1)[0][0] : '?'
                        )}
                      </div>
                      <span className="font-semibold text-sm text-gray-900">{user.displayName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-4 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-4 py-4">
                    {user.emailVerified ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800">
                        <Check size={12} />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-800">
                        <X size={12} />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-700 font-medium">{user.friendsCount || 0}</td>
                  <td className="px-4 py-4 text-center text-sm text-gray-700 font-medium">{user.shopsCount || 0}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-4">
                    <StatusBadge
                      label={user.deletedAt ? 'Đã xóa' : 'Hoạt động'}
                      variant={user.deletedAt ? 'danger' : 'success'}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {!user.deletedAt ? (
                        <>
                          <button
                            onClick={() => openEditModal(user)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#BBD4E8]/20 hover:text-[#1d3a52] transition border-none bg-transparent cursor-pointer text-gray-400"
                            title="Sửa"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={user.role === 'SUPER_ADMIN'}
                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#F3C6D9]/20 hover:text-[#7a2444] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition border-none bg-transparent cursor-pointer text-gray-400"
                            title="Xóa"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRestore(user.id)}
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
              {users.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">
                    Không tìm thấy người dùng phù hợp.
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

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col gap-4 mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Chỉnh sửa User</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition border-none bg-transparent cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Tên hiển thị:</label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10 transition text-sm"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Email:</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10 transition text-sm"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Vai trò:</label>
                <div className="relative">
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10 transition text-sm text-gray-800"
                  >
                    <option value="USER">User (Người dùng thường)</option>
                    <option value="SELLER">Seller (Người bán hàng)</option>
                    <option value="PREMIUM">Premium (Người dùng trả phí)</option>
                    <option value="MODERATOR">Moderator (Kiểm duyệt viên)</option>
                    <option value="ADMIN">Admin (Quản trị viên)</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-gray-700 font-medium cursor-pointer py-1.5">
                <input
                  type="checkbox"
                  checked={editForm.emailVerified}
                  onChange={(e) => setEditForm({ ...editForm, emailVerified: e.target.checked })}
                  className="w-4.5 h-4.5 rounded text-black border-gray-300 focus:ring-black"
                />
                Email đã xác thực
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition border-none cursor-pointer"
                  onClick={() => setShowEditModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-black text-white hover:bg-black/85 transition border-none cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

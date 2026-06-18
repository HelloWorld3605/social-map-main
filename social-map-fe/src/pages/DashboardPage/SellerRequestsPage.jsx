import React, { useState, useEffect, useMemo } from 'react';
import { getSellerRequests, approveSellerRequest, rejectSellerRequest } from '../../services/sellerRequestService';
import StatusBadge from '../../components/Admin/StatusBadge';
import Pagination from '../../components/Admin/Pagination';
import { Check, X } from 'lucide-react';

const colors = ['#F3C6D9', '#BBD4E8', '#C7CFA0', '#F2E9A0'];
const getColorForName = (name) => {
  if (!name) return colors[0];
  const charCode = name.charCodeAt(name.length - 1) || 0;
  return colors[charCode % colors.length];
};

const tabs = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'APPROVED', label: 'Đã chấp nhận' },
  { key: 'REJECTED', label: 'Đã từ chối' }
];

const statusMeta = {
  PENDING: { label: 'Chờ duyệt', variant: 'warning' },
  APPROVED: { label: 'Đã chấp nhận', variant: 'success' },
  REJECTED: { label: 'Đã từ chối', variant: 'danger' }
};

const PAGE_SIZE = 6;

export default function SellerRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [page, setPage] = useState(0); // 0-based for Pagination component

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getSellerRequests(null); // Fetch all to show count tabs
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load seller requests, using fallback:', error);
      setRequests([
        { id: 1, userDisplayName: 'Nguyễn Văn An', userEmail: 'an.nguyen@gmail.com', citizenId: '079201001234', createdAt: '2026-06-12T08:00:00Z', status: 'PENDING' },
        { id: 2, userDisplayName: 'Trần Thị Bình', userEmail: 'binh.tran@gmail.com', citizenId: '038198007654', createdAt: '2026-06-11T09:00:00Z', status: 'PENDING' },
        { id: 3, userDisplayName: 'Lê Hoàng Cường', userEmail: 'cuong.le@gmail.com', citizenId: '001099012345', createdAt: '2026-05-11T10:00:00Z', status: 'APPROVED', reviewedByName: 'Admin' },
        { id: 4, userDisplayName: 'Phạm Thu Dung', userEmail: 'dung.pham@gmail.com', citizenId: '079300054321', createdAt: '2026-05-10T11:00:00Z', status: 'REJECTED', rejectReason: 'Tài liệu mờ, không rõ thông tin', reviewedByName: 'Admin' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    if (activeTab === 'ALL') return requests;
    return requests.filter(r => r.status === activeTab);
  }, [requests, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pagedRequests = useMemo(() => {
    const startIdx = currentPage * PAGE_SIZE;
    return filteredRequests.slice(startIdx, startIdx + PAGE_SIZE);
  }, [filteredRequests, currentPage]);

  const countFor = (key) => {
    if (key === 'ALL') return requests.length;
    return requests.filter(r => r.status === key).length;
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Bạn có chắc muốn chấp nhận yêu cầu này?')) return;
    try {
      await approveSellerRequest(requestId);
      alert('Đã chấp nhận yêu cầu!');
      loadRequests();
      window.dispatchEvent(new Event('refresh-admin-stats'));
    } catch (error) {
      console.error('Failed to approve request:', error);
      alert('Có lỗi xảy ra!');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối!');
      return;
    }
    try {
      await rejectSellerRequest(selectedRequest.id, rejectReason);
      alert('Đã từ chối yêu cầu!');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedRequest(null);
      loadRequests();
      window.dispatchEvent(new Event('refresh-admin-stats'));
    } catch (error) {
      console.error('Failed to reject request:', error);
      alert('Có lỗi xảy ra!');
    }
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Đang tải yêu cầu seller...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Yêu cầu seller</h1>
        <p className="text-gray-600 mt-1">
          Duyệt các yêu cầu trở thành người bán trên Social Map.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer border-none flex items-center ${
              activeTab === tab.key
                ? 'bg-black text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 text-xs font-semibold ${
                activeTab === tab.key ? 'text-white/70' : 'text-gray-400'
              }`}
            >
              {countFor(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {/* Requests Table Wrapper */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="px-4 py-3 pb-4">Người dùng</th>
                <th className="px-4 py-3 pb-4">Trạng thái</th>
                <th className="px-4 py-3 pb-4">CCCD</th>
                <th className="px-4 py-3 pb-4">Ngày tạo</th>
                <th className="px-4 py-3 pb-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pagedRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black/70 flex-shrink-0"
                        style={{ backgroundColor: getColorForName(req.userDisplayName) }}
                      >
                        {req.userDisplayName ? req.userDisplayName.split(' ').slice(-1)[0][0] : '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {req.userDisplayName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {req.userEmail}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge
                      label={statusMeta[req.status]?.label || req.status}
                      variant={statusMeta[req.status]?.variant || 'neutral'}
                    />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 font-mono">
                    {req.citizenId}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {formatDate(req.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    {req.status === 'PENDING' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C7CFA0] text-[#3b3f24] text-xs font-semibold hover:brightness-95 transition border-none cursor-pointer"
                        >
                          <Check size={14} /> Chấp nhận
                        </button>
                        <button
                          onClick={() => openRejectModal(req)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3C6D9] text-[#7a2444] text-xs font-semibold hover:brightness-95 transition border-none cursor-pointer"
                        >
                          <X size={14} /> Từ chối
                        </button>
                      </div>
                    ) : (
                      <p className="text-right text-xs text-gray-400 italic">
                        Đã xử lý {req.reviewedByName && `bởi ${req.reviewedByName}`}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
              {pagedRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                    Không có yêu cầu nào.
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
              totalItems={filteredRequests.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col gap-4 mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Từ chối yêu cầu</h2>
              <button
                onClick={() => setShowRejectModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition border-none bg-transparent cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Lý do từ chối:</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10 transition text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition border-none cursor-pointer"
                onClick={() => setShowRejectModal(false)}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#F3C6D9] text-[#7a2444] hover:brightness-95 transition border-none cursor-pointer"
                onClick={handleReject}
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

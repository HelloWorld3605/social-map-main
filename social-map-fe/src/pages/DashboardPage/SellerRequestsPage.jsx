import React, { useState, useEffect } from 'react';
import { getSellerRequests, approveSellerRequest, rejectSellerRequest } from '../../services/sellerRequestService';
import { getDashboardStats } from '../../services/adminService';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import './SellerRequestsPage.css';

export default function SellerRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        loadRequests();
        loadPendingCount();
    }, [filter]);

    const loadPendingCount = async () => {
        try {
            const data = await getDashboardStats(); // api helper already returns response.data
            console.log('Dashboard stats data:', data);
            const count = data?.pendingSellerRequests || 0;
            console.log('Pending count:', count);
            setPendingCount(count);
        } catch (error) {
            console.error('Failed to load pending count:', error);
            setPendingCount(0); // Set default on error
        }
    };

    const loadRequests = async () => {
        try {
            setLoading(true);
            const statusFilter = filter !== 'ALL' ? filter : null;
            const data = await getSellerRequests(statusFilter); // api helper already returns response.data
            console.log('Seller requests data:', data);
            setRequests(Array.isArray(data) ? data : []); // Ensure it's an array
        } catch (error) {
            console.error('Failed to load seller requests:', error);
            setRequests([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId) => {
        if (!confirm('Bạn có chắc muốn chấp nhận yêu cầu này?')) return;

        try {
            await approveSellerRequest(requestId);
            alert('Đã chấp nhận yêu cầu!');
            loadRequests();
            loadPendingCount(); // Refresh pending count
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
            loadPendingCount(); // Refresh pending count
        } catch (error) {
            console.error('Failed to reject request:', error);
            alert('Có lỗi xảy ra!');
        }
    };

    const openRejectModal = (request) => {
        setSelectedRequest(request);
        setShowRejectModal(true);
    };

    const getStatusBadge = (status) => {
        const badges = {
            PENDING: { label: 'Chờ duyệt', className: 'warning' },
            APPROVED: { label: 'Đã chấp nhận', className: 'success' },
            REJECTED: { label: 'Đã từ chối', className: 'danger' },
        };
        const badge = badges[status] || badges.PENDING;
        return <span className={`status-badge ${badge.className}`}>{badge.label}</span>;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    if (loading) {
        return (
            <>
                <AdminSidebar pendingCount={pendingCount} />
                <div className="seller-requests-container">
                    <div className="loading">Đang tải...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <AdminSidebar pendingCount={pendingCount} />
            <div className="seller-requests-container">
                <div className="page-header">
                    <h1>Yêu cầu trở thành Seller</h1>
                    <p>Quản lý các yêu cầu đăng ký trở thành người bán</p>
                </div>

            <div className="filter-tabs">
                <button
                    className={`filter-tab ${filter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setFilter('ALL')}
                >
                    Tất cả
                </button>
                <button
                    className={`filter-tab ${filter === 'PENDING' ? 'active' : ''}`}
                    onClick={() => setFilter('PENDING')}
                >
                    Chờ duyệt
                </button>
                <button
                    className={`filter-tab ${filter === 'APPROVED' ? 'active' : ''}`}
                    onClick={() => setFilter('APPROVED')}
                >
                    Đã chấp nhận
                </button>
                <button
                    className={`filter-tab ${filter === 'REJECTED' ? 'active' : ''}`}
                    onClick={() => setFilter('REJECTED')}
                >
                    Đã từ chối
                </button>
            </div>

            {(!requests || requests.length === 0) ? (
                <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>Không có yêu cầu nào</p>
                </div>
            ) : (
                <div className="requests-grid">
                    {requests.map((request) => (
                        <div key={request.id} className="request-card">
                            <div className="request-header">
                                <div className="request-user">
                                    <h3>{request.userDisplayName}</h3>
                                    <p>{request.userEmail}</p>
                                </div>
                                {getStatusBadge(request.status)}
                            </div>

                            <div className="request-body">
                                <div className="request-field">
                                    <label>CCCD:</label>
                                    <p>{request.citizenId}</p>
                                </div>
                                <div className="request-field">
                                    <label>Ngày tạo:</label>
                                    <p>{formatDate(request.createdAt)}</p>
                                </div>
                                {request.reviewedAt && (
                                    <>
                                        <div className="request-field">
                                            <label>Người duyệt:</label>
                                            <p>{request.reviewedByName}</p>
                                        </div>
                                        <div className="request-field">
                                            <label>Ngày duyệt:</label>
                                            <p>{formatDate(request.reviewedAt)}</p>
                                        </div>
                                    </>
                                )}
                                {request.rejectReason && (
                                    <div className="request-field reject-reason">
                                        <label>Lý do từ chối:</label>
                                        <p>{request.rejectReason}</p>
                                    </div>
                                )}
                            </div>

                            {request.status === 'PENDING' && (
                                <div className="request-actions">
                                    <button
                                        className="btn-approve"
                                        onClick={() => handleApprove(request.id)}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Chấp nhận
                                    </button>
                                    <button
                                        className="btn-reject"
                                        onClick={() => openRejectModal(request)}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Từ chối
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Từ chối yêu cầu</h2>
                            <button onClick={() => setShowRejectModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <label>Lý do từ chối:</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Nhập lý do từ chối..."
                                rows={4}
                            />
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowRejectModal(false)}
                            >
                                Hủy
                            </button>
                            <button
                                className="btn-reject"
                                onClick={handleReject}
                            >
                                Từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </>
    );
}


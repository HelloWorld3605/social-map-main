import React, { useState, useEffect } from 'react';
import {
    FaUserFriends,
    FaStickyNote,
    FaStore,
    FaCheckCircle,
    FaPlusCircle,
    FaSpinner,
    FaHourglassHalf,
    FaTimesCircle,
    FaTimes,
    FaIdCard,
    FaCalendarAlt,
    FaInfoCircle,
    FaChevronDown,
    FaChevronUp,
    FaHistory,
    FaNewspaper,
    FaUsers,
    FaGamepad,
    FaBirthdayCake,
    FaRobot,
    FaBullhorn
} from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { createSellerRequest, getMySellerRequests } from '../../services/sellerRequestService';
import CreateShopModal from '../Shop/CreateShopModal';
import { useNotes } from '../../context/NotesContext';
import './Sidebar.css';

export default function Sidebar() {
    const [user, setUser] = useState(null);
    const [showSellerRequestModal, setShowSellerRequestModal] = useState(false);
    const [showCreateShopModal, setShowCreateShopModal] = useState(false);
    const [sellerRequestForm, setSellerRequestForm] = useState({
        citizenId: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [userHasCitizenId, setUserHasCitizenId] = useState(false);
    const [userCitizenId, setUserCitizenId] = useState('');
    const [sellerRequests, setSellerRequests] = useState([]);
    const [latestRequest, setLatestRequest] = useState(null);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [showAllRequests, setShowAllRequests] = useState(false);
    const [showAllMenuItems, setShowAllMenuItems] = useState(false);
    const [showAllSellerItems, setShowAllSellerItems] = useState(false);
    const navigate = useNavigate();
    const { openNotes } = useNotes();

    // Load user info
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        console.log('Sidebar - User from localStorage:', userStr);
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                console.log('Sidebar - Parsed user data:', userData);
                console.log('Sidebar - User role:', userData.role);
                console.log('Sidebar - User citizenId:', userData.citizenId);
                setUser(userData);

                // Check if user has citizenId
                if (userData.citizenId) {
                    setUserHasCitizenId(true);
                    setUserCitizenId(userData.citizenId);
                } else {
                    setUserHasCitizenId(false);
                    setUserCitizenId('');
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        } else {
            console.log('Sidebar - No user data in localStorage');
        }
    }, []);

    // Function to load seller requests (reusable)
    const loadSellerRequests = async () => {
        try {
            setLoadingRequests(true);
            const response = await getMySellerRequests();
            console.log('📡 API Response (already parsed):', response);

            // api.get() đã return response.data rồi, không cần .data thêm lần nữa
            const requests = Array.isArray(response) ? response : [];
            console.log('📋 Requests Array:', requests);

            setSellerRequests(requests);

            // Lấy request mới nhất (đã sắp xếp theo createdAt desc từ backend)
            if (requests.length > 0) {
                console.log('✅ Latest Request:', requests[0]);
                setLatestRequest(requests[0]);

                // Nếu request mới nhất là APPROVED, cập nhật role thành SELLER
                if (requests[0].status === 'APPROVED' && user?.role !== 'SELLER') {
                    const updatedUser = { ...user, role: 'SELLER' };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    console.log('✅ User role updated to SELLER');
                }
            } else {
                console.log('⚠️ No requests found');
                setLatestRequest(null);
            }
        } catch (error) {
            console.error('❌ Failed to load seller requests:', error);
            console.error('Error details:', error.response?.data);
            setLatestRequest(null);
        } finally {
            setLoadingRequests(false);
        }
    };

    // Load seller requests khi component mount hoặc user thay đổi
    useEffect(() => {
        // Chỉ load nếu đã có user
        if (user) {
            loadSellerRequests();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);


    // Handle seller request submission
    const handleSellerRequestSubmit = async (e) => {
        e.preventDefault();

        // Nếu user chưa có CCCD, bắt buộc phải nhập
        if (!userHasCitizenId) {
            if (!sellerRequestForm.citizenId) {
                alert('Vui lòng nhập CCCD!');
                return;
            }

            // Validate CCCD format (12 số)
            const citizenIdPattern = /^[0-9]{12}$/;
            if (!citizenIdPattern.test(sellerRequestForm.citizenId)) {
                alert('CCCD phải là 12 chữ số!');
                return;
            }
        }

        try {
            setSubmitting(true);

            // Prepare request data
            const requestData = userHasCitizenId
                ? {} // Nếu đã có CCCD, gửi empty object (backend sẽ dùng CCCD có sẵn)
                : { citizenId: sellerRequestForm.citizenId }; // Nếu chưa có, gửi CCCD mới

            // Gọi API để tạo seller request
            await createSellerRequest(requestData);

            alert('✅ Yêu cầu của bạn đã được gửi thành công! Admin sẽ xem xét và phản hồi sớm nhất.');

            // Reset form
            setSellerRequestForm({
                citizenId: ''
            });

            // Reload seller requests để hiển thị request mới
            await loadSellerRequests();

            setShowSellerRequestModal(false);
        } catch (error) {
            console.error('Failed to submit seller request:', error);

            // Xử lý lỗi cụ thể
            const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra. Vui lòng thử lại!';

            if (errorMessage.includes('đã có yêu cầu đang chờ')) {
                alert('⚠️ Bạn đã có yêu cầu đang chờ xét duyệt. Vui lòng chờ admin phản hồi!');
            } else if (errorMessage.includes('đã là người bán')) {
                alert('ℹ️ Bạn đã là người bán hàng rồi!');
            } else {
                alert('❌ ' + errorMessage);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <nav className="side-menu">
            <ul>
                {/* User Profile Menu Item */}
                {user && (
                    <li>
                        <Link
                            to="/profile"
                            className="user-profile-menu-item"
                        >
                            <div className="user-avatar-small">
                                <img
                                    src={user.avatarUrl || '/default-avatar.png'}
                                    alt="Avatar"
                                    onError={(e) => {
                                        e.target.src = '/default-avatar.png';
                                    }}
                                />
                            </div>
                            <div className="user-info-compact">
                                <div className="user-name-compact">{user.displayName || 'Người dùng'}</div>
                                <div className="user-role-compact">
                                    {user.role === 'SELLER' ? 'Người bán hàng' :
                                     user.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                                </div>
                            </div>
                        </Link>
                    </li>
                )}

                {/* 7 mục đầu tiên - luôn hiển thị */}
                <li>
                    <Link to="#">
                        <FaUserFriends className="menu-icon" />
                        <span>Bạn bè</span>
                    </Link>
                </li>
                <li>
                    <Link
                        to="#"
                        onClick={(e) => {
                            e.preventDefault();
                            openNotes();
                        }}
                    >
                        <FaStickyNote className="menu-icon" />
                        <span>Ghi chú</span>
                    </Link>
                </li>
                <li>
                    <Link to="#">
                        <FaNewspaper className="menu-icon" />
                        <span>Bài viết</span>
                    </Link>
                </li>
                <li>
                    <Link to="#">
                        <FaHistory className="menu-icon" />
                        <span>Kỷ niệm</span>
                    </Link>
                </li>
                <li>
                    <Link to="#">
                        <FaUsers className="menu-icon" />
                        <span>Nhóm</span>
                    </Link>
                </li>
                <li>
                    <Link to="#">
                        <FaGamepad className="menu-icon" />
                        <span>Chơi game</span>
                    </Link>
                </li>
                <li>
                    <Link to="#">
                        <FaBirthdayCake className="menu-icon" />
                        <span>Sinh nhật</span>
                    </Link>
                </li>

                {/* Các mục còn lại - chỉ hiển thị khi showAllMenuItems = true */}
                {showAllMenuItems && (
                    <>
                        <li>
                            <Link to="#">
                                <FaCalendarAlt className="menu-icon" />
                                <span>Sự kiện</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="#">
                                <FaRobot className="menu-icon" />
                                <span>Chat với AI</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="#">
                                <FaBullhorn className="menu-icon" />
                                <span>Quảng Cáo</span>
                            </Link>
                        </li>
                    </>
                )}

                {/* Nút Xem thêm/Ẩn bớt - luôn ở cuối */}
                <li className="menu-toggle-container">
                    <button
                        className="menu-toggle-btn"
                        onClick={() => setShowAllMenuItems(!showAllMenuItems)}
                    >
                        {showAllMenuItems ? (
                            <>
                                <FaChevronUp className="toggle-icon" />
                                <span>Ẩn bớt</span>
                            </>
                        ) : (
                            <>
                                <FaChevronDown className="toggle-icon" />
                                <span>Xem thêm</span>
                            </>
                        )}
                    </button>
                </li>
            </ul>

            {/* Section Quản lý thông tin seller */}
            {(user?.role === 'USER' || user?.role === 'SELLER') && (
                <div className="seller-management-section">
                    <div className="seller-section-header">
                        <span>Quản lý thông tin seller</span>
                    </div>
                    <ul className="seller-menu-list">
                        {(() => {
                            console.log('Sidebar seller section - User:', user);
                            console.log('Sidebar seller section - User role:', user?.role);

                            // Hiển thị cho USER (chưa phải SELLER) - Yêu cầu trở thành seller
                            if (user?.role === 'USER') {
                                return (
                                    <li>
                                        <Link
                                            to="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setShowSellerRequestModal(true);
                                            }}
                                            className="seller-request-link"
                                        >
                                            <FaStore className="menu-icon" />
                                            <span>Yêu cầu trở thành người bán hàng</span>
                                        </Link>
                                    </li>
                                );
                            }

                            // Hiển thị cho SELLER - Xem thông tin người bán
                            if (user?.role === 'SELLER') {
                                const sellerItems = [
                                    {
                                        icon: <FaCheckCircle className="menu-icon text-success" />,
                                        text: 'Thông tin người bán hàng',
                                        onClick: () => setShowSellerRequestModal(true)
                                    },
                                    {
                                        icon: <FaPlusCircle className="menu-icon text-primary" />,
                                        text: 'Tạo cửa hàng mới',
                                        onClick: () => setShowCreateShopModal(true)
                                    },
                                    {
                                        icon: <FaStore className="menu-icon text-success" />,
                                        text: 'Quản lý các cửa hàng của bạn',
                                        to: '/shop-management'
                                    },
                                    {
                                        icon: <FaStore className="menu-icon" />,
                                        text: 'Cửa hàng 1',
                                        onClick: () => {}
                                    },
                                    {
                                        icon: <FaStore className="menu-icon" />,
                                        text: 'Cửa hàng 2',
                                        onClick: () => {}
                                    },
                                    {
                                        icon: <FaStore className="menu-icon" />,
                                        text: 'Cửa hàng 3',
                                        onClick: () => {}
                                    }
                                ];

                                return (
                                    <>
                                        {sellerItems.slice(0, showAllSellerItems ? sellerItems.length : 5).map((item, index) => (
                                            <li key={index}>
                                                {item.to ? (
                                                    <Link
                                                        to={item.to}
                                                        className="seller-request-link"
                                                    >
                                                        {item.icon}
                                                        <span>{item.text}</span>
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        to="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            item.onClick();
                                                        }}
                                                        className="seller-request-link"
                                                    >
                                                        {item.icon}
                                                        <span>{item.text}</span>
                                                    </Link>
                                                )}
                                            </li>
                                        ))}
                                        {sellerItems.length > 5 && (
                                            <li className="menu-toggle-container">
                                                <button
                                                    className="menu-toggle-btn"
                                                    onClick={() => setShowAllSellerItems(!showAllSellerItems)}
                                                >
                                                    {showAllSellerItems ? (
                                                        <>
                                                            <FaChevronUp className="toggle-icon" />
                                                            <span>Ẩn bớt</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaChevronDown className="toggle-icon" />
                                                            <span>Xem thêm</span>
                                                        </>
                                                    )}
                                                </button>
                                            </li>
                                        )}
                                    </>
                                );
                            }

                            return null;
                        })()}
                    </ul>
                </div>
            )}

            {/* Seller Request Modal */}
            {showSellerRequestModal && (
                <div className="modal-overlay" onClick={() => setShowSellerRequestModal(false)}>
                    <div className="modal-content seller-request-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                {user?.role === 'SELLER'
                                    ? 'Thông tin người bán hàng'
                                    : latestRequest
                                        ? 'Trạng thái yêu cầu'
                                        : 'Đăng ký trở thành người bán hàng'}
                            </h2>
                            <button
                                className="modal-close-btn"
                                onClick={() => setShowSellerRequestModal(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Hiển thị theo thứ tự ưu tiên */}
                        {loadingRequests ? (
                            /* 1. Loading state */
                            <div className="seller-info-display">
                                <div className="loading-container">
                                    <FaSpinner className="loading-spinner-icon" />
                                    <p>Đang tải thông tin...</p>
                                </div>
                            </div>
                        ) : latestRequest && (latestRequest.status === 'PENDING' || latestRequest.status === 'REJECTED') ? (
                            /* 2. Có request PENDING hoặc REJECTED - Hiển thị CCCD và myRequest */
                            <div className="seller-info-display">
                                <div className={`status-banner status-${latestRequest.status.toLowerCase()}`}>
                                    <span className="status-icon">
                                        {latestRequest.status === 'PENDING' ? <FaHourglassHalf /> : <FaTimesCircle />}
                                    </span>
                                    <div>
                                        <h3>
                                            {latestRequest.status === 'PENDING'
                                                ? 'Yêu cầu đang chờ xét duyệt'
                                                : 'Yêu cầu đã bị từ chối'}
                                        </h3>
                                        <p>
                                            {latestRequest.status === 'PENDING'
                                                ? 'Admin sẽ xem xét và phản hồi sớm nhất.'
                                                : 'Vui lòng liên hệ admin để biết thêm chi tiết.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="request-details">
                                    <h4>Thông tin CCCD</h4>

                                    <div className="info-group">
                                        <label>CCCD (Căn cước công dân)</label>
                                        <div className="info-value">{latestRequest.citizenId}</div>
                                    </div>

                                    <h4 style={{ marginTop: '1.5rem' }}>Yêu cầu của tôi</h4>

                                    <div className="info-group">
                                        <label>Ngày tạo yêu cầu</label>
                                        <div className="info-value">
                                            {new Date(latestRequest.createdAt).toLocaleString('vi-VN')}
                                        </div>
                                    </div>

                                    <div className="info-group">
                                        <label>Trạng thái</label>
                                        <div className={`status-badge status-${latestRequest.status.toLowerCase()}`}>
                                            {latestRequest.status === 'PENDING' ? 'Đang chờ xét duyệt' : 'Đã từ chối'}
                                        </div>
                                    </div>

                                    {latestRequest.rejectReason && (
                                        <div className="info-group">
                                            <label>Lý do từ chối</label>
                                            <div className="info-value reject-reason">{latestRequest.rejectReason}</div>
                                        </div>
                                    )}
                                </div>

                                {/* All Requests History */}
                                {sellerRequests.length > 5 && (
                                    <div className="all-requests-section">
                                        <button
                                            type="button"
                                            className="view-history-btn"
                                            onClick={() => setShowAllRequests(!showAllRequests)}
                                        >
                                            <FaHistory className="history-icon" />
                                            {showAllRequests ? (
                                                <>
                                                    <FaChevronDown className="chevron-icon" />
                                                    <span>Ẩn bớt yêu cầu</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FaChevronRight className="chevron-icon" />
                                                    <span>Xem thêm yêu cầu</span>
                                                </>
                                            )}
                                            <span className="request-count">({sellerRequests.length} yêu cầu)</span>
                                        </button>
                                    </div>
                                )}

                                <div className="requests-history">
                                    {sellerRequests.slice(0, showAllRequests ? sellerRequests.length : 5).map((request, index) => (
                                        <div key={request.id} className={`request-item ${index === 0 ? 'latest' : ''}`}>
                                            <div className="request-item-header">
                                                <span className="request-number">#{sellerRequests.length - index}</span>
                                                <span className={`status-badge status-${request.status.toLowerCase()}`}>
                                                    {request.status === 'PENDING' ? 'Đang chờ' :
                                                        request.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
                                                </span>
                                            </div>
                                            <div className="request-item-body">
                                                <div className="request-field">
                                                    <FaIdCard className="field-icon" />
                                                    <span className="field-label">CCCD:</span>
                                                    <span className="field-value">{request.citizenId}</span>
                                                </div>
                                                <div className="request-field">
                                                    <FaCalendarAlt className="field-icon" />
                                                    <span className="field-label">Ngày tạo:</span>
                                                    <span className="field-value">
                                                        {new Date(request.createdAt).toLocaleString('vi-VN')}
                                                    </span>
                                                </div>
                                                {request.reviewedAt && (
                                                    <div className="request-field">
                                                        <FaCalendarAlt className="field-icon" />
                                                        <span className="field-label">Ngày xét duyệt:</span>
                                                        <span className="field-value">
                                                            {new Date(request.reviewedAt).toLocaleString('vi-VN')}
                                                        </span>
                                                    </div>
                                                )}
                                                {request.rejectReason && (
                                                    <div className="request-field">
                                                        <FaInfoCircle className="field-icon" />
                                                        <span className="field-label">Lý do từ chối:</span>
                                                        <span className="field-value reject-reason">{request.rejectReason}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={() => setShowSellerRequestModal(false)}
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        ) : (latestRequest?.status === 'APPROVED' || user?.role === 'SELLER') ? (
                            /* 3. Đã là SELLER hoặc có request APPROVED - Hiển thị thông tin người bán */
                            <div className="seller-info-display">
                                <div className="success-banner">
                                    <span className="success-icon"><FaCheckCircle /></span>
                                    <div>
                                        <h3>
                                            {latestRequest?.reviewedAt
                                                ? `Bạn đã là người bán hàng từ ngày ${new Date(latestRequest.reviewedAt).toLocaleDateString('vi-VN')}`
                                                : 'Bạn đã là người bán hàng'
                                            }
                                        </h3>
                                        <p>Tài khoản của bạn đã được nâng cấp thành SELLER</p>
                                    </div>
                                </div>

                                {latestRequest ? (
                                    <div className="request-details">
                                        <h4>Thông tin CCCD</h4>

                                        <div className="info-group">
                                            <label>CCCD (Căn cước công dân)</label>
                                            <div className="info-value">{latestRequest.citizenId}</div>
                                        </div>

                                        <h4 style={{ marginTop: '1.5rem' }}>Yêu cầu của tôi</h4>

                                        <div className="info-group">
                                            <label>Ngày tạo yêu cầu</label>
                                            <div className="info-value">
                                                {new Date(latestRequest.createdAt).toLocaleString('vi-VN')}
                                            </div>
                                        </div>

                                        <div className="info-group">
                                            <label>Ngày được duyệt</label>
                                            <div className="info-value">
                                                {latestRequest.reviewedAt
                                                    ? new Date(latestRequest.reviewedAt).toLocaleString('vi-VN')
                                                    : 'Chưa có thông tin'}
                                            </div>
                                        </div>

                                        <div className="info-group">
                                            <label>Trạng thái</label>
                                            <div className="status-badge status-approved">
                                                Đã duyệt
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="request-details">
                                        <p style={{ textAlign: 'center', color: '#64748b' }}>
                                            Không tìm thấy thông tin yêu cầu
                                        </p>
                                    </div>
                                )}

                                {/* All Requests History */}
                                {sellerRequests.length > 5 && (
                                    <div className="all-requests-section">
                                        <button
                                            type="button"
                                            className="view-history-btn"
                                            onClick={() => setShowAllRequests(!showAllRequests)}
                                        >
                                            <FaHistory className="history-icon" />
                                            {showAllRequests ? (
                                                <>
                                                    <FaChevronDown className="chevron-icon" />
                                                    <span>Ẩn bớt yêu cầu</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FaChevronRight className="chevron-icon" />
                                                    <span>Xem thêm yêu cầu</span>
                                                </>
                                            )}
                                            <span className="request-count">({sellerRequests.length} yêu cầu)</span>
                                        </button>
                                    </div>
                                )}

                                <div className="requests-history">
                                    {sellerRequests.slice(0, showAllRequests ? sellerRequests.length : 5).map((request, index) => (
                                        <div key={request.id} className={`request-item ${index === 0 ? 'latest' : ''}`}>
                                            <div className="request-item-header">
                                                <span className="request-number">#{sellerRequests.length - index}</span>
                                                <span className={`status-badge status-${request.status.toLowerCase()}`}>
                                                    {request.status === 'PENDING' ? 'Đang chờ' :
                                                        request.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
                                                </span>
                                            </div>
                                            <div className="request-item-body">
                                                <div className="request-field">
                                                    <FaIdCard className="field-icon" />
                                                    <span className="field-label">CCCD:</span>
                                                    <span className="field-value">{request.citizenId}</span>
                                                </div>
                                                <div className="request-field">
                                                    <FaCalendarAlt className="field-icon" />
                                                    <span className="field-label">Ngày tạo:</span>
                                                    <span className="field-value">
                                                        {new Date(request.createdAt).toLocaleString('vi-VN')}
                                                    </span>
                                                </div>
                                                {request.reviewedAt && (
                                                    <div className="request-field">
                                                        <FaCalendarAlt className="field-icon" />
                                                        <span className="field-label">Ngày xét duyệt:</span>
                                                        <span className="field-value">
                                                            {new Date(request.reviewedAt).toLocaleString('vi-VN')}
                                                        </span>
                                                    </div>
                                                )}
                                                {request.rejectReason && (
                                                    <div className="request-field">
                                                        <FaInfoCircle className="field-icon" />
                                                        <span className="field-label">Lý do từ chối:</span>
                                                        <span className="field-value reject-reason">{request.rejectReason}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={() => setShowSellerRequestModal(false)}
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* 4. Chưa có request nào - Hiển thị form tạo mới */
                            <form onSubmit={handleSellerRequestSubmit} className="seller-request-form">
                                {userHasCitizenId ? (
                                    <div className="form-group">
                                        <label htmlFor="citizenId">
                                            CCCD (Căn cước công dân)
                                        </label>
                                        <input
                                            type="text"
                                            id="citizenId"
                                            value={userCitizenId}
                                            disabled
                                            style={{
                                                backgroundColor: '#f1f5f9',
                                                cursor: 'not-allowed',
                                                color: '#64748b'
                                            }}
                                        />
                                        <small style={{ display: 'block', marginTop: '0.5rem', color: '#10b981' }}>
                                            ✓ CCCD của bạn đã được xác thực trong hệ thống
                                        </small>
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <label htmlFor="citizenId">
                                            CCCD (Căn cước công dân) <span className="required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="citizenId"
                                            value={sellerRequestForm.citizenId}
                                            onChange={(e) => setSellerRequestForm({
                                                ...sellerRequestForm,
                                                citizenId: e.target.value
                                            })}
                                            placeholder="Nhập 12 chữ số CCCD"
                                            pattern="[0-9]{12}"
                                            maxLength={12}
                                            required
                                        />
                                        <small style={{ display: 'block', marginTop: '0.5rem', color: '#64748b' }}>
                                            Nhập CCCD của chính chủ tài khoản để xác minh danh tính (12 chữ số)
                                        </small>
                                    </div>
                                )}

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={() => setShowSellerRequestModal(false)}
                                        disabled={submitting}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-submit"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Create Shop Modal */}
            <CreateShopModal
                isOpen={showCreateShopModal}
                onClose={() => {
                    console.log('🚪 Sidebar closing CreateShopModal');
                    setShowCreateShopModal(false);
                }}
                onShopCreated={(shop) => {
                    console.log('Shop created:', shop);
                    alert(`Cửa hàng "${shop.name}" đã được tạo thành công! Vị trí đã được pin lên bản đồ.`);

                    // Reload shop markers on the map without reloading page
                    if (window.shopMarkersManager) {
                        console.log('Reloading shop markers...');
                        window.shopMarkersManager.loadShops();
                    } else {
                        // Fallback: reload page if shopMarkersManager is not available
                        window.location.reload();
                    }
                }}
            />
        </nav>
    );
}

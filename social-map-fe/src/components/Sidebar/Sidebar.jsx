import React, { useState, useEffect } from 'react';
import { createSellerRequest, getMySellerRequests } from '../../services/sellerRequestService';
import CreateShopModal from '../Shop/CreateShopModal';
import './Sidebar.css';

export default function Sidebar() {
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
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

    // Check location permission on mount
    useEffect(() => {
        // Kiểm tra xem user đã tắt vị trí chưa
        const userDisabledLocation = localStorage.getItem('locationDisabled') === 'true';

        if (userDisabledLocation) {
            // Nếu user đã tắt, không bật lại dù browser có permission
            setLocationEnabled(false);
            return;
        }

        // Chỉ tự động bật nếu có permission VÀ user chưa tắt
        if ('permissions' in navigator) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                if (result.state === 'granted') {
                    setLocationEnabled(true);
                    getCurrentLocation();
                }
            });
        }
    }, []);

    // Get current location
    const getCurrentLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lng: position.coords.longitude,
                        lat: position.coords.latitude
                    };
                    setUserLocation(location);
                    setLocationError(null);

                    // Store in localStorage for SearchBar to use
                    localStorage.setItem('userLocation', JSON.stringify(location));

                    // Dispatch custom event to notify other components
                    window.dispatchEvent(new CustomEvent('locationUpdated', {
                        detail: location
                    }));

                    console.log('Location obtained:', location);
                },
                (error) => {
                    console.error('Location error:', error);
                    setLocationError(error.message);
                    setLocationEnabled(false);
                    localStorage.removeItem('userLocation');
                }
            );
        } else {
            setLocationError('Trình duyệt không hỗ trợ định vị');
            setLocationEnabled(false);
        }
    };

    // Toggle location permission
    const handleLocationToggle = () => {
        if (locationEnabled) {
            // Turn off location
            setLocationEnabled(false);
            setUserLocation(null);
            setLocationError(null);
            localStorage.removeItem('userLocation');
            // Lưu trạng thái user đã TẮT vị trí
            localStorage.setItem('locationDisabled', 'true');

            window.dispatchEvent(new CustomEvent('locationUpdated', {
                detail: null
            }));
        } else {
            // Turn on location
            // Xóa flag "đã tắt"
            localStorage.removeItem('locationDisabled');
            getCurrentLocation();
            setLocationEnabled(true);
        }
    };

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
                <li><a href="/home">Trang chủ</a></li>
                <li><a href="#">Bạn bè</a></li>
                <li><a href="#">Ghi chú</a></li>

                {/* Hiển thị cho USER và SELLER */}
                {(() => {
                    console.log('Sidebar render - User:', user);
                    console.log('Sidebar render - User role:', user?.role);

                    // Hiển thị cho USER (chưa phải SELLER) - Yêu cầu trở thành seller
                    if (user?.role === 'USER') {
                        return (
                            <li>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowSellerRequestModal(true);
                                    }}
                                    className="seller-request-link"
                                >
                                    <span className="menu-icon">🏪</span>
                                    Yêu cầu trở thành người bán hàng
                                </a>
                            </li>
                        );
                    }

                    // Hiển thị cho SELLER - Xem thông tin người bán
                    if (user?.role === 'SELLER') {
                        return (
                            <>
                                <li>
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setShowSellerRequestModal(true);
                                        }}
                                        className="seller-request-link"
                                    >
                                        <span className="menu-icon">✅</span>
                                        Thông tin người bán hàng
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            console.log('🏪 Opening CreateShopModal from Sidebar');
                                            setShowCreateShopModal(true);
                                        }}
                                        className="seller-request-link create-shop-link"
                                    >
                                        <span className="menu-icon">🏪➕</span>
                                        Tạo cửa hàng mới
                                    </a>
                                </li>
                            </>
                        );
                    }

                    return null;
                })()}
            </ul>

            {/* Location Control */}
            <div className="sidebar-location-section">
                <div className="location-header">
                    <span className="location-icon">📍</span>
                    <span className="location-label">Vị trí của bạn</span>
                </div>

                <div className="location-toggle-container">
                    <button
                        className={`location-toggle-btn ${locationEnabled ? 'active' : ''}`}
                        onClick={handleLocationToggle}
                        title={locationEnabled ? 'Tắt truy cập vị trí' : 'Bật truy cập vị trí'}
                    >
                        <span className="toggle-slider"></span>
                        <span className="toggle-text">
                            {locationEnabled ? 'Bật' : 'Tắt'}
                        </span>
                    </button>
                </div>

                {locationEnabled && userLocation && (
                    <div className="location-info">
                        <div className="location-coords">
                            <div className="coord-item">
                                <span className="coord-label">Kinh độ:</span>
                                <span className="coord-value">{userLocation.lng.toFixed(4)}°</span>
                            </div>
                            <div className="coord-item">
                                <span className="coord-label">Vĩ độ:</span>
                                <span className="coord-value">{userLocation.lat.toFixed(4)}°</span>
                            </div>
                        </div>
                        <p className="location-note">
                            ✓ Kết quả tìm kiếm sẽ chính xác hơn
                        </p>
                    </div>
                )}

                {locationError && (
                    <div className="location-error">
                        <span className="error-icon">⚠️</span>
                        <span className="error-text">{locationError}</span>
                    </div>
                )}
            </div>

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
                                ×
                            </button>
                        </div>

                        {/* Hiển thị theo thứ tự ưu tiên */}
                        {loadingRequests ? (
                            /* 1. Loading state */
                            <div className="seller-info-display">
                                <div className="loading-container">
                                    <div className="loading-spinner"></div>
                                    <p>Đang tải thông tin...</p>
                                </div>
                            </div>
                        ) : latestRequest && (latestRequest.status === 'PENDING' || latestRequest.status === 'REJECTED') ? (
                            /* 2. Có request PENDING hoặc REJECTED - Hiển thị CCCD và myRequest */
                            <div className="seller-info-display">
                                <div className={`status-banner status-${latestRequest.status.toLowerCase()}`}>
                                    <span className="status-icon">
                                        {latestRequest.status === 'PENDING' ? '⏳' : '❌'}
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
                                {sellerRequests.length > 1 && (
                                    <div className="all-requests-section">
                                        <button
                                            type="button"
                                            className="view-history-btn"
                                            onClick={() => setShowAllRequests(!showAllRequests)}
                                        >
                                            {showAllRequests ? '▼ Ẩn lịch sử yêu cầu' : '▶ Xem tất cả lịch sử yêu cầu'} ({sellerRequests.length} yêu cầu)
                                        </button>

                                        {showAllRequests && (
                                            <div className="requests-history">
                                                {sellerRequests.map((request, index) => (
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
                                                                <span className="field-label">CCCD:</span>
                                                                <span className="field-value">{request.citizenId}</span>
                                                            </div>
                                                            <div className="request-field">
                                                                <span className="field-label">Ngày tạo:</span>
                                                                <span className="field-value">
                                                                    {new Date(request.createdAt).toLocaleString('vi-VN')}
                                                                </span>
                                                            </div>
                                                            {request.reviewedAt && (
                                                                <div className="request-field">
                                                                    <span className="field-label">Ngày xét duyệt:</span>
                                                                    <span className="field-value">
                                                                        {new Date(request.reviewedAt).toLocaleString('vi-VN')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {request.rejectReason && (
                                                                <div className="request-field">
                                                                    <span className="field-label">Lý do từ chối:</span>
                                                                    <span className="field-value reject-reason">{request.rejectReason}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

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
                                    <span className="success-icon">✅</span>
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
                                {sellerRequests.length > 1 && (
                                    <div className="all-requests-section">
                                        <button
                                            type="button"
                                            className="view-history-btn"
                                            onClick={() => setShowAllRequests(!showAllRequests)}
                                        >
                                            {showAllRequests ? '▼ Ẩn lịch sử yêu cầu' : '▶ Xem tất cả lịch sử yêu cầu'} ({sellerRequests.length} yêu cầu)
                                        </button>

                                        {showAllRequests && (
                                            <div className="requests-history">
                                                {sellerRequests.map((request, index) => (
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
                                                                <span className="field-label">CCCD:</span>
                                                                <span className="field-value">{request.citizenId}</span>
                                                            </div>
                                                            <div className="request-field">
                                                                <span className="field-label">Ngày tạo:</span>
                                                                <span className="field-value">
                                                                    {new Date(request.createdAt).toLocaleString('vi-VN')}
                                                                </span>
                                                            </div>
                                                            {request.reviewedAt && (
                                                                <div className="request-field">
                                                                    <span className="field-label">Ngày xét duyệt:</span>
                                                                    <span className="field-value">
                                                                        {new Date(request.reviewedAt).toLocaleString('vi-VN')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {request.rejectReason && (
                                                                <div className="request-field">
                                                                    <span className="field-label">Lý do từ chối:</span>
                                                                    <span className="field-value reject-reason">{request.rejectReason}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

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

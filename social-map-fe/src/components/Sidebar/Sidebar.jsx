import React, { useState, useEffect } from 'react';
import { createSellerRequest } from '../../services/sellerRequestService';
import './Sidebar.css';

export default function Sidebar() {
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [user, setUser] = useState(null);
    const [showSellerRequestModal, setShowSellerRequestModal] = useState(false);
    const [sellerRequestForm, setSellerRequestForm] = useState({
        citizenId: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Load user info
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        console.log('Sidebar - User from localStorage:', userStr);
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                console.log('Sidebar - Parsed user data:', userData);
                console.log('Sidebar - User role:', userData.role);
                setUser(userData);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        } else {
            console.log('Sidebar - No user data in localStorage');
        }
    }, []);

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

        try {
            setSubmitting(true);

            // Gọi API để tạo seller request
            await createSellerRequest(sellerRequestForm);

            alert('✅ Yêu cầu của bạn đã được gửi thành công! Admin sẽ xem xét và phản hồi sớm nhất.');

            // Reset form
            setSellerRequestForm({
                citizenId: ''
            });

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

                {/* Chỉ hiển thị cho USER (người mua hàng chưa phải SELLER) */}
                {(() => {
                    console.log('Sidebar render - User:', user);
                    console.log('Sidebar render - User role:', user?.role);
                    console.log('Sidebar render - Is USER?', user?.role === 'USER');
                    // Hiển thị cho USER (chưa phải SELLER)
                    return user?.role === 'USER' && (
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
                            <h2>Đăng ký trở thành người bán hàng</h2>
                            <button
                                className="modal-close-btn"
                                onClick={() => setShowSellerRequestModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSellerRequestSubmit} className="seller-request-form">
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
                    </div>
                </div>
            )}
        </nav>
    );
}

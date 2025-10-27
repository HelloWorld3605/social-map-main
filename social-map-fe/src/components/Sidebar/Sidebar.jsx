import React, { useState, useEffect } from 'react';
import './Sidebar.css';

export default function Sidebar() {
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);

    // Check location permission on mount
    useEffect(() => {
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

            window.dispatchEvent(new CustomEvent('locationUpdated', {
                detail: null
            }));
        } else {
            // Request location permission
            getCurrentLocation();
            setLocationEnabled(true);
        }
    };

    return (
        <nav className="side-menu">
            <ul>
                <li><a href="/home">Trang chủ</a></li>
                <li><a href="#">Bạn bè</a></li>
                <li><a href="#">Ghi chú</a></li>
                <li><a href="#">Cài đặt</a></li>
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
        </nav>
    );
}

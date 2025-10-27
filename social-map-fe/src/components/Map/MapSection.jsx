import React, { useEffect, useRef, useState } from 'react';
import './map.css';
import './PopupMap.css';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapContext } from '../../context/MapContext';
import { useLocationSharing } from '../../hooks/useLocationSharing';
import { HANOI_MARKER, generateMarkerPopupHTML } from '../../constants/markers';

mapboxgl.accessToken = 'pk.eyJ1IjoidHVhbmhhaTM2MjAwNSIsImEiOiJjbWdicGFvbW8xMml5Mmpxd3N1NW83amQzIn0.gXamOjOWJNMeQl4eMkHnSg';

export default function MapSection() {
    const { setMap } = useMapContext();
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingText, setLoadingText] = useState('Đang khởi tạo bản đồ...');
    const [showLoading, setShowLoading] = useState(true);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3;
    const mapContainer = useRef(null);
    const mapInstance = useRef(null);
    const markerRef = useRef(null);

    const { handleMarkerMouseDown } = useLocationSharing();

    const loadMapbox = () => {
        setShowLoading(true);
        setShowError(false);
        setLoadingProgress(0);
        setLoadingText('Đang khởi tạo bản đồ...');

        try {
            if (!mapContainer.current) {
                console.error('Map container not found!');
                setErrorMessage('Không tìm thấy container cho bản đồ');
                setShowError(true);
                setShowLoading(false);
                return;
            }

            console.log('Map container found:', mapContainer.current);
            setLoadingProgress(20);
            setLoadingText('Đang kết nối đến Mapbox...');

            const map = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [105.8542, 21.0285], // Hà Nội
                zoom: 12,
                attributionControl: false
            });

            console.log('Map instance created:', map);
            mapInstance.current = map;
            window.mapboxManager = { map };

            // Loading progress events
            map.on('dataloading', () => {
                setLoadingProgress(40);
                setLoadingText('Đang tải dữ liệu bản đồ...');
            });

            map.on('styledata', () => {
                setLoadingProgress(60);
                setLoadingText('Đang tải giao diện...');
            });

            map.on('sourcedata', () => {
                setLoadingProgress(80);
                setLoadingText('Đang hoàn thiện...');
            });

            map.on('load', () => {
                setLoadingProgress(100);
                setLoadingText('Hoàn tất!');

                setTimeout(() => {
                    setShowLoading(false);
                    setRetryCount(0);

                    // Add Hanoi marker using shared constants
                    const hanoiPopupHTML = generateMarkerPopupHTML(HANOI_MARKER);

                    const marker = new mapboxgl.Marker({
                        color: "#EC5E95",
                        scale: 1.2
                    })
                        .setLngLat(HANOI_MARKER.coordinates)
                        .setPopup(new mapboxgl.Popup({
                            closeButton: true,
                            closeOnClick: false,
                            maxWidth: '320px',
                            className: 'custom-popup'
                        }).setHTML(hanoiPopupHTML))
                        .addTo(map);

                    markerRef.current = marker;
                    window.mapboxManager.hanoiMarker = marker;

                    // Add marker drag functionality
                    const markerEl = marker.getElement();
                    markerEl.style.cursor = 'grab';
                    markerEl.dataset.hasListener = 'true';

                    // Use shared marker data
                    const markerData = {
                        name: HANOI_MARKER.name,
                        coordinates: HANOI_MARKER.coordinates,
                        image: HANOI_MARKER.image,
                        description: HANOI_MARKER.description
                    };

                    markerEl.addEventListener('mousedown', (e) => {
                        handleMarkerMouseDown(e, markerEl, markerData);
                    });

                    // Add attribution
                    map.addControl(new mapboxgl.AttributionControl({
                        compact: true
                    }), 'bottom-left');

                    // Dispatch event for other components
                    window.dispatchEvent(new CustomEvent('mapLoaded', {
                        detail: { map }
                    }));
                }, 500);
            });

            map.on('error', (e) => {
                console.error('Mapbox error:', e.error);
                let errorMsg = 'Có lỗi xảy ra khi tải bản đồ.';

                if (e.error?.message) {
                    if (e.error.message.includes('401')) {
                        errorMsg = 'Token Mapbox không hợp lệ. Vui lòng liên hệ quản trị viên.';
                    } else if (e.error.message.includes('network')) {
                        errorMsg = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
                    }
                }

                setErrorMessage(errorMsg);
                setShowError(true);
                setShowLoading(false);
            });

            setMap(map);

        } catch (error) {
            console.error('Map initialization error:', error);
            setErrorMessage('Lỗi khởi tạo bản đồ. Vui lòng thử lại sau.');
            setShowError(true);
            setShowLoading(false);
        }
    };

    const handleRetry = () => {
        if (retryCount < maxRetries) {
            setRetryCount(prev => prev + 1);
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
            setTimeout(loadMapbox, 1000);
        }
    };

    useEffect(() => {
        if (!mapContainer.current) return;
        loadMapbox();

        // Global explore location function
        window.exploreLocation = (locationId) => {
            if (locationId === 'hanoi' && mapInstance.current) {
                mapInstance.current.flyTo({
                    center: [105.8542, 21.0285],
                    zoom: 12,
                    duration: 2000
                });
            }
        };

        // Global focus location function
        window.focusLocation = (lng, lat, name) => {
            if (mapInstance.current) {
                mapInstance.current.flyTo({
                    center: [lng, lat],
                    zoom: 15,
                    duration: 1500
                });
            }
        };

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
            }
        };
    }, []);

    return (
        <section className="map-section" id="map">
            {/* Map container div */}
            <div ref={mapContainer} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />

            {/* Map Loading Overlay */}
            {showLoading && (
                <div className="map-loading-overlay">
                    <div className="map-spinner"></div>
                    <div className="map-loading-text">{loadingText}</div>
                    <div className="map-progress">
                        <div
                            className="map-progress-bar"
                            style={{ width: `${loadingProgress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Map Error Container */}
            {showError && (
                <div className="map-error-container show">
                    <div className="map-error-icon">⚠️</div>
                    <div className="map-error-title">Không thể tải bản đồ</div>
                    <div className="map-error-message">{errorMessage}</div>
                    <button
                        className="map-retry-btn"
                        onClick={handleRetry}
                        disabled={retryCount >= maxRetries}
                    >
                        {retryCount >= maxRetries
                            ? 'Đã hết lần thử'
                            : `Thử lại (${maxRetries - retryCount} lần còn lại)`}
                    </button>
                </div>
            )}
        </section>
    );
}

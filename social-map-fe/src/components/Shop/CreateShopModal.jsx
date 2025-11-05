import React, { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { createShop } from '../../services/shopService';
import { UploadService } from '../../services/UploadService';
import './CreateShopModal.css';

// Use the same working token as MapSection
const MAPBOX_TOKEN = 'pk.eyJ1IjoidHVhbmhhaTM2MjAwNSIsImEiOiJjbWdicGFvbW8xMml5Mmpxd3N1NW83amQzIn0.gXamOjOWJNMeQl4eMkHnSg';
mapboxgl.accessToken = MAPBOX_TOKEN;

export default function CreateShopModal({ isOpen, onClose, onShopCreated }) {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        latitude: 21.0285,
        longitude: 105.8542,
        description: '',
        phoneNumber: '',
        openingTime: '08:00',
        closingTime: '22:00',
        imageShopUrl: [],
        tagIds: []
    });

    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [step, setStep] = useState(1); // 1: Form, 2: Map

    // Track modal open/close
    useEffect(() => {
        console.log('🏪 CreateShopModal isOpen changed:', isOpen);
        if (!isOpen) {
            // Reset step when modal closes
            setStep(1);
        }
    }, [isOpen]);

    // Track step changes
    useEffect(() => {
        console.log('📍 Step changed to:', step);
    }, [step]);

    // Initialize map
    useEffect(() => {
        if (!isOpen || step !== 2) {
            console.log('⏭️ Skipping map init - isOpen:', isOpen, 'step:', step);
            return;
        }

        console.log('🗺️ Starting map initialization...');

        // Wait a bit for DOM to be ready
        const initTimeout = setTimeout(() => {
            const mapContainer = document.getElementById('create-shop-map');
            if (!mapContainer) {
                console.error('❌ Map container not found!');
                console.log('🔍 Searching for container with id: create-shop-map');
                console.log('🔍 All elements with create-shop:', document.querySelectorAll('[id*="create-shop"]'));
                return;
            }

            console.log('✅ Map container found:', mapContainer);
            console.log('📏 Container dimensions:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);

            console.log('🗺️ Initializing Mapbox...');

            const newMap = new mapboxgl.Map({
                container: 'create-shop-map',
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [formData.longitude, formData.latitude],
                zoom: 15
            });

            console.log('✅ Map instance created');

            newMap.on('load', () => {
                console.log('✅ Map loaded successfully!');

                // Add marker
                const newMarker = new mapboxgl.Marker({
                    draggable: true,
                    color: '#10b981' // Green color for shop
                })
                    .setLngLat([formData.longitude, formData.latitude])
                    .addTo(newMap);

                console.log('✅ Marker added to map');

                // Mark this marker as shop creation marker (to exclude from LocationSharing)
                const markerElement = newMarker.getElement();
                markerElement.classList.add('create-shop-marker');
                markerElement.dataset.shopCreation = 'true';
                markerElement.style.cursor = 'move';
                markerElement.style.zIndex = '9999';

                // Update coordinates when marker is dragged
                newMarker.on('dragend', () => {
                    const lngLat = newMarker.getLngLat();
                    console.log('Marker dragged to:', lngLat);
                    setFormData(prev => ({
                        ...prev,
                        latitude: lngLat.lat,
                        longitude: lngLat.lng
                    }));
                });

                newMarker.on('drag', () => {
                    const lngLat = newMarker.getLngLat();
                    setFormData(prev => ({
                        ...prev,
                        latitude: lngLat.lat,
                        longitude: lngLat.lng
                    }));
                });

                // Add click to move marker
                newMap.on('click', (e) => {
                    const { lng, lat } = e.lngLat;
                    console.log('Map clicked at:', lng, lat);
                    newMarker.setLngLat([lng, lat]);
                    setFormData(prev => ({
                        ...prev,
                        latitude: lat,
                        longitude: lng
                    }));
                });

                setMarker(newMarker);
            });

            newMap.on('error', (e) => {
                console.error('❌ Map error:', e);
            });

            setMap(newMap);
        }, 100); // Small delay to ensure DOM is ready

        return () => {
            clearTimeout(initTimeout);
            console.log('🧹 Cleaning up map...');
            if (map) {
                map.remove();
            }
        };
    }, [isOpen, step]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        // Check total images limit
        if (formData.imageShopUrl.length + files.length > 10) {
            setError(`Chỉ có thể tải lên tối đa 10 ảnh. Hiện tại: ${formData.imageShopUrl.length}/10`);
            return;
        }

        setUploadingImage(true);
        setError('');

        try {
            const uploadPromises = files.map(file => {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    throw new Error(`File ${file.name} không phải là hình ảnh`);
                }

                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error(`File ${file.name} quá lớn. Tối đa 5MB`);
                }

                return UploadService.uploadFile(file);
            });

            const uploadedUrls = await Promise.all(uploadPromises);

            setFormData(prev => ({
                ...prev,
                imageShopUrl: [...prev.imageShopUrl, ...uploadedUrls]
            }));

            // Reset file input
            e.target.value = '';
        } catch (err) {
            console.error('Upload failed:', err);
            setError(err.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleRemoveImage = (index) => {
        setFormData(prev => ({
            ...prev,
            imageShopUrl: prev.imageShopUrl.filter((_, i) => i !== index)
        }));
    };

    const handleNextStep = (e) => {
        // Prevent any default behavior
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        console.log('🔄 Moving to step 2...');

        // Validate required fields
        if (!formData.name.trim()) {
            setError('Tên cửa hàng là bắt buộc');
            return;
        }
        if (!formData.address.trim()) {
            setError('Địa chỉ là bắt buộc');
            return;
        }
        if (!formData.phoneNumber.trim()) {
            setError('Số điện thoại là bắt buộc');
            return;
        }

        setError('');
        setStep(2);
        console.log('✅ Moved to step 2 - Map preview');
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError('');

            const shopData = {
                ...formData,
                openingTime: formData.openingTime + ':00',
                closingTime: formData.closingTime + ':00',
                imageShopUrl: formData.imageShopUrl.length > 0 ? formData.imageShopUrl : undefined
            };

            const response = await createShop(shopData);

            if (onShopCreated) {
                onShopCreated(response);
            }

            // Reset form
            setFormData({
                name: '',
                address: '',
                latitude: 21.0285,
                longitude: 105.8542,
                description: '',
                phoneNumber: '',
                openingTime: '08:00',
                closingTime: '22:00',
                imageShopUrl: [],
                tagIds: []
            });
            setStep(1);
            onClose();
        } catch (err) {
            console.error('Failed to create shop:', err);
            setError(err.message || 'Không thể tạo cửa hàng. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleOverlayClick = () => {
        console.log('📍 Overlay clicked, current step:', step);
        // Ask for confirmation if user has entered data
        if (step === 2 || formData.name || formData.address) {
            const confirmed = window.confirm('Bạn có chắc muốn đóng? Các thông tin đã nhập sẽ bị mất.');
            if (confirmed) {
                console.log('✅ User confirmed close');
                onClose();
            } else {
                console.log('❌ User cancelled close');
            }
        } else {
            console.log('✅ Closing modal (no data entered)');
            onClose();
        }
    };

    const handleModalClose = () => {
        console.log('🚪 Close button clicked');
        if (step === 2 || formData.name || formData.address) {
            const confirmed = window.confirm('Bạn có chắc muốn đóng? Các thông tin đã nhập sẽ bị mất.');
            if (confirmed) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    if (!isOpen) {
        console.log('🏪 CreateShopModal not rendering (isOpen = false)');
        return null;
    }

    console.log('🏪 CreateShopModal RENDERING - step:', step, 'isOpen:', isOpen);
    console.log('🏪 FormData:', { name: formData.name, address: formData.address });

    return (
        <div className="create-shop-modal-overlay" onClick={handleOverlayClick}>
            <div className="create-shop-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2>
                        {step === 1 ? '🏪 Tạo cửa hàng mới' : '📍 Chọn vị trí trên bản đồ'}
                    </h2>
                    <button className="modal-close-btn" onClick={handleModalClose}>×</button>
                </div>

                {/* Progress Steps */}
                <div className="progress-steps">
                    <div className={`step ${step >= 1 ? 'active' : ''}`}>
                        <div className="step-number">1</div>
                        <div className="step-label">Thông tin</div>
                    </div>
                    <div className="step-line"></div>
                    <div className={`step ${step >= 2 ? 'active' : ''}`}>
                        <div className="step-number">2</div>
                        <div className="step-label">Vị trí</div>
                    </div>
                </div>

                {error && (
                    <div className="error-banner">
                        <span className="error-icon">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Step 1: Form */}
                {step === 1 && (
                    <div className="modal-body">
                        <div className="form-section">
                            <h3>📋 Thông tin cơ bản</h3>

                            <div className="form-group">
                                <label htmlFor="name">
                                    Tên cửa hàng <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="VD: Quán Cafe Sunny"
                                    maxLength={100}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="address">
                                    Địa chỉ <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="VD: 123 Đường ABC, Quận XYZ, TP.HCM"
                                    maxLength={255}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phoneNumber">
                                    Số điện thoại <span className="required">*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="VD: 0901234567"
                                    pattern="^(0|\+84)(\d{9})$"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Mô tả</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Mô tả về cửa hàng của bạn..."
                                    rows={4}
                                    maxLength={500}
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>⏰ Giờ hoạt động</h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="openingTime">Giờ mở cửa</label>
                                    <input
                                        type="time"
                                        id="openingTime"
                                        name="openingTime"
                                        value={formData.openingTime}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="closingTime">Giờ đóng cửa</label>
                                    <input
                                        type="time"
                                        id="closingTime"
                                        name="closingTime"
                                        value={formData.closingTime}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>🖼️ Hình ảnh cửa hàng</h3>

                            <div className="image-upload-group">
                                <label htmlFor="shop-images" className="btn-upload-image">
                                    {uploadingImage ? (
                                        <>
                                            <span className="upload-spinner"></span>
                                            <span>Đang tải lên...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>📤</span>
                                            <span>Chọn ảnh để tải lên</span>
                                        </>
                                    )}
                                </label>
                                <input
                                    type="file"
                                    id="shop-images"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    disabled={uploadingImage || formData.imageShopUrl.length >= 10}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {formData.imageShopUrl.length > 0 && (
                                <div className="image-list">
                                    {formData.imageShopUrl.map((url, index) => (
                                        <div key={index} className="image-item">
                                            <img src={url} alt={`Shop ${index + 1}`} />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="btn-remove-image"
                                                disabled={uploadingImage}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="form-hint">
                                Tối đa 10 ảnh, mỗi ảnh tối đa 5MB. Đã thêm: {formData.imageShopUrl.length}/10
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 2: Map Preview */}
                {step === 2 && (
                    <div className="modal-body map-step">
                        {console.log('🗺️ Rendering Step 2 - Map Preview')}
                        <div className="map-instructions">
                            <p>
                                📍 Click vào bản đồ hoặc kéo marker để chọn vị trí chính xác cho cửa hàng của bạn
                            </p>
                            <p className="preview-note">
                                ⚠️ Đây là bản đồ xem trước. Vị trí sẽ được pin lên bản đồ thật sau khi bạn nhấn "Xác nhận tạo shop"
                            </p>
                            <div className="coordinates-display">
                                <span>Vĩ độ: <strong>{formData.latitude.toFixed(6)}</strong></span>
                                <span>Kinh độ: <strong>{formData.longitude.toFixed(6)}</strong></span>
                            </div>
                        </div>
                        <div
                            id="create-shop-map"
                            className="create-shop-map"
                        >
                            {/* Map will be initialized here */}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="modal-footer">
                    {step === 1 ? (
                        <>
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={handleModalClose}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="btn-next"
                                onClick={handleNextStep}
                            >
                                Tiếp theo →
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="btn-back"
                                onClick={() => setStep(1)}
                            >
                                ← Quay lại
                            </button>
                            <button
                                type="button"
                                className="btn-submit"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? 'Đang tạo...' : '✓ Xác nhận tạo shop'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}


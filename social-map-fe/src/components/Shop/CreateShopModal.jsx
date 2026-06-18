import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import {
    FaStore,
    FaMapMarkerAlt,
    FaExclamationTriangle,
    FaClipboardList,
    FaClock,
    FaImage,
    FaUpload,
    FaArrowLeft,
    FaArrowRight,
    FaCheck,
    FaTimes
} from 'react-icons/fa';
import { createShop, updateShop } from '../../services/shopService';
import { UploadService } from '../../services/UploadService';
import './CreateShopModal.css';


// Use the same working token as MapSection
const MAPBOX_TOKEN = 'pk.eyJ1IjoidHVhbmhhaTM2MjAwNSIsImEiOiJjbWdicGFvbW8xMml5Mmpxd3N1NW83amQzIn0.gXamOjOWJNMeQl4eMkHnSg';
mapboxgl.accessToken = MAPBOX_TOKEN;

export default function CreateShopModal({ isOpen, onClose, onShopCreated, initialData = null, isEditing = false }) {
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

    const mapRef = useRef(null);
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
                newMarker.on('dragend', async () => {
                    const lngLat = newMarker.getLngLat();
                    console.log('Marker dragged to:', lngLat);
                    const address = await reverseGeocode(lngLat.lng, lngLat.lat);
                    setFormData(prev => ({
                        ...prev,
                        latitude: lngLat.lat,
                        longitude: lngLat.lng,
                        address: address
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
                newMap.on('click', async (e) => {
                    const { lng, lat } = e.lngLat;
                    console.log('Map clicked at:', lng, lat);
                    newMarker.setLngLat([lng, lat]);
                    const address = await reverseGeocode(lng, lat);
                    setFormData(prev => ({
                        ...prev,
                        latitude: lat,
                        longitude: lng,
                        address: address
                    }));
                });
            });

            newMap.on('error', (e) => {
                console.error('❌ Map error:', e);
            });

            mapRef.current = newMap;
        }, 100); // Small delay to ensure DOM is ready

        return () => {
            clearTimeout(initTimeout);
            console.log('🧹 Cleaning up map...');
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [isOpen, step]);

    const reverseGeocode = async (lng, lat) => {
        try {
            const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=vi`
            );
            const data = await res.json();

            if (data.features && data.features.length > 0) {
                return data.features[0].place_name;
            }
            return '';
        } catch (err) {
            console.error('Reverse geocode failed', err);
            return '';
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'openingHour' || name === 'openingMinute') {
            const [hour, minute] = formData.openingTime.split(':');
            const newHour = name === 'openingHour' ? value : hour;
            const newMinute = name === 'openingMinute' ? value : minute;
            setFormData(prev => ({
                ...prev,
                openingTime: `${newHour}:${newMinute}`
            }));
        } else if (name === 'closingHour' || name === 'closingMinute') {
            const [hour, minute] = formData.closingTime.split(':');
            const newHour = name === 'closingHour' ? value : hour;
            const newMinute = name === 'closingMinute' ? value : minute;
            setFormData(prev => ({
                ...prev,
                closingTime: `${newHour}:${newMinute}`
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
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

            if (!formData.address) {
                setError('Vui lòng chọn vị trí trên bản đồ');
                return;
            }

            const shopData = {
                ...formData,
                openingTime: formData.openingTime + ':00',
                closingTime: formData.closingTime + ':00',
                imageShopUrl: formData.imageShopUrl.length > 0 ? formData.imageShopUrl : undefined
            };

            let response;
            if (isEditing && initialData) {
                response = await updateShop(initialData.id, shopData);
            } else {
                response = await createShop(shopData);
            }

            if (onShopCreated) {
                onShopCreated(response);
            }

            // Reset form only when creating
            if (!isEditing) {
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
            }
            setStep(1);
            onClose();
        } catch (err) {
            console.error(`Failed to ${isEditing ? 'update' : 'create'} shop:`, err);
            setError(err.message || `Không thể ${isEditing ? 'cập nhật' : 'tạo'} cửa hàng. Vui lòng thử lại.`);
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

    // Initialize form data when editing
    useEffect(() => {
        if (isEditing && initialData) {
            setFormData({
                name: initialData.name || '',
                address: initialData.address || '',
                latitude: initialData.latitude || 21.0285,
                longitude: initialData.longitude || 105.8542,
                description: initialData.description || '',
                phoneNumber: initialData.phoneNumber || '',
                openingTime: initialData.openingTime ? initialData.openingTime.substring(0, 5) : '08:00',
                closingTime: initialData.closingTime ? initialData.closingTime.substring(0, 5) : '22:00',
                imageShopUrl: initialData.imageShopUrl || [],
                tagIds: initialData.tagIds || []
            });
        } else if (!isEditing) {
            // Reset to default when not editing
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
        }
    }, [isEditing, initialData]);

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
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {step === 1 ? (
                            <>
                                <FaStore style={{ color: '#0f172a' }} />
                                <span>{isEditing ? 'Chỉnh sửa cửa hàng' : 'Tạo cửa hàng mới'}</span>
                            </>
                        ) : (
                            <>
                                <FaMapMarkerAlt style={{ color: '#0f172a' }} />
                                <span>Chọn vị trí trên bản đồ</span>
                            </>
                        )}
                    </h2>
                    <button className="modal-close-btn" onClick={handleModalClose} aria-label="Close">
                        <FaTimes />
                    </button>
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
                        <span className="error-icon">
                            <FaExclamationTriangle />
                        </span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Step 1: Form */}
                {step === 1 && (
                    <div className="modal-body">
                        <div className="form-section">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaClipboardList style={{ color: '#475569' }} />
                                <span>Thông tin cơ bản</span>
                            </h3>

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
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaClock style={{ color: '#475569' }} />
                                <span>Giờ hoạt động</span>
                            </h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Giờ mở cửa</label>
                                    <div className="time-select-group">
                                        <select
                                            name="openingHour"
                                            value={formData.openingTime.split(':')[0]}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            {Array.from({ length: 24 }, (_, i) => (
                                                <option key={i} value={i.toString().padStart(2, '0')}>
                                                    {i.toString().padStart(2, '0')}
                                                </option>
                                            ))}
                                        </select>
                                        <span>:</span>
                                        <select
                                            name="openingMinute"
                                            value={formData.openingTime.split(':')[1]}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            {Array.from({ length: 60 }, (_, i) => (
                                                <option key={i} value={i.toString().padStart(2, '0')}>
                                                    {i.toString().padStart(2, '0')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Giờ đóng cửa</label>
                                    <div className="time-select-group">
                                        <select
                                            name="closingHour"
                                            value={formData.closingTime.split(':')[0]}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            {Array.from({ length: 24 }, (_, i) => (
                                                <option key={i} value={i.toString().padStart(2, '0')}>
                                                    {i.toString().padStart(2, '0')}
                                                </option>
                                            ))}
                                        </select>
                                        <span>:</span>
                                        <select
                                            name="closingMinute"
                                            value={formData.closingTime.split(':')[1]}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            {Array.from({ length: 60 }, (_, i) => (
                                                <option key={i} value={i.toString().padStart(2, '0')}>
                                                    {i.toString().padStart(2, '0')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaImage style={{ color: '#475569' }} />
                                <span>Hình ảnh cửa hàng</span>
                            </h3>

                            <div className="image-upload-group">
                                <label htmlFor="shop-images" className="btn-upload-image">
                                    {uploadingImage ? (
                                        <>
                                            <span className="upload-spinner"></span>
                                            <span>Đang tải lên...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaUpload />
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
                                                aria-label="Remove image"
                                            >
                                                <FaTimes size={12} />
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
                        <div className="map-instructions">
                            <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FaMapMarkerAlt style={{ color: '#166534' }} />
                                <span>Click vào bản đồ hoặc kéo marker để chọn vị trí chính xác cho cửa hàng của bạn</span>
                            </p>
                            <p className="preview-note" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FaExclamationTriangle style={{ color: '#b45309', flexShrink: 0 }} />
                                <span>Đây là bản đồ xem trước. Vị trí sẽ được pin lên bản đồ thật sau khi bạn nhấn "Xác nhận tạo shop"</span>
                            </p>
                            <div className="coordinates-display">
                                <span>Vĩ độ: <strong>{formData.latitude.toFixed(6)}</strong></span>
                                <span>Kinh độ: <strong>{formData.longitude.toFixed(6)}</strong></span>
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="address" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FaMapMarkerAlt />
                                <span>Địa chỉ được xác định</span>
                            </label>
                            <input
                                type="text"
                                id="address"
                                value={formData.address}
                                readOnly
                                placeholder="Click vào bản đồ để chọn vị trí"
                                style={{ background: '#f1f5f9' }}
                            />
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
                                <span>Tiếp theo</span>
                                <FaArrowRight />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="btn-back"
                                onClick={() => setStep(1)}
                            >
                                <FaArrowLeft />
                                <span>Quay lại</span>
                            </button>
                            <button
                                type="button"
                                className="btn-submit"
                                onClick={handleSubmit}
                                disabled={loading || !formData.address}
                            >
                                {loading ? (
                                    <span>{isEditing ? 'Đang cập nhật...' : 'Đang tạo...'}</span>
                                ) : !formData.address ? (
                                    <>
                                        <FaExclamationTriangle />
                                        <span>Chọn vị trí trước</span>
                                    </>
                                ) : (
                                    <>
                                        <FaCheck />
                                        <span>{isEditing ? 'Xác nhận cập nhật' : 'Xác nhận tạo shop'}</span>
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

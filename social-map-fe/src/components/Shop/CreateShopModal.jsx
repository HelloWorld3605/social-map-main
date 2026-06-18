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
    FaCheck,
    FaTimes
} from 'react-icons/fa';
import { createShop, updateShop } from '../../services/shopService';
import { UploadService } from '../../services/UploadService';
import './CreateShopModal.css';

// Use the same working token as MapSection
const MAPBOX_TOKEN = 'pk.eyJ1IjoidHVhbmhhaTM2MjAwNSIsImEiOiJjbWdicGFvbW8xMml5Mmpxd3N1NW83amQzIn0.gXamOjOWJNMeQl4eMkHnSg';
mapboxgl.accessToken = MAPBOX_TOKEN;

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
    const markerRef = useRef(null);
    const isDraggingOrClicking = useRef(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);

    // Initialize map
    useEffect(() => {
        if (!isOpen) {
            console.log('Resource check: skipping map init - isOpen is false');
            return;
        }

        console.log('🗺️ Starting map initialization...');

        // Wait a bit for DOM to be ready
        const initTimeout = setTimeout(() => {
            const mapContainer = document.getElementById('create-shop-map');
            if (!mapContainer) {
                console.error('❌ Map container not found!');
                return;
            }

            console.log('✅ Map container found:', mapContainer);

            const lng = parseFloat(formData.longitude) || 105.8542;
            const lat = parseFloat(formData.latitude) || 21.0285;

            const newMap = new mapboxgl.Map({
                container: 'create-shop-map',
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [lng, lat],
                zoom: 15
            });

            console.log('✅ Map instance created');

            const newMarker = new mapboxgl.Marker({
                draggable: true,
                color: '#10b981' // Green color for shop
            })
                .setLngLat([lng, lat])
                .addTo(newMap);

            markerRef.current = newMarker;
            mapRef.current = newMap;

            // Mark this marker as shop creation marker (to exclude from LocationSharing)
            const markerElement = newMarker.getElement();
            markerElement.classList.add('create-shop-marker');
            markerElement.dataset.shopCreation = 'true';
            markerElement.style.cursor = 'move';
            markerElement.style.zIndex = '9999';

            // Update coordinates when marker is dragged
            newMarker.on('drag', () => {
                isDraggingOrClicking.current = true;
                const lngLat = newMarker.getLngLat();
                setFormData(prev => ({
                    ...prev,
                    latitude: lngLat.lat,
                    longitude: lngLat.lng
                }));
            });

            newMarker.on('dragend', async () => {
                const lngLat = newMarker.getLngLat();
                console.log('Marker dragged to:', lngLat);
                const address = await reverseGeocode(lngLat.lng, lngLat.lat);
                setFormData(prev => ({
                    ...prev,
                    latitude: lngLat.lat,
                    longitude: lngLat.lng,
                    address: address || prev.address
                }));
                isDraggingOrClicking.current = false;
            });

            // Add click to move marker
            newMap.on('click', async (e) => {
                isDraggingOrClicking.current = true;
                const { lng: clickLng, lat: clickLat } = e.lngLat;
                console.log('Map clicked at:', clickLng, clickLat);
                newMarker.setLngLat([clickLng, clickLat]);
                const address = await reverseGeocode(clickLng, clickLat);
                setFormData(prev => ({
                    ...prev,
                    latitude: clickLat,
                    longitude: clickLng,
                    address: address || prev.address
                }));
                isDraggingOrClicking.current = false;
            });
        }, 150); // Small delay to ensure DOM is ready

        return () => {
            clearTimeout(initTimeout);
            console.log('🧹 Cleaning up map...');
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            markerRef.current = null;
        };
    }, [isOpen]);

    // Update map/marker when manual inputs change
    useEffect(() => {
        if (!mapRef.current || !markerRef.current || isDraggingOrClicking.current) return;
        const lat = parseFloat(formData.latitude);
        const lng = parseFloat(formData.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const currentLngLat = markerRef.current.getLngLat();
        if (Math.abs(currentLngLat.lat - lat) > 0.0001 || Math.abs(currentLngLat.lng - lng) > 0.0001) {
            markerRef.current.setLngLat([lng, lat]);
            mapRef.current.flyTo({ center: [lng, lat] });
        }
    }, [formData.latitude, formData.longitude]);

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

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError('');

            if (!formData.address) {
                setError('Vui lòng chọn hoặc điền địa chỉ cửa hàng');
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
            onClose();
        } catch (err) {
            console.error(`Failed to ${isEditing ? 'update' : 'create'} shop:`, err);
            setError(err.message || `Không thể ${isEditing ? 'cập nhật' : 'tạo'} cửa hàng. Vui lòng thử lại.`);
        } finally {
            setLoading(false);
        }
    };

    const handleOverlayClick = () => {
        if (formData.name || formData.address) {
            const confirmed = window.confirm('Bạn có chắc muốn đóng? Các thông tin đã nhập sẽ bị mất.');
            if (confirmed) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    const handleModalClose = () => {
        if (formData.name || formData.address) {
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

    return (
        <div className="create-shop-modal-overlay" onClick={handleOverlayClick}>
            <div className="create-shop-modal animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                {/* Scoped CSS Overrides for Split Horizontal Layout */}
                <style>{`
                    .create-shop-modal {
                        max-width: 1024px !important;
                        width: 95% !important;
                        height: 90vh !important;
                        max-height: 90vh !important;
                    }
                    .create-shop-split-container {
                        display: flex;
                        flex-direction: column;
                        gap: 24px;
                        height: 100%;
                    }
                    @media (min-width: 1024px) {
                        .create-shop-split-container {
                            flex-direction: row;
                            height: calc(90vh - 150px);
                        }
                        .create-shop-form-column {
                            width: 50%;
                            height: 100%;
                            overflow-y: auto;
                            padding-right: 16px;
                        }
                        .create-shop-map-column {
                            width: 50%;
                            display: flex;
                            flex-direction: column;
                            height: 100%;
                        }
                    }
                    .create-shop-form-column::-webkit-scrollbar {
                        width: 4px;
                    }
                    .create-shop-form-column::-webkit-scrollbar-thumb {
                        background: #cbd5e1;
                        border-radius: 10px;
                    }
                    #create-shop-map.create-shop-map.mapboxgl-map {
                        position: relative !important;
                        top: auto !important;
                        left: auto !important;
                        width: 100% !important;
                        height: 100% !important;
                        min-height: 350px;
                        border-radius: 20px;
                        overflow: hidden;
                        flex-grow: 1;
                        margin-top: 8px !important;
                    }
                    @media (min-width: 1024px) {
                        #create-shop-map.create-shop-map.mapboxgl-map {
                            min-height: 400px;
                        }
                    }
                `}</style>

                {/* Header */}
                <div className="modal-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaStore style={{ color: '#0f172a' }} />
                        <span>{isEditing ? 'Chỉnh sửa cửa hàng' : 'Tạo cửa hàng mới'}</span>
                    </h2>
                    <button className="modal-close-btn" onClick={handleModalClose} aria-label="Close">
                        <FaTimes />
                    </button>
                </div>

                {error && (
                    <div className="error-banner">
                        <span className="error-icon">
                            <FaExclamationTriangle />
                        </span>
                        <span>{error}</span>
                    </div>
                )}

                <div className="modal-body">
                    <div className="create-shop-split-container">
                        
                        {/* Left Column: Form Fields */}
                        <div className="create-shop-form-column">
                            
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
                                    <label htmlFor="address" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FaMapMarkerAlt />
                                        <span>Địa chỉ cửa hàng *</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Click vào bản đồ hoặc tự nhập địa chỉ"
                                        required
                                    />
                                </div>

                                {/* Coordinates inputs */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="latitude">Vĩ độ (Latitude) *</label>
                                        <input
                                            type="number"
                                            id="latitude"
                                            name="latitude"
                                            step="any"
                                            min="-90"
                                            max="90"
                                            value={formData.latitude}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="longitude">Kinh độ (Longitude) *</label>
                                        <input
                                            type="number"
                                            id="longitude"
                                            name="longitude"
                                            step="any"
                                            min="-180"
                                            max="180"
                                            value={formData.longitude}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
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

                        {/* Right Column: Map picker */}
                        <div className="create-shop-map-column">
                            <div className="map-instructions" style={{ padding: '8px 12px', marginBottom: '8px' }}>
                                <p style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                    <FaMapMarkerAlt style={{ color: '#166534' }} />
                                    <span>Kéo marker hoặc click bản đồ để chọn vị trí chính xác</span>
                                </p>
                            </div>

                            <div
                                id="create-shop-map"
                                className="create-shop-map"
                            >
                                {/* Map will be initialized here */}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={handleModalClose}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="btn-submit"
                        onClick={handleSubmit}
                        disabled={loading || !formData.address}
                    >
                        {loading ? (
                            <span>{isEditing ? 'Đang cập nhật...' : 'Đang tạo...'}</span>
                        ) : (
                            <>
                                <FaCheck />
                                <span>{isEditing ? 'Xác nhận cập nhật' : 'Xác nhận tạo shop'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

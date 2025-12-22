// Shop Markers Manager for Mapbox
/* eslint-disable no-undef */
import mapboxgl from 'mapbox-gl';
import { getAllShops } from '../services/shopService';

class ShopMarkersManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.shopPopups = new Map();
        this.shops = []; // Store shops array for access

        // Ensure mapboxgl is available
        if (typeof mapboxgl === 'undefined') {
            console.error('Mapbox GL JS is not loaded');
        }
    }

    initialize(map) {
        this.map = map;
        this.loadShops();
    }

    async loadShops() {
        if (!this.map) {
            console.error('Map not initialized');
            return;
        }

        try {
            console.log('Loading shops...');
            const shops = await getAllShops();
            console.log('Shops loaded:', shops);

            this.shops = shops; // Store shops array
            this.clearMarkers();
            this.addShopMarkers(shops);

            // Re-attach LocationSharing events after shops are added
            if (window.locationSharing) {
                console.log('Re-attaching LocationSharing events after shops loaded...');
                setTimeout(() => {
                    window.locationSharing.attachMarkerEventsOnce();
                    window.locationSharing.attachPopupEventsOnce(); // Re-attach popup events (will skip shop popups)
                }, 500);
            }
        } catch (error) {
            console.error('Failed to load shops:', error);
        }
    }

    clearMarkers() {
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
        this.shopPopups.clear();
    }

    addShopMarkers(shops) {
        if (!Array.isArray(shops)) {
            console.error('Shops is not an array:', shops);
            return;
        }

        shops.forEach(shop => {
            this.addShopMarker(shop);
        });

        console.log(`Added ${this.markers.length} shop markers to map`);
    }

    addShopMarker(shop) {
        if (!shop.latitude || !shop.longitude) {
            console.warn('Shop missing coordinates:', shop);
            return;
        }

        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'shop-marker'; // ONLY shop-marker class, NOT create-shop-marker
        // el.setAttribute('draggable', 'true'); // REMOVE HTML5 draggable - conflicts with LocationSharing
        el.setAttribute('data-shop-id', shop.id);
        el.setAttribute('data-shop-name', shop.name);

        // Get status info for marker badge
        const statusInfo = this.getStatusInfo(shop.status);

        el.innerHTML = `
            <div class="shop-marker-container">
                <div class="shop-marker-pin">
                    <div class="shop-marker-icon">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="rgba(255,255,255,0.15)"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            <path d="M3 9h18"></path>
                        </svg>
                    </div>
                    <div class="shop-marker-pulse"></div>
                    <div class="shop-marker-status-dot ${statusInfo.class}"></div>
                </div>
                <div class="shop-marker-label">
                    <span class="shop-marker-name">${shop.name}</span>
                </div>
            </div>
        `;

        // Create popup content
        const popupHTML = this.createShopPopupHTML(shop);

        // Create marker (fixed position, not draggable on map)
        const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'bottom',
            draggable: false // Shop marker is fixed
        })
            .setLngLat([shop.longitude, shop.latitude])
            .setPopup(new mapboxgl.Popup({
                closeButton: true,
                closeOnClick: false,
                maxWidth: '350px',
                className: 'shop-popup'
            }).setHTML(popupHTML))
            .addTo(this.map);

        this.markers.push(marker);
        this.shopPopups.set(shop.id, marker);

        // Handle active state when popup opens/closes
        const popup = marker.getPopup();
        popup.on('open', () => {
            this.setActiveMarker(shop.id);
        });
        popup.on('close', () => {
            el.classList.remove('active');
        });


        // DISABLED: Let LocationSharing handle drag & drop functionality
        // this.setupShopDragAndDrop(el, shop, marker);
    }

    // Set active marker and remove active from others
    setActiveMarker(shopId) {
        // Remove active class from all markers
        document.querySelectorAll('.shop-marker.active').forEach(m => {
            m.classList.remove('active');
        });

        // Add active class to selected marker
        const activeMarker = document.querySelector(`.shop-marker[data-shop-id="${shopId}"]`);
        if (activeMarker) {
            activeMarker.classList.add('active');
        }
    }

    // Note: Drag & drop functionality is now handled by LocationSharing
    // setupShopDragAndDrop has been removed to avoid unused code warnings

    createDragImage(shop) {
        const dragImage = document.createElement('div');
        dragImage.className = 'shop-drag-preview';
        dragImage.innerHTML = `
            <div class="drag-preview-content">
                <div class="drag-icon">🏪</div>
                <div class="drag-text">
                    <div class="drag-name">${shop.name}</div>
                    <div class="drag-address">${shop.address || ''}</div>
                </div>
            </div>
        `;
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        dragImage.style.left = '-1000px';
        return dragImage;
    }

    createShopPopupHTML(shop) {
        const images = shop.imageShopUrl && shop.imageShopUrl.length > 0
            ? shop.imageShopUrl
            : [];

        const statusText = this.getStatusText(shop.status);
        const statusClass = shop.status.toLowerCase();

        // Generate image carousel HTML (without status badge inside)
        const imageHTML = images.length > 0 ? `
            <div class="shop-popup-image-container">
                <div class="shop-image-carousel" data-shop-id="${shop.id}">
                    ${images.map((img, index) => `
                        <img src="${img}" alt="${shop.name} - Image ${index + 1}" 
                             class="shop-popup-image ${index === 0 ? 'active' : ''}" 
                             data-index="${index}" />
                    `).join('')}
                </div>
                ${images.length > 1 ? `
                    <button class="carousel-nav carousel-prev" onclick="window.shopCarousel.prev('${shop.id}')">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <button class="carousel-nav carousel-next" onclick="window.shopCarousel.next('${shop.id}')">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                    <div class="carousel-indicators">
                        ${images.map((_, index) => `
                            <span class="indicator ${index === 0 ? 'active' : ''}" 
                                  onclick="window.shopCarousel.goTo('${shop.id}', ${index})"></span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        ` : '';

        return `
            <div class="shop-popup-content">
                <div class="shop-popup-header">
                    ${imageHTML}
                    <div class="shop-status-badge ${statusClass}">
                        ${statusText}
                    </div>
                </div>
                
                <div class="shop-popup-body">
                    <h3 class="shop-popup-title">${shop.name}</h3>
                    
                    <div class="shop-popup-info">
                        <div class="info-item">
                            <span class="info-icon">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            </span>
                            <span class="info-text">${shop.address}</span>
                        </div>
                        
                        ${shop.phoneNumber ? `
                            <div class="info-item">
                                <span class="info-icon">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                    </svg>
                                </span>
                                <a href="tel:${shop.phoneNumber}" class="info-text phone-link">${shop.phoneNumber}</a>
                            </div>
                        ` : ''}
                        
                        ${shop.openingTime && shop.closingTime ? `
                            <div class="info-item">
                                <span class="info-icon">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                </span>
                                <span class="info-text">${shop.openingTime} - ${shop.closingTime}</span>
                            </div>
                        ` : ''}
                        
                        ${shop.rating > 0 ? `
                            <div class="info-item">
                                <span class="info-icon rating-icon">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="#fbbf24" stroke="#fbbf24" stroke-width="1">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </svg>
                                </span>
                                <span class="info-text">${shop.rating.toFixed(1)} (${shop.reviewCount || 0} đánh giá)</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${shop.description ? `
                        <p class="shop-popup-description">${shop.description}</p>
                    ` : ''}
                    
                    ${shop.tags && shop.tags.length > 0 ? `
                        <div class="shop-popup-tags">
                            ${shop.tags.map(tag => `<span class="shop-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="shop-popup-actions">
                        <button class="btn-view-shop" onclick="viewShopDetail('${shop.id}')">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            Xem chi tiết
                        </button>
                        <button class="btn-get-directions" onclick="getDirections(${shop.latitude}, ${shop.longitude})">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                            </svg>
                            Chỉ đường
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusText(status) {
        const statusMap = {
            'OPEN': 'Đang mở cửa',
            'CLOSED': 'Đã đóng cửa',
            'TEMPORARILY_CLOSED': 'Tạm nghỉ'
        };
        return statusMap[status] || status;
    }

    getStatusInfo(status) {
        const statusMap = {
            'OPEN': { class: 'status-open', text: 'Đang mở cửa' },
            'CLOSED': { class: 'status-closed', text: 'Đã đóng cửa' },
            'TEMPORARILY_CLOSED': { class: 'status-temporarily-closed', text: 'Tạm nghỉ' }
        };
        return statusMap[status] || { class: 'status-unknown', text: status };
    }

    focusOnShop(shopId) {
        const marker = this.shopPopups.get(shopId);
        if (marker && this.map) {
            const lngLat = marker.getLngLat();
            this.map.flyTo({
                center: [lngLat.lng, lngLat.lat],
                zoom: 16,
                duration: 1500
            });
            marker.togglePopup();
        }
    }

    focusShop(shopId) {
        const marker = this.shopPopups.get(shopId);
        if (marker) {
            this.map.flyTo({
                center: marker.getLngLat(),
                zoom: 16,
                duration: 1500
            });
            marker.togglePopup();
        } else {
            console.warn('Shop marker not found for ID:', shopId);
        }
    }

    refresh() {
        this.loadShops();
    }
}

// Global functions for popup buttons
window.viewShopDetail = function(shopId) {
    console.log('Viewing shop:', shopId);
    // Navigate to shop detail page or show modal
    window.location.href = `/shop/${shopId}`;
};

window.getDirections = function(lat, lng) {
    console.log('Getting directions to:', lat, lng);
    // Open Google Maps or use Mapbox Directions API
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
};

// Global carousel controller
window.shopCarousel = {
    currentIndexes: new Map(), // Track current index for each shop

    goTo(shopId, index) {
        const carousel = document.querySelector(`.shop-image-carousel[data-shop-id="${shopId}"]`);
        if (!carousel) return;

        const images = carousel.querySelectorAll('.shop-popup-image');
        const indicators = carousel.parentElement.querySelectorAll('.carousel-indicators .indicator');

        if (images.length === 0) return;

        // Remove active class from all
        images.forEach(img => img.classList.remove('active'));
        indicators.forEach(ind => ind.classList.remove('active'));

        // Add active class to current
        images[index].classList.add('active');
        if (indicators[index]) {
            indicators[index].classList.add('active');
        }

        // Update current index
        this.currentIndexes.set(shopId, index);
    },

    next(shopId) {
        const carousel = document.querySelector(`.shop-image-carousel[data-shop-id="${shopId}"]`);
        if (!carousel) return;

        const images = carousel.querySelectorAll('.shop-popup-image');
        const currentIndex = this.currentIndexes.get(shopId) || 0;
        const nextIndex = (currentIndex + 1) % images.length;

        this.goTo(shopId, nextIndex);
    },

    prev(shopId) {
        const carousel = document.querySelector(`.shop-image-carousel[data-shop-id="${shopId}"]`);
        if (!carousel) return;

        const images = carousel.querySelectorAll('.shop-popup-image');
        const currentIndex = this.currentIndexes.get(shopId) || 0;
        const prevIndex = (currentIndex - 1 + images.length) % images.length;

        this.goTo(shopId, prevIndex);
    }
};

// Export singleton instance
export const shopMarkersManager = new ShopMarkersManager();
export default shopMarkersManager;

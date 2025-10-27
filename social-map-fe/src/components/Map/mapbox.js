// Enhanced Mapbox initialization with error handling and loading states
class MapboxManager {
    constructor() {
        this.accessToken = 'pk.eyJ1IjoidHVhbmhhaTM2MjAwNSIsImEiOiJjbWdicGFvbW8xMml5Mmpxd3N1NW83amQzIn0.gXamOjOWJNMeQl4eMkHnSg';
        this.map = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.loadingOverlay = document.getElementById('mapLoadingOverlay');
        this.errorContainer = document.getElementById('mapErrorContainer');
        this.loadingText = document.getElementById('mapLoadingText');
        this.progressBar = document.getElementById('mapProgressBar');
        this.retryBtn = document.getElementById('mapRetryBtn');
        this.errorMessage = document.getElementById('mapErrorMessage');

        this.init();
    }

    init() {
        // Set up retry button
        if (this.retryBtn) {
            this.retryBtn.addEventListener('click', () => this.retryLoad());
        }

        // Check if Mapbox is available
        if (typeof mapboxgl === 'undefined') {
            this.showError('Không thể tải thư viện Mapbox. Vui lòng kiểm tra kết nối mạng.');
            return;
        }

        this.loadMap();
    }

    updateProgress(percentage) {
        if (this.progressBar) {
            this.progressBar.style.width = `${percentage}%`;
        }
    }

    updateLoadingText(text) {
        if (this.loadingText) {
            this.loadingText.textContent = text;
        }
    }

    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('hidden');
        }
        if (this.errorContainer) {
            this.errorContainer.classList.remove('show');
        }
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('hidden');
        }
    }

    showError(message = 'Có lỗi xảy ra khi tải bản đồ. Vui lòng thử lại.') {
        this.hideLoading();

        if (this.errorMessage) {
            this.errorMessage.textContent = message;
        }

        if (this.errorContainer) {
            this.errorContainer.classList.add('show');
        }

        // Disable retry button if max retries reached
        if (this.retryBtn) {
            if (this.retryCount >= this.maxRetries) {
                this.retryBtn.disabled = true;
                this.retryBtn.textContent = 'Đã hết lần thử';
            } else {
                this.retryBtn.disabled = false;
                this.retryBtn.textContent = `Thử lại (${this.maxRetries - this.retryCount} lần còn lại)`;
            }
        }
    }

    retryLoad() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`Retry attempt ${this.retryCount}/${this.maxRetries}`);

            // Clear any existing map
            if (this.map) {
                this.map.remove();
                this.map = null;
            }

            // Wait a bit before retrying
            setTimeout(() => {
                this.loadMap();
            }, 1000);
        }
    }

    loadMap() {
        this.showLoading();
        this.updateProgress(0);
        this.updateLoadingText('Đang khởi tạo bản đồ...');

        try {
            mapboxgl.accessToken = this.accessToken;

            this.updateProgress(20);
            this.updateLoadingText('Đang kết nối đến Mapbox...');

            this.map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [105.8542, 21.0285], // Hà Nội
                zoom: 12,
                attributionControl: false // We'll add it back later
            });

            this.setupMapEvents();

        } catch (error) {
            console.error('Map initialization error:', error);
            this.showError('Lỗi khởi tạo bản đồ. Vui lòng thử lại sau.');
        }
    }

    setupMapEvents() {
        // Loading progress
        this.map.on('dataloading', () => {
            this.updateProgress(40);
            this.updateLoadingText('Đang tải dữ liệu bản đồ...');
        });

        // Style loading
        this.map.on('styledata', () => {
            this.updateProgress(60);
            this.updateLoadingText('Đang tải giao diện...');
        });

        // Source data loading
        this.map.on('sourcedata', () => {
            this.updateProgress(80);
            this.updateLoadingText('Đang hoàn thiện...');
        });

        // Map fully loaded
        this.map.on('load', () => {
            this.updateProgress(100);
            this.updateLoadingText('Hoàn tất!');

            setTimeout(() => {
                this.hideLoading();
                this.onMapReady();
            }, 500);
        });

        // Error handling
        this.map.on('error', (e) => {
            console.error('Mapbox error:', e.error);
            let errorMsg = 'Có lỗi xảy ra khi tải bản đồ.';

            if (e.error?.message) {
                if (e.error.message.includes('401')) {
                    errorMsg = 'Token Mapbox không hợp lệ. Vui lòng liên hệ quản trị viên.';
                } else if (e.error.message.includes('network')) {
                    errorMsg = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
                } else if (e.error.message.includes('style')) {
                    errorMsg = 'Không thể tải style bản đồ. Đang thử style khác...';
                    this.fallbackToBasicStyle();
                    return;
                }
            }

            this.showError(errorMsg);
        });

        // Network error fallback
        this.map.on('styleimagemissing', () => {
            console.warn('Style image missing, continuing with basic rendering');
        });
    }

    fallbackToBasicStyle() {
        console.log('Falling back to basic style');
        try {
            this.map.setStyle('mapbox://styles/mapbox/basic-v9');
        } catch (error) {
            console.error('Fallback style also failed:', error);
            this.showError('Không thể tải bất kỳ style bản đồ nào. Vui lòng thử lại sau.');
        }
    }

    onMapReady() {
        console.log('Map loaded successfully');
        this.retryCount = 0; // Reset retry count on success

        // Add navigation controls
        // this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

        // Add Hanoi marker with enhanced image popup
        try {
            console.log('Creating enhanced Hanoi popup...');

            const hanoiPopupHTML = `
                <div class="location-popup">
                    <div class="popup-image-container">
                        <img src="image/hanoi.jpg" alt="Hà Nội" class="popup-image" loading="lazy">
                        <div class="popup-image-overlay">
                            <span class="popup-location-tag">Hà Nội</span>
                        </div>
                    </div>
                    <div class="popup-content-body">
                        <h3 class="popup-title">Hà Nội</h3>
                        <p class="popup-description">Thủ đô của Việt Nam, nơi giao thoa giữa lịch sử và hiện đại</p>
                        <div class="popup-stats">
                            <div class="popup-stat">
                                <span class="stat-label">Dân số:</span>
                                <span class="stat-value">8.1M</span>
                            </div>
                            <div class="popup-stat">
                                <span class="stat-label">Diện tích:</span>
                                <span class="stat-value">3,359 km²</span>
                            </div>
                        </div>
                        <button class="popup-explore-btn" onclick="exploreLocation('hanoi')">
                            🗺️ Khám phá
                        </button>
                    </div>
                </div>
            `;

            console.log('Popup HTML created:', hanoiPopupHTML.length, 'characters');

            const marker = new mapboxgl.Marker({
                color: "#EC5E95",
                scale: 1.2
            })
                .setLngLat([105.8542, 21.0285])
                .setPopup(new mapboxgl.Popup({
                    closeButton: true,
                    closeOnClick: false,
                    maxWidth: '320px',
                    className: 'custom-popup'
                }).setHTML(hanoiPopupHTML))
                .addTo(this.map);

            console.log('Enhanced Hanoi marker added successfully');

            // Store marker reference for location sharing
            this.hanoiMarker = marker;

            // Add click event only if not dragging (to avoid conflict with location sharing)
            marker.getElement().addEventListener('click', (e) => {
                // Only handle click if not being dragged by location sharing
                if (!window.locationSharing || !window.locationSharing.isDragging) {
                    console.log('Hanoi marker clicked!');
                } else {
                    e.stopPropagation();
                    e.preventDefault();
                }
            });

        } catch (error) {
            console.error('Error adding Hanoi marker:', error);
        }

        // Add custom attribution
        this.map.addControl(new mapboxgl.AttributionControl({
            compact: true
        }), 'bottom-left');

        // Dispatch custom event for other scripts to initialize LocationSharing
        window.dispatchEvent(new CustomEvent('mapLoaded', {
            detail: { map: this.map }
        }));
    }
}

// Global function for explore location button
window.exploreLocation = function (locationId) {
    switch (locationId) {
        case 'hanoi':
            // Zoom to location and show more details
            if (window.mapboxManager && window.mapboxManager.map) {
                window.mapboxManager.map.flyTo({
                    center: [105.8542, 21.0285],
                    zoom: 12,
                    duration: 2000
                });
            }

            // You can add more actions here like:
            // - Show detailed information panel
            // - Load nearby locations
            // - Open photo gallery
            console.log('Exploring Hanoi...');

            // Optional: Show notification
            if (typeof showNotification === 'function') {
                showNotification('Đang khám phá Hà Nội...', 'info');
            }
            break;

        default:
            console.log('Exploring location:', locationId);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        window.mapboxManager = new MapboxManager();
    }, 100);
});

// Fallback for older browsers or if DOM event doesn't fire
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.mapboxManager) {
            window.mapboxManager = new MapboxManager();
        }
    });
} else {
    if (!window.mapboxManager) {
        window.mapboxManager = new MapboxManager();
    }
}




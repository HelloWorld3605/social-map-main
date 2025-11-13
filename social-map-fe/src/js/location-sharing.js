class LocationSharing {
    constructor(map) {
        this.map = map;
        this.isDragging = false;
        this.draggedMarker = null;
        this.draggedPopup = null;
        this.dragPreview = null;

        // Delay Detection Pattern properties
        this.clickStartTime = 0;
        this.clickThreshold = 150; // 150ms để phân biệt click vs drag
        this.dragStarted = false;
        this.dragThreshold = 5; // 5px movement to trigger drag

        this.init();
    }

    init() {
        this.attachMarkerEventsOnce();
        this.attachPopupEventsOnce();
        this.setupGlobalDragEvents();
    }


    // 🧩 Đảm bảo mỗi marker chỉ gắn 1 lần
    attachMarkerEventsOnce() {
        const attachEvents = () => {
            const markers = document.querySelectorAll('.mapboxgl-marker');

            if (!markers.length) {
                console.log('[LocationSharing] Waiting for markers...');
                return setTimeout(attachEvents, 800);
            }

            let shopMarkerCount = 0;
            let regularMarkerCount = 0;
            let skippedCount = 0;

            markers.forEach((markerEl, index) => {
                // Log marker details
                console.log(`[LocationSharing] Checking marker ${index}:`, {
                    classes: markerEl.className,
                    shopCreation: markerEl.dataset.shopCreation,
                    shopId: markerEl.getAttribute('data-shop-id'),
                    shopName: markerEl.getAttribute('data-shop-name')
                });

                // Skip ONLY shop creation markers (in modal), but allow shop markers (on map)
                if (markerEl.dataset.shopCreation === 'true' ||
                    markerEl.classList.contains('create-shop-marker')) {
                    console.log('[LocationSharing] Skipping create-shop marker (modal)');
                    skippedCount++;
                    return;
                }

                if (markerEl.dataset.hasListener === 'true') {
                    console.log('[LocationSharing] Marker already has listener, skipping');
                    return;
                }

                markerEl.dataset.hasListener = 'true';
                markerEl.dataset.markerId = `marker-${index}`;
                markerEl.style.cursor = 'grab';
                markerEl.style.pointerEvents = 'auto';

                markerEl.addEventListener('mousedown', (e) => this.startDrag(e, markerEl), { passive: false });

                // Count marker types
                if (markerEl.classList.contains('shop-marker')) {
                    shopMarkerCount++;
                    console.log(`[LocationSharing] ✅ Attached drag to SHOP marker: ${markerEl.getAttribute('data-shop-name')}`);
                } else {
                    regularMarkerCount++;
                    console.log(`[LocationSharing] ✅ Attached drag to REGULAR marker`);
                }
            });

            console.log(`[LocationSharing] Summary: Total=${markers.length}, Shop=${shopMarkerCount}, Regular=${regularMarkerCount}, Skipped=${skippedCount}`);
        };

        attachEvents();
    }

    attachPopupEventsOnce() {
        const attachEvents = () => {
            const popups = document.querySelectorAll('.mapboxgl-popup');

            if (!popups.length) {
                console.log('[LocationSharing] Waiting for popups...');
                return setTimeout(attachEvents, 800);
            }

            let attachedCount = 0;
            let skippedShopCount = 0;

            popups.forEach((popupEl, index) => {
                if (popupEl.dataset.hasListener === 'true') return; // ⚡ tránh gắn lại
                popupEl.dataset.hasListener = 'true';
                popupEl.dataset.popupId = `popup-${index}`;

                // SKIP shop popups - they should NOT be draggable
                if (popupEl.classList.contains('shop-popup')) {
                    console.log('[LocationSharing] Skipping shop popup (should not be draggable)');
                    skippedShopCount++;
                    return;
                }

                // Attach drag event to popup content ONLY for non-shop popups
                const popupContent = popupEl.querySelector('.mapboxgl-popup-content');
                if (popupContent) {
                    popupContent.style.cursor = 'grab';
                    popupContent.addEventListener('mousedown', (e) => this.startDragPopup(e, popupEl), { capture: true });
                    attachedCount++;
                }
            });

            console.log(`[LocationSharing] Attached drag events to ${attachedCount} popups (skipped ${skippedShopCount} shop popups)`);
        };

        attachEvents();
    }

    setupGlobalDragEvents() {
        document.addEventListener('mousedown', (e) => {
            const markerEl = e.target.closest('.mapboxgl-marker');
            if (markerEl) {
                // Skip ONLY shop creation markers (in modal)
                if (markerEl.dataset.shopCreation === 'true' ||
                    markerEl.classList.contains('create-shop-marker')) {
                    return; // Let the modal marker handle its own events
                }
                this.startDrag(e, markerEl);
            }
        });
        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('mouseup', (e) => this.stopDrag(e));
    }

    startDrag(e, markerEl) {
        e.preventDefault();
        e.stopPropagation();

        console.log('startDrag: called for marker');

        if (this.isDragging) return; // tránh double-trigger

        // Record click start time
        this.clickStartTime = Date.now();
        this.dragStarted = false;

        // Set up drag detection with delay
        this.setupDragDetection(e, markerEl);
    }

    setupDragDetection(e, markerEl) {
        const startX = e.clientX;
        const startY = e.clientY;
        let hasMoved = false;
        let isClick = true;

        const onMouseMove = (moveEvent) => {
            const deltaX = Math.abs(moveEvent.clientX - startX);
            const deltaY = Math.abs(moveEvent.clientY - startY);
            const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

            console.log('onMouseMove: distance', distance);

            // Nếu di chuyển vượt ngưỡng, bắt đầu kéo
            if (distance > this.dragThreshold && !this.dragStarted) {
                console.log('initiating drag');
                this.initiateDrag(moveEvent, markerEl);
                hasMoved = true;
                isClick = false;
            }

            if (this.dragStarted) {
                this.onDrag(moveEvent);
            }
        };

        const onMouseUp = (upEvent) => {
            const clickDuration = Date.now() - this.clickStartTime;

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            // Nếu không di chuyển và click nhanh → xem là click popup
            if (!hasMoved && clickDuration < this.clickThreshold && isClick) {
                this.handleMarkerClick(markerEl);
            }
            // Nếu đã kéo → xử lý thả
            else if (this.dragStarted) {
                this.stopDrag(upEvent);
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }


    initiateDrag(e, markerEl) {
        this.dragStarted = true;
        this.toggleMapInteractions(false);

        // Check if this is a shop marker
        if (markerEl.classList.contains('shop-marker')) {
            const shopId = markerEl.getAttribute('data-shop-id');
            const shopName = markerEl.getAttribute('data-shop-name');

            // Get full shop data from window.shopMarkersManager if available
            let shopData = null;
            if (window.shopMarkersManager && window.shopMarkersManager.shopPopups) {
                const marker = window.shopMarkersManager.shopPopups.get(shopId);
                if (marker) {
                    const lngLat = marker.getLngLat();

                    // Try to get full shop data from shops array
                    let fullShopData = null;
                    if (window.shopMarkersManager.shops) {
                        fullShopData = window.shopMarkersManager.shops.find(s => s.id === shopId);
                    }

                    // Get image from shop data or use default
                    const shopImage = (fullShopData && fullShopData.imageShopUrl && fullShopData.imageShopUrl.length > 0)
                        ? fullShopData.imageShopUrl[0]
                        : '/icons/location.svg';

                    shopData = {
                        name: shopName || 'Shop',
                        coordinates: [lngLat.lng, lngLat.lat],
                        image: shopImage,
                        description: fullShopData ? (fullShopData.address || 'Cửa hàng') : 'Cửa hàng',
                        type: 'shop',
                        shopId: shopId,
                        // Additional shop info for rich display
                        phoneNumber: fullShopData?.phoneNumber,
                        rating: fullShopData?.rating,
                        status: fullShopData?.status
                    };
                }
            }

            // Fallback if can't get from manager
            if (!shopData) {
                shopData = {
                    name: shopName || 'Shop',
                    coordinates: [0, 0],
                    image: '/icons/location.svg',
                    description: 'Cửa hàng',
                    type: 'shop',
                    shopId: shopId
                };
            }

            this.draggedMarker = shopData;
            console.log('initiateDrag: shop marker', this.draggedMarker);
        } else {
            // Skip non-shop markers
            return;
        }

        this.isDragging = true;
        document.body.style.cursor = 'grabbing';
        markerEl.style.transform += ' scale(1.1)';

        this.createDragPreview(e);
        this.highlightChats(true);
        console.log(`[LocationSharing] Dragging started for ${this.draggedMarker.name}`);
    }

    startDragPopup(e, popupEl) {
        e.preventDefault();
        e.stopPropagation();

        if (this.isDragging) return; // tránh double-trigger

        // Record click start time
        this.clickStartTime = Date.now();
        this.dragStarted = false;

        // Set up drag detection with delay
        this.setupDragDetectionPopup(e, popupEl);
    }

    setupDragDetectionPopup(e, popupEl) {
        const startX = e.clientX;
        const startY = e.clientY;
        let hasMoved = false;
        let isClick = true;

        const onMouseMove = (moveEvent) => {
            const deltaX = Math.abs(moveEvent.clientX - startX);
            const deltaY = Math.abs(moveEvent.clientY - startY);
            const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

            // Nếu di chuyển vượt ngưỡng, bắt đầu kéo
            if (distance > this.dragThreshold && !this.dragStarted) {
                this.initiateDragPopup(moveEvent, popupEl);
                hasMoved = true;
                isClick = false;
            }

            if (this.dragStarted) {
                this.onDrag(moveEvent);
            }
        };

        const onMouseUp = (upEvent) => {
            const clickDuration = Date.now() - this.clickStartTime;

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            // Nếu không di chuyển và click nhanh → xem là click
            if (!hasMoved && clickDuration < this.clickThreshold && isClick) {
                // Do nothing for popup click
            }
            // Nếu đã kéo → xử lý thả
            else if (this.dragStarted) {
                this.stopDrag(upEvent);
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    initiateDragPopup(e, popupEl) {
        this.dragStarted = true;
        this.toggleMapInteractions(false);

        // Extract data from popup
        this.draggedPopup = this.extractPopupData();

        this.isDragging = true;
        document.body.style.cursor = 'grabbing';
        popupEl.style.transform += ' scale(1.05)';

        this.createDragPreviewPopup(e);
        this.highlightChats(true);
        console.log(`[LocationSharing] Dragging started for popup ${this.draggedPopup.name}`);
    }

    extractPopupData() {
        // No longer used since fixed markers are removed
        return null;
    }

    handleMarkerClick(markerEl) {
        // Show popup instead of drag
        console.log('[LocationSharing] Showing marker popup');

        // Find the marker object and trigger its popup
        const marker = this.findMarkerFromElement(markerEl);
        if (marker && marker.getPopup()) {
            marker.togglePopup();
        }
    }

    findMarkerFromElement(element) {
        // Only check shop markers now
        if (window.shopMarkersManager && window.shopMarkersManager.shopPopups) {
            for (const [, marker] of window.shopMarkersManager.shopPopups) {
                if (marker.getElement() === element) {
                    return marker;
                }
            }
        }
        return null;
    }

    onDrag(e) {
        if (!this.isDragging || !this.dragPreview) return;

        this.dragPreview.style.left = `${e.clientX + 12}px`;
        this.dragPreview.style.top = `${e.clientY - 32}px`;

        const zone = document.elementFromPoint(e.clientX, e.clientY)?.closest('.chat-window, .side-chat');
        document.querySelectorAll('.location-drop-active').forEach(el => el.classList.remove('location-drop-active'));
        if (zone) zone.classList.add('location-drop-active');
    }

    stopDrag(e) {
        if (!this.isDragging) return;

        const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
        const chatWindow = dropTarget?.closest('.chat-window');
        const sideChat = dropTarget?.closest('.side-chat');

        console.log('stopDrag: dropTarget', dropTarget);
        console.log('stopDrag: chatWindow', chatWindow);
        console.log('stopDrag: sideChat', sideChat);

        if (chatWindow) {
            const friendId = chatWindow.dataset.friendId;
            console.log('stopDrag: friendId from chatWindow', friendId);
            this.shareLocation(friendId, 'chat-window');
        } else if (sideChat) {
            const activeFriend = document.querySelector('.friend-item.active');
            console.log('stopDrag: activeFriend', activeFriend);
            if (activeFriend) {
                const friendId = activeFriend.dataset.friend;
                console.log('stopDrag: friendId from activeFriend', friendId);
                this.shareLocation(friendId, 'side-chat');
            } else {
                this.showMessage('Vui lòng chọn người bạn để chia sẻ vị trí', 'warning');
            }
        }

        this.cleanupDrag();
    }

    cleanupDrag() {
        this.isDragging = false;
        this.draggedMarker = null;
        this.draggedPopup = null;
        this.dragStarted = false;
        this.clickStartTime = 0;

        this.toggleMapInteractions(true);
        document.body.style.cursor = '';

        if (this.dragPreview) this.dragPreview.remove();
        this.dragPreview = null;

        document.querySelectorAll('.location-drop-zone, .location-drop-active')
            .forEach(el => el.classList.remove('location-drop-zone', 'location-drop-active'));

        document.querySelectorAll('.mapboxgl-marker').forEach(el => {
            el.style.transform = el.style.transform.replace(' scale(1.1)', '');
            el.style.cursor = 'grab';
        });

        document.querySelectorAll('.mapboxgl-popup').forEach(el => {
            el.style.transform = el.style.transform.replace(' scale(1.05)', '');
        });

        console.log('[LocationSharing] Drag cleanup completed');
    }

    toggleMapInteractions(enable) {
        const m = this.map;
        if (!m) return;
        const fn = enable ? 'enable' : 'disable';
        m.dragPan[fn]();
        m.scrollZoom[fn]();
        m.doubleClickZoom[fn]();
        m.touchZoomRotate[fn]();
        m.boxZoom[fn]();
    }

    createDragPreview(e) {
        const { name, image } = this.draggedMarker;
        const preview = document.createElement('div');
        preview.className = 'location-drag-preview';
        preview.innerHTML = `
            <div class="drag-preview-content">
                <img src="${image}" alt="${name}" class="drag-preview-image">
                <div class="drag-preview-info"><span>${name}</span></div>
            </div>`;
        document.body.appendChild(preview);
        this.dragPreview = preview;
        this.onDrag(e);
    }

    createDragPreviewPopup(e) {
        const { name, image } = this.draggedPopup;
        const preview = document.createElement('div');
        preview.className = 'location-drag-preview';
        preview.innerHTML = `
            <div class="drag-preview-content">
                <img src="${image}" alt="${name}" class="drag-preview-image">
                <div class="drag-preview-info"><span>${name}</span></div>
            </div>`;
        document.body.appendChild(preview);
        this.dragPreview = preview;
        this.onDrag(e);
    }

    highlightChats(state) {
        document.querySelectorAll('.chat-window, .side-chat')
            .forEach(el => el.classList.toggle('location-drop-zone', state));
    }

    shareLocation(friendId, type) {
        const draggedItem = this.draggedMarker || this.draggedPopup;
        if (!friendId || !draggedItem) {
            console.error('shareLocation: missing friendId or draggedItem', { friendId, draggedItem });
            return;
        }

        console.log('shareLocation: sending location', { friendId, draggedItem, type });

        // Gửi qua REST API để backend save và broadcast qua WebSocket
        if (window.ChatService) {
            console.log('shareLocation: using ChatService');
            window.ChatService.sendMessage(friendId, {
                content: 'LOCATION:' + JSON.stringify(draggedItem),
                messageType: 'LOCATION'  // ✅ Changed from TEXT to LOCATION
            }).then((response) => {
                console.log('shareLocation: success', response);
                this.showMessage(`Đã chia sẻ vị trí "${draggedItem.name}"`, 'success');
            }).catch((error) => {
                console.error('shareLocation: failed', error);
                this.showMessage('Không thể chia sẻ vị trí', 'warning');
            });
        } else {
            console.error('shareLocation: ChatService not available');
            // Fallback: hiển thị local nếu không có ChatService
            const msg = {
                id: `loc_${Date.now()}`,
                location: draggedItem,
                timestamp: new Date()
            };

            const container = type === 'chat-window'
                ? document.querySelector(`[data-friend-id="${friendId}"] .chat-window-messages`)
                : document.querySelector('.messages-container');

            if (container) {
                container.insertAdjacentHTML('beforeend', this.renderLocationMessage(msg));
                container.scrollTop = container.scrollHeight;
            }
            this.showMessage(`Đã chia sẻ vị trí "${msg.location.name}"`, 'success');
        }
    }

    //Giao diện tin nhắn đẹp hơn
    renderLocationMessage(msg) {
        const { location, timestamp } = msg;
        return `
    <div class="chat-window-message location-message sent">
        <div class="location-card" onclick="focusLocation(${location.coordinates[0]},${location.coordinates[1]})">
            <div class="location-card-image">
                <img src="${location.image}" alt="${location.name}">
                <div class="overlay-icon">📍</div>
            </div>
            <div class="location-card-content">
                <h4>${location.name}</h4>
                <p>${location.description}</p>
                <button class="location-card-btn">🗺️ Xem trên bản đồ</button>
                <span class="location-time">${timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    </div>`;
    }

    showMessage(text, type = 'info') {
        const n = document.createElement('div');
        n.className = `location-notification ${type}`;
        n.textContent = text;
        document.body.appendChild(n);
        setTimeout(() => n.classList.add('show'), 10);
        setTimeout(() => {
            n.classList.remove('show');
            setTimeout(() => n.remove(), 300);
        }, 2500);
    }
}

// ==== Focus marker ====
window.focusLocation = (lng, lat) => {
    if (window.mapboxManager?.map) {
        window.mapboxManager.map.flyTo({ center: [lng, lat], zoom: 15, duration: 1500 });
        window.locationSharing?.showMessage(`Đang di chuyển đến ...`, 'info');
    }
};

// ==== Init ====
// window.addEventListener('mapLoaded', (e) => {
//     window.locationSharing = new LocationSharing(e.detail.map);
//     console.log('LocationSharing ready (no duplicate listeners)');
// });

export default LocationSharing;

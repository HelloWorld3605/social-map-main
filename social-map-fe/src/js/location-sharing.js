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

            markers.forEach((markerEl, index) => {
                if (markerEl.dataset.hasListener === 'true') return; // ⚡ tránh gắn lại
                markerEl.dataset.hasListener = 'true';
                markerEl.dataset.markerId = `marker-${index}`;
                markerEl.style.cursor = 'grab';
                markerEl.style.pointerEvents = 'auto';

                markerEl.addEventListener('mousedown', (e) => this.startDrag(e, markerEl), { passive: false });
            });

            console.log(`[LocationSharing] Attached drag events to ${markers.length} markers`);
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

            popups.forEach((popupEl, index) => {
                if (popupEl.dataset.hasListener === 'true') return; // ⚡ tránh gắn lại
                popupEl.dataset.hasListener = 'true';
                popupEl.dataset.popupId = `popup-${index}`;

                // Attach drag event to popup content
                const popupContent = popupEl.querySelector('.mapboxgl-popup-content');
                if (popupContent) {
                    popupContent.style.cursor = 'grab';
                    popupContent.addEventListener('mousedown', (e) => this.startDragPopup(e, popupEl), { capture: true });
                }
            });

            console.log(`[LocationSharing] Attached drag events to ${popups.length} popups`);
        };

        attachEvents();
    }

    setupGlobalDragEvents() {
        document.addEventListener('mousedown', (e) => {
            if (e.target.closest('.mapboxgl-marker')) {
                this.startDrag(e, e.target.closest('.mapboxgl-marker'));
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

        // Dữ liệu marker - sử dụng từ shared constants
        this.draggedMarker = window.HANOI_MARKER ? {
            name: window.HANOI_MARKER.name,
            coordinates: window.HANOI_MARKER.coordinates,
            image: window.HANOI_MARKER.image,
            description: window.HANOI_MARKER.description
        } : {
            name: 'Unknown Location',
            coordinates: [0, 0],
            image: '',
            description: ''
        };

        console.log('initiateDrag: draggedMarker', this.draggedMarker);

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
        this.draggedPopup = this.extractPopupData(popupEl);

        this.isDragging = true;
        document.body.style.cursor = 'grabbing';
        popupEl.style.transform += ' scale(1.05)';

        this.createDragPreviewPopup(e);
        this.highlightChats(true);
        console.log(`[LocationSharing] Dragging started for popup ${this.draggedPopup.name}`);
    }

    extractPopupData(popupEl) {
        console.log('extractPopupData: popupEl', popupEl);
        console.log('extractPopupData: window.HANOI_MARKER', window.HANOI_MARKER);

        // For popup, use the same data as marker
        return window.HANOI_MARKER ? {
            name: window.HANOI_MARKER.name,
            coordinates: window.HANOI_MARKER.coordinates,
            image: window.HANOI_MARKER.image,
            description: window.HANOI_MARKER.description
        } : {
            name: 'Unknown Location',
            coordinates: [0, 0],
            image: '',
            description: ''
        };
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
        // Find marker from mapbox manager
        if (window.mapboxManager && window.mapboxManager.hanoiMarker) {
            const marker = window.mapboxManager.hanoiMarker;
            if (marker.getElement() === element) {
                return marker;
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
        <div class="location-card" onclick="focusLocation(${location.coordinates[0]},${location.coordinates[1]},'${location.name}')">
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
window.focusLocation = (lng, lat, name) => {
    if (window.mapboxManager?.map) {
        window.mapboxManager.map.flyTo({ center: [lng, lat], zoom: 15, duration: 1500 });
        window.locationSharing?.showMessage(`Đang di chuyển đến ${name}...`, 'info');
    }
};

// ==== Init ====
// window.addEventListener('mapLoaded', (e) => {
//     window.locationSharing = new LocationSharing(e.detail.map);
//     console.log('LocationSharing ready (no duplicate listeners)');
// });

export default LocationSharing;

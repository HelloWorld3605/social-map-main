import { useCallback, useEffect, useRef, useState } from 'react';
import { useMapContext } from '../context/MapContext';

export function useLocationSharing() {
    const { map } = useMapContext();
    const [isDragging, setIsDragging] = useState(false);
    const [draggedMarker, setDraggedMarker] = useState(null);
    const dragPreviewRef = useRef(null); // Đổi từ state sang ref

    const dragStartTimeRef = useRef(0);
    const dragStartedRef = useRef(false);
    const clickThreshold = 150;
    const dragThreshold = 5;

    const toggleMapInteractions = useCallback((enable) => {
        if (!map) return;
        const fn = enable ? 'enable' : 'disable';
        map.dragPan[fn]();
        map.scrollZoom[fn]();
        map.doubleClickZoom[fn]();
        map.touchZoomRotate[fn]();
        map.boxZoom[fn]();
    }, [map]);

    const createDragPreview = useCallback((e, markerData) => {
        const preview = document.createElement('div');
        preview.className = 'location-drag-preview';
        preview.innerHTML = `
            <div class="drag-preview-content">
                <img src="${markerData.image}" alt="${markerData.name}" class="drag-preview-image">
                <div class="drag-preview-info"><span>${markerData.name}</span></div>
            </div>`;
        document.body.appendChild(preview);
        preview.style.left = `${e.clientX + 12}px`;
        preview.style.top = `${e.clientY - 32}px`;
        dragPreviewRef.current = preview; // Lưu vào ref thay vì state
        return preview; // Return để dùng ngay
    }, []);

    const highlightChats = useCallback((state) => {
        document.querySelectorAll('.chat-window, .side-chat')
            .forEach(el => el.classList.toggle('location-drop-zone', state));
    }, []);

    const shareLocation = useCallback((friendId, type, markerData) => {
        if (!friendId || !markerData) return;

        const msg = {
            id: `loc_${Date.now()}`,
            location: markerData,
            timestamp: new Date()
        };

        const container = type === 'chat-window'
            ? document.querySelector(`[data-friend-id="${friendId}"] .chat-window-messages`)
            : document.querySelector('.messages-container');

        if (!container) return;

        const locationHTML = `
            <div class="chat-window-message location-message sent">
                <div class="location-card" onclick="window.focusLocation(${msg.location.coordinates[0]},${msg.location.coordinates[1]})">
                    <div class="location-card-image">
                        <img src="${msg.location.image}" alt="${msg.location.name}">
                        <div class="overlay-icon">📍</div>
                    </div>
                    <div class="location-card-content">
                        <h4>${msg.location.name}</h4>
                        <p>${msg.location.description}</p>
                        <button class="location-card-btn">🗺️ Xem trên bản đồ</button>
                        <span class="location-time">${msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            </div>`;

        container.insertAdjacentHTML('beforeend', locationHTML);
        container.scrollTop = container.scrollHeight;

        showNotification(`Đã chia sẻ vị trí "${msg.location.name}"`, 'success');
    }, []);

    const showNotification = useCallback((text, type = 'info') => {
        const n = document.createElement('div');
        n.className = `location-notification ${type}`;
        n.textContent = text;
        document.body.appendChild(n);
        setTimeout(() => n.classList.add('show'), 10);
        setTimeout(() => {
            n.classList.remove('show');
            setTimeout(() => n.remove(), 300);
        }, 2500);
    }, []);

    const cleanupDrag = useCallback(() => {
        setIsDragging(false);
        setDraggedMarker(null);
        dragStartedRef.current = false;
        dragStartTimeRef.current = 0;

        toggleMapInteractions(true);
        document.body.style.cursor = '';

        if (dragPreviewRef.current) {
            dragPreviewRef.current.remove();
            dragPreviewRef.current = null;
        }

        document.querySelectorAll('.location-drop-zone, .location-drop-active')
            .forEach(el => el.classList.remove('location-drop-zone', 'location-drop-active'));

        document.querySelectorAll('.mapboxgl-marker').forEach(el => {
            el.style.transform = el.style.transform.replace(' scale(1.1)', '');
            el.style.cursor = 'grab';
        });
    }, [toggleMapInteractions]);

    const handleMarkerMouseDown = useCallback((e, markerEl, markerData) => {
        e.preventDefault();
        e.stopPropagation();

        if (isDragging) return;

        dragStartTimeRef.current = Date.now();
        dragStartedRef.current = false;

        const startX = e.clientX;
        const startY = e.clientY;
        let hasMoved = false;

        const onMouseMove = (moveEvent) => {
            const deltaX = Math.abs(moveEvent.clientX - startX);
            const deltaY = Math.abs(moveEvent.clientY - startY);
            const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

            if (distance > dragThreshold && !dragStartedRef.current) {
                dragStartedRef.current = true;
                setIsDragging(true);
                setDraggedMarker(markerData);
                toggleMapInteractions(false);

                // ĐÓNG POPUP khi bắt đầu drag
                const marker = window.mapboxManager?.hanoiMarker;
                if (marker && marker.getPopup() && marker.getPopup().isOpen()) {
                    marker.togglePopup(); // Đóng popup
                }

                document.body.style.cursor = 'grabbing';
                markerEl.style.transform += ' scale(1.1)';
                createDragPreview(moveEvent, markerData);
                highlightChats(true);
                hasMoved = true;
            }

            if (dragStartedRef.current && dragPreviewRef.current) {
                dragPreviewRef.current.style.left = `${moveEvent.clientX + 12}px`;
                dragPreviewRef.current.style.top = `${moveEvent.clientY - 32}px`;

                const zone = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)?.closest('.chat-window, .side-chat');
                document.querySelectorAll('.location-drop-active').forEach(el => el.classList.remove('location-drop-active'));
                if (zone) zone.classList.add('location-drop-active');
            }
        };

        const onMouseUp = (upEvent) => {
            const clickDuration = Date.now() - dragStartTimeRef.current;

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            if (!hasMoved && clickDuration < clickThreshold) {
                // Handle click - show popup
                const marker = window.mapboxManager?.hanoiMarker;
                if (marker && marker.getPopup()) {
                    marker.togglePopup();
                }
            } else if (dragStartedRef.current) {
                // Handle drop
                const dropTarget = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
                const chatWindow = dropTarget?.closest('.chat-window');
                const sideChat = dropTarget?.closest('.side-chat');

                if (chatWindow) {
                    shareLocation(chatWindow.dataset.friendId, 'chat-window', markerData);
                } else if (sideChat) {
                    const activeFriend = document.querySelector('.friend-item.active');
                    if (activeFriend) {
                        shareLocation(activeFriend.dataset.friend, 'side-chat', markerData);
                    } else {
                        showNotification('Vui lòng chọn người bạn để chia sẻ vị trí', 'warning');
                    }
                }

                cleanupDrag();
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [isDragging, toggleMapInteractions, createDragPreview, highlightChats, shareLocation, showNotification, cleanupDrag]);

    return {
        isDragging,
        draggedMarker,
        handleMarkerMouseDown,
        cleanupDrag
    };
}

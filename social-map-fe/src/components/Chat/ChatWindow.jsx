import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatService, webSocketService } from '../../services/ChatService';
import './ChatWindows.css';

export default function ChatWindow({
    conversation,
    minimized,
    isActive,
    currentUserId,
    onClose,
    onMinimize,
    onNewMessage,
    onMarkAsRead,
    onWindowClick,
    unreadCount = 0
}) {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [typingUsers, setTypingUsers] = useState([]);
    const [isSending, setIsSending] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const lastScrollHeightRef = useRef(0);
    const isLoadingMoreRef = useRef(false);
    const inputRef = useRef(null);
    const dropZoneRef = useRef(null);
    const navigate = useNavigate();

    // Track if user is currently typing to avoid unnecessary cleanup messages
    const isTypingRef = useRef(false);
    const [isDragOver, setIsDragOver] = useState(false);

    // Get display info
    const getDisplayInfo = useCallback(() => {
        if (!conversation) return { name: '', avatar: '', status: '' };

        if (conversation.isGroup) {
            return {
                name: conversation.groupName || 'Nhóm',
                avatar: conversation.groupAvatar || '/channels/myprofile.jpg',
                status: `${conversation.members?.length || 0} thành viên`,
            };
        } else {
            const otherUser = conversation.otherUser || conversation.members?.find(m => m.userId !== currentUserId);
            return {
                name: otherUser?.fullName || 'User',
                avatar: otherUser?.avatarUrl || '/channels/myprofile.jpg',
                status: otherUser?.isOnline ? 'Đang hoạt động' : 'Không hoạt động',
            };
        }
    }, [conversation, currentUserId]);

    const displayInfo = getDisplayInfo();

    // Load initial messages
    const loadMessages = useCallback(async (page = 0) => {
        if (!conversation?.id) return;

        try {
            setIsLoading(true);
            const response = await ChatService.getMessages(conversation.id, { page, size: 20 });

            if (page === 0) {
                const processedMessages = response.content.map(msg => {
                    if (msg.content && msg.content.startsWith('LOCATION:')) {
                        try {
                            const locationData = JSON.parse(msg.content.substring(9));
                            return {
                                ...msg,
                                content: locationData,
                                isLocation: true
                            };
                        } catch (e) {
                            console.error('Failed to parse location message:', e);
                            return msg;
                        }
                    }
                    return msg;
                }).reverse();
                setMessages(processedMessages);
            } else {
                const processedMessages = response.content.map(msg => {
                    if (msg.content && msg.content.startsWith('LOCATION:')) {
                        try {
                            const locationData = JSON.parse(msg.content.substring(9));
                            return {
                                ...msg,
                                content: locationData,
                                isLocation: true
                            };
                        } catch (e) {
                            console.error('Failed to parse location message:', e);
                            return msg;
                        }
                    } // ✅ thêm dấu đóng if
                    return msg;
                }).reverse();

                setMessages(prev => [...processedMessages, ...prev]);
            }

            setHasMore(!response.last);
            setCurrentPage(page);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setIsLoading(false);
            isLoadingMoreRef.current = false;
        }
    }, [conversation?.id]);

    // Load more messages on scroll
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container || isLoadingMoreRef.current || !hasMore) return;

        if (container.scrollTop === 0) {
            isLoadingMoreRef.current = true;
            lastScrollHeightRef.current = container.scrollHeight;
            loadMessages(currentPage + 1);
        }
    }, [currentPage, hasMore, loadMessages]);

    // Maintain scroll position after loading more
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container && lastScrollHeightRef.current > 0) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - lastScrollHeightRef.current;
            lastScrollHeightRef.current = 0;
        }
    }, [messages]);

    // Scroll to bottom for new messages
    const scrollToBottom = useCallback((smooth = false) => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto'
            });
        }
    }, []);

    // Load messages on conversation change
    useEffect(() => {
        if (conversation?.id) {
            setMessages([]);
            setCurrentPage(0);
            setHasMore(true);
            loadMessages(0);
        }
    }, [conversation?.id, loadMessages]);

    // Track previous isActive state to detect actual changes
    // ✅ IMPORTANT: Start with false so first active=true will be detected as transition
    const prevIsActiveRef = useRef(false);

    // Mark as read ONLY when isActive changes to true (not just when window opens)
    useEffect(() => {
        const wasActive = prevIsActiveRef.current;
        const isNowActive = isActive;

        console.log('🔍 Mark as read check:', {
            conversationId: conversation?.id,
            minimized,
            wasActive,
            isNowActive,
            isActiveChanged: wasActive !== isNowActive,
            shouldMark: conversation?.id && !minimized && isNowActive && !wasActive
        });

        // Only mark as read when:
        // 1. Window becomes active (wasActive = false → isNowActive = true)
        // 2. AND window is not minimized
        if (conversation?.id && !minimized && isNowActive && !wasActive) {
            console.log('✅ Marking as read (window became active):', conversation.id);
            ChatService.markAsRead(conversation.id).catch(console.error);
            if (onMarkAsRead) {
                onMarkAsRead(conversation.id);
            }
        } else {
            console.log('⏭️ Skipping mark as read:', {
                hasId: !!conversation?.id,
                minimized,
                wasActive,
                isNowActive,
                reason: !isNowActive ? 'not active' : wasActive ? 'already was active' : 'minimized'
            });
        }

        // Update previous state
        prevIsActiveRef.current = isNowActive;
    }, [conversation?.id, minimized, isActive, onMarkAsRead]);

    // Create stable callback refs to avoid recreating subscriptions
    const messageCallbackRef = useRef();
    const typingCallbackRef = useRef();
    const updateCallbackRef = useRef();

    // Update callback refs when dependencies change
    useEffect(() => {
        messageCallbackRef.current = (message) => {
            console.log('📨 ChatWindow received new message:', message);
            let processedMessage = message;

            if (message.content && message.content.startsWith('LOCATION:')) {
                try {
                    const locationData = JSON.parse(message.content.substring(9));
                    processedMessage = {
                        ...message,
                        content: locationData,
                        isLocation: true
                    };
                } catch (e) {
                    console.error('Failed to parse location message:', e);
                }
            }

            setMessages(prev => [...prev, processedMessage]);
            scrollToBottom(true);

            if (onNewMessage) {
                onNewMessage(processedMessage);
            }

            if (isActive && !minimized && message.senderId !== currentUserId) {
                console.log('✅ Auto-marking as read');
                webSocketService.sendMarkAsRead({ conversationId: conversation.id });
                ChatService.markAsRead(conversation.id).catch(console.error);
                if (onMarkAsRead) {
                    onMarkAsRead(conversation.id);
                }
            }
        };

        typingCallbackRef.current = (typingDTO) => {
            console.log('🎯 ChatWindow received typing:', typingDTO);
            const isTyping = typingDTO.typing ?? typingDTO.isTyping ?? false;

            if (typingDTO.userId !== currentUserId) {
                if (isTyping) {
                    const user = conversation.isGroup
                        ? conversation.members?.find(m => m.userId === typingDTO.userId)
                        : conversation.otherUser || conversation.members?.find(m => m.userId !== currentUserId);
                    const avatar = user?.avatarUrl || '/channels/myprofile.jpg';
                    const name = user?.fullName || typingDTO.username || 'User';

                    setTypingUsers(prev => {
                        if (prev.some(u => u.userId === typingDTO.userId)) return prev;
                        return [...prev, { userId: typingDTO.userId, avatar, name }];
                    });
                } else {
                    setTypingUsers(prev => prev.filter(u => u.userId !== typingDTO.userId));
                }

                window.dispatchEvent(new CustomEvent('typingStatus', {
                    detail: { conversationId: conversation.id, isTyping, userId: typingDTO.userId }
                }));
            }
        };

        updateCallbackRef.current = (updatedMessage) => {
            setMessages(prev => prev.map(msg =>
                msg.id === updatedMessage.id ? updatedMessage : msg
            ));
        };
    }, [conversation, currentUserId, isActive, minimized, onNewMessage, onMarkAsRead, scrollToBottom]);

    // Subscribe to WebSocket updates
    useEffect(() => {
        if (!conversation?.id) return;

        // Wrapper functions that call the refs
        const messageCallback = (msg) => messageCallbackRef.current?.(msg);
        const typingCallback = (dto) => typingCallbackRef.current?.(dto);
        const updateCallback = (msg) => updateCallbackRef.current?.(msg);

        console.log('🔔 ChatWindow subscribing to conversation:', conversation.id);
        webSocketService.subscribeToConversation(
            conversation.id,
            messageCallback,
            typingCallback,
            updateCallback
        );

        // Fetch current typing users
        const fetchTypingUsers = async () => {
            try {
                const typingUserIds = await ChatService.getTypingUsers(conversation.id);
                console.log('📋 Fetched current typing users:', typingUserIds);

                if (typingUserIds && typingUserIds.length > 0) {
                    const typingUsersData = typingUserIds
                        .filter(userId => userId !== currentUserId)
                        .map(userId => {
                            const user = conversation.isGroup
                                ? conversation.members?.find(m => m.userId === userId)
                                : conversation.otherUser || conversation.members?.find(m => m.userId !== currentUserId);
                            return {
                                userId: userId,
                                avatar: user?.avatarUrl || '/channels/myprofile.jpg',
                                name: user?.fullName || 'User'
                            };
                        });

                    if (typingUsersData.length > 0) {
                        console.log('✍️ Setting initial typing users:', typingUsersData);
                        setTypingUsers(typingUsersData);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch typing users:', error);
            }
        };

        fetchTypingUsers();

        return () => {
            if (isTypingRef.current) {
                console.log('🧹 ChatWindow cleanup: sending typing stopped');
                webSocketService.sendTypingStatus({
                    conversationId: conversation.id,
                    isTyping: false
                });
                isTypingRef.current = false;
            }

            console.log('🧹 ChatWindow cleanup: unsubscribing for', conversation.id);
            webSocketService.unsubscribe(`/topic/conversation/${conversation.id}`, messageCallback);
            webSocketService.unsubscribe(`/topic/conversation/${conversation.id}/typing`, typingCallback);
            webSocketService.unsubscribe(`/topic/conversation/${conversation.id}/update`, updateCallback);

            // Clear typing users on unmount
            setTypingUsers([]);
        };
    }, [conversation?.id, currentUserId]); // Only re-subscribe when conversation or user changes

    // Handle page reload/close - cleanup typing indicator
    useEffect(() => {
        if (!conversation?.id) return;

        const handleBeforeUnload = () => {
            // Only send if user was actually typing
            if (isTypingRef.current) {
                console.log('⚠️ Page unloading, user was typing, sending stopped');
                if (webSocketService?.stompClient?.connected) {
                    webSocketService.sendTypingStatus({
                        conversationId: conversation.id,
                        isTyping: false
                    });
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [conversation?.id]);

    // Send typing indicator
    const sendTypingIndicator = useCallback((isTyping) => {
        if (!conversation?.id) return;

        // Track typing state
        isTypingRef.current = isTyping;

        console.log('⌨️ sendTypingIndicator called:', {
            isTyping,
            conversationId: conversation.id,
            wsConnected: webSocketService?.stompClient?.connected
        });

        webSocketService.sendTypingStatus({
            conversationId: conversation.id,
            isTyping
        });

        console.log('✅ Typing status sent to backend');
    }, [conversation?.id]);

    // Handle input change
    const handleInputChange = useCallback((e) => {
        const newValue = e.target.value;
        console.log('handleInputChange: newValue:', JSON.stringify(newValue), 'trim:', newValue.trim(), 'length:', newValue.length);
        setInputValue(newValue);

        // Send typing indicator based on whether there's text
        const shouldType = newValue.length > 0;
        console.log('shouldType:', shouldType);
        if (shouldType) {
            sendTypingIndicator(true);
        } else {
            sendTypingIndicator(false);
        }
    }, [sendTypingIndicator]);

    // Send message
    const handleSend = useCallback(async () => {
        const messageText = inputValue.trim();
        if (!messageText || isSending || !conversation?.id) return;

        try {
            setIsSending(true);

            // Send via REST API - backend will save to DB and broadcast via WebSocket
            await ChatService.sendMessage(conversation.id, {
                content: messageText,
                messageType: 'TEXT'
            });

            setInputValue('');
            sendTypingIndicator(false);

            // Focus back to input
            setTimeout(() => inputRef.current?.focus(), 0);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    }, [inputValue, isSending, conversation?.id, sendTypingIndicator]);

    // Send shop message
    const sendShopMessage = useCallback(async (shopData) => {
        if (isSending || !conversation?.id) return;

        try {
            setIsSending(true);

            // Format shop content as JSON string with SHOP: prefix
            const shopContent = `SHOP:${JSON.stringify({
                shopId: shopData.shopId,
                shopName: shopData.shopName,
                address: shopData.address,
                latitude: shopData.latitude,
                longitude: shopData.longitude,
                phoneNumber: shopData.phoneNumber,
                imageUrl: shopData.imageUrl,
                rating: shopData.rating,
                status: shopData.status
            })}`;

            // Send via REST API
            await ChatService.sendMessage(conversation.id, {
                content: shopContent,
                messageType: 'TEXT'
            });

            console.log('✅ Shop shared successfully:', shopData.shopName);
        } catch (error) {
            console.error('Failed to send shop message:', error);
        } finally {
            setIsSending(false);
        }
    }, [isSending, conversation?.id]);

    // Handle drop events for shop sharing
    useEffect(() => {
        const dropZone = dropZoneRef.current;
        if (!dropZone) return;

        const handleDragOver = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(true);
        };

        const handleDragLeave = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
        };

        const handleDrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);

            try {
                const data = e.dataTransfer.getData('application/json');
                if (!data) return;

                const shopData = JSON.parse(data);
                if (shopData.type === 'SHOP') {
                    console.log('🏪 Dropped shop:', shopData);
                    sendShopMessage(shopData);
                }
            } catch (error) {
                console.error('Failed to handle shop drop:', error);
            }
        };

        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);

        return () => {
            dropZone.removeEventListener('dragover', handleDragOver);
            dropZone.removeEventListener('dragleave', handleDragLeave);
            dropZone.removeEventListener('drop', handleDrop);
        };
    }, [sendShopMessage]);

    // Handle key press
    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    // Handle shop click - zoom to shop on map
    const handleShopClick = useCallback((shopData) => {
        console.log('🏪 Clicked shop:', shopData);

        // Focus on map and zoom to shop location
        if (window.shopMarkersManager && shopData.shopId) {
            window.shopMarkersManager.focusOnShop(shopData.shopId);
        } else if (shopData.latitude && shopData.longitude) {
            // Fallback: zoom to coordinates
            const map = window.mapboxManager?.map;
            if (map) {
                map.flyTo({
                    center: [shopData.longitude, shopData.latitude],
                    zoom: 16,
                    duration: 1500
                });
            }
        }

        // Optionally navigate to shop detail page
        // navigate(`/shop/${shopData.shopId}`);
    }, []);

    // Linkify text
    const linkify = (text) => {
        if (!text) return '';
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, (url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="message-link">${url}</a>`;
        });
    };

    // Format message time (short version)
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        }
    };

    // Format detailed time for tooltip
    const formatDetailedTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Check if should show timestamp separator between messages
    const shouldShowTimestamp = (currentMsg, prevMsg) => {
        if (!prevMsg) return true; // First message

        const currentTime = new Date(currentMsg.createdAt || currentMsg.timestamp);
        const prevTime = new Date(prevMsg.createdAt || prevMsg.timestamp);

        // Show timestamp if messages are more than 5 minutes apart
        const diffInMinutes = (currentTime - prevTime) / (1000 * 60);
        return diffInMinutes > 5;
    };

    return (
        <div
            className={`chat-window ${minimized ? 'minimized' : 'open'} ${isActive ? 'active' : ''}`}
            data-conversation-id={conversation?.id}
            data-friend-id={conversation?.id}
            onClick={onWindowClick}
        >
            <div className={`chat-window-header ${unreadCount > 0 ? 'unread' : ''}`} onClick={onMinimize}>
                <img
                    src={displayInfo.avatar}
                    alt="Avatar"
                    className="chat-window-avatar"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!conversation.isGroup) {
                            const otherUser = conversation.otherUser || conversation.members?.find(m => m.userId !== currentUserId);
                            if (otherUser?.userId) {
                                navigate(`/profile/${otherUser.userId}`);
                            }
                        }
                    }}
                />
                <div className="chat-window-info">
                    <div className="chat-window-name">{displayInfo.name}</div>
                    <div className="chat-window-status">{displayInfo.status}</div>
                </div>
                <div className="chat-window-controls">
                    <button
                        className="chat-window-minimize"
                        title="Thu nhỏ"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMinimize();
                        }}
                    >
                        −
                    </button>
                    <button
                        className="chat-window-close"
                        title="Đóng"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>

            <div
                className="chat-window-messages"
                ref={messagesContainerRef}
                onScroll={handleScroll}
            >
                {isLoading && currentPage === 0 && (
                    <div className="chat-loading">Đang tải tin nhắn...</div>
                )}

                {hasMore && !isLoading && currentPage > 0 && (
                    <div className="load-more-messages">
                        <button onClick={() => loadMessages(currentPage + 1)}>
                            Tải thêm tin nhắn
                        </button>
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isSent = msg.senderId === currentUserId;
                    const showAvatar = !isSent && (index === 0 || messages[index - 1].senderId !== msg.senderId);
                    const showTimestamp = shouldShowTimestamp(msg, messages[index - 1]);

                    return (
                        <React.Fragment key={msg.id || index}>
                            {/* Timestamp Separator */}
                            {showTimestamp && (
                                <div className="message-timestamp-separator">
                                    <span>{formatTime(msg.createdAt || msg.timestamp)}</span>
                                </div>
                            )}

                            {/* Message */}
                            <div
                                className={`chat-window-message ${isSent ? 'sent' : 'received'}`}
                                title={formatDetailedTime(msg.createdAt || msg.timestamp)}
                            >
                                {showAvatar && !isSent && (
                                    <img
                                        src={msg.senderAvatar || displayInfo.avatar}
                                        alt="Avatar"
                                        className="chat-window-message-avatar"
                                    />
                                )}
                                {!showAvatar && !isSent && <div className="chat-window-message-avatar-spacer" />}

                                <div className="chat-window-message-content">
                                    {!isSent && showAvatar && (
                                        <div className="chat-window-message-sender">{msg.senderName}</div>
                                    )}
                                    {msg.content && typeof msg.content === 'string' && msg.content.startsWith('SHOP:') ? (
                                        (() => {
                                            try {
                                                const shopData = JSON.parse(msg.content.substring(5));
                                                return (
                                                    <div className="shop-message-card" onClick={() => handleShopClick(shopData)}>
                                                        {shopData.imageUrl && (
                                                            <div className="shop-card-image">
                                                                <img src={shopData.imageUrl} alt={shopData.shopName} />
                                                                <div className="shop-card-overlay">🏪</div>
                                                            </div>
                                                        )}
                                                        <div className="shop-card-content">
                                                            <div className="shop-card-title">{shopData.shopName}</div>
                                                            {shopData.address && (
                                                                <div className="shop-card-detail">📍 {shopData.address}</div>
                                                            )}
                                                            {shopData.phoneNumber && (
                                                                <div className="shop-card-detail">📞 {shopData.phoneNumber}</div>
                                                            )}
                                                            {shopData.rating > 0 && (
                                                                <div className="shop-card-detail">⭐ {shopData.rating.toFixed(1)}</div>
                                                            )}
                                                            <button className="shop-card-button">
                                                                🗺️ Xem trên bản đồ
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            } catch (e) {
                                                console.error('Failed to parse shop message:', e);
                                                return <div className="chat-window-message-text" dangerouslySetInnerHTML={{ __html: linkify(msg.content) }} />;
                                            }
                                        })()
                                    ) : msg.isLocation ? (
                                        <div className="location-message-card">
                                            <div className="location-card-image">
                                                <img src={msg.content.image} alt={msg.content.name} />
                                                <div className="location-card-overlay">📍</div>
                                            </div>
                                            <div className="location-card-content">
                                                <div className="location-card-title">{msg.content.name}</div>
                                                <div className="location-card-description">{msg.content.description}</div>
                                                <button
                                                    className="location-card-button"
                                                    onClick={() => window.focusLocation?.(msg.content.coordinates[0], msg.content.coordinates[1], msg.content.name)}
                                                >
                                                    🗺️ Xem trên bản đồ
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="chat-window-message-text"
                                            dangerouslySetInnerHTML={{ __html: linkify(msg.content) }}
                                        />
                                    )}
                                    {msg.edited && (
                                        <div className="chat-window-message-time">
                                            <span className="edited-indicator">(đã chỉnh sửa)</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}

                {typingUsers.length > 0 && (
                    <div className="chat-window-message received typing-indicator-message">
                        {console.log('rendering typing indicator, typingUsers length:', typingUsers.length, 'users:', typingUsers.map(u => u.userId))}
                        <img src={typingUsers[0].avatar} alt="Avatar" className="chat-window-message-avatar" />
                        <div className="typing-indicator">
                            <div className="typing-dots">
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div
                className={`chat-window-input-container ${isDragOver ? 'drag-over' : ''}`}
                ref={dropZoneRef}
            >
                <input
                    type="text"
                    placeholder="Aa"
                    className="chat-window-input"
                    value={inputValue}
                    onInput={handleInputChange}
                    onKeyPress={handleKeyPress}
                    onFocus={() => { if (inputValue.length > 0) sendTypingIndicator(true); }}
                    onBlur={() => sendTypingIndicator(false)}
                    disabled={isSending}
                    ref={inputRef}
                />
                <button
                    className="chat-window-send"
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isSending}
                >
                    {isSending ? '...' : '→'}
                </button>
            </div>
        </div>
    );
}


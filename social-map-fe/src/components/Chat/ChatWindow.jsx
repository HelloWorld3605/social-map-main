import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatService, webSocketService } from '../../services/ChatService';
import './ChatWindows.css';

export default function ChatWindow({ conversation, minimized, currentUserId, onClose, onMinimize, onNewMessage, unreadCount = 0, onMarkAsRead }) {
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
    const navigate = useNavigate();

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

    // Mark as read when conversation opens or unminimizes
    useEffect(() => {
        if (conversation?.id && !minimized) {
            ChatService.markAsRead(conversation.id).catch(console.error);
            if (onMarkAsRead) {
                onMarkAsRead(conversation.id);
            }
        }
    }, [conversation?.id, minimized, onMarkAsRead]);

    // Subscribe to WebSocket updates
    useEffect(() => {
        if (!conversation?.id) return;

        // Create callbacks with stable references for cleanup
        const messageCallback = (message) => {
            console.log('📨 ChatWindow received new message:', message);
            // New message
            let processedMessage = message;

            // Handle location messages
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

            // Notify parent
            if (onNewMessage) {
                onNewMessage(processedMessage);
            }

            // Mark as read if window is open
            if (!minimized) {
                webSocketService.sendMarkAsRead({ conversationId: conversation.id });
            }
        };

        const typingCallback = (typingDTO) => {
            // Typing indicator
            console.log('ChatWindow received typing:', typingDTO);
            if (typingDTO.userId !== currentUserId) {
                if (typingDTO.typing) {
                    const user = conversation.isGroup
                        ? conversation.members?.find(m => m.userId === typingDTO.userId)
                        : conversation.otherUser || conversation.members?.find(m => m.userId !== currentUserId);
                    const avatar = user?.avatarUrl || '/channels/myprofile.jpg';
                    const name = user?.fullName || typingDTO.username || 'User';
                    setTypingUsers(prev => {
                        const newUsers = prev.some(u => u.userId === typingDTO.userId) ? prev : [...prev, { userId: typingDTO.userId, avatar, name }];
                        console.log('typingUsers after add:', newUsers);
                        return newUsers;
                    });
                } else {
                    setTypingUsers(prev => {
                        console.log('before remove, typingUsers:', prev.map(u => u.userId));
                        const newUsers = prev.filter(u => u.userId !== typingDTO.userId);
                        console.log('after remove, typingUsers:', newUsers.map(u => u.userId));
                        return newUsers;
                    });
                }
                // Dispatch event to update SideChat
                console.log('ChatWindow dispatching typingStatus:', { conversationId: conversation.id, isTyping: typingDTO.typing, userId: typingDTO.userId });
                window.dispatchEvent(new CustomEvent('typingStatus', {
                    detail: { conversationId: conversation.id, isTyping: typingDTO.typing, userId: typingDTO.userId }
                }));
            }
        };

        const updateCallback = (updatedMessage) => {
            // Message edited/deleted
            setMessages(prev => prev.map(msg =>
                msg.id === updatedMessage.id ? updatedMessage : msg
            ));
        };

        // Subscribe with callback references
        console.log('🔔 ChatWindow subscribing to conversation:', conversation.id);
        webSocketService.subscribeToConversation(
            conversation.id,
            messageCallback,
            typingCallback,
            updateCallback
        );

        return () => {
            // Cleanup: Unsubscribe ONLY ChatWindow's callbacks (not SideChat's!)
            console.log('🧹 ChatWindow cleanup: unsubscribing callbacks for', conversation.id);
            webSocketService.unsubscribe(`/topic/conversation/${conversation.id}`, messageCallback);
            webSocketService.unsubscribe(`/topic/conversation/${conversation.id}/typing`, typingCallback);
            webSocketService.unsubscribe(`/topic/conversation/${conversation.id}/update`, updateCallback);
        };
    }, [conversation?.id, currentUserId, minimized, onNewMessage, scrollToBottom]);

    // Send typing indicator
    const sendTypingIndicator = useCallback((isTyping) => {
        if (!conversation?.id) return;
        console.log('sendTypingIndicator called with isTyping:', isTyping, 'conversationId:', conversation.id);
        webSocketService.sendTypingStatus({
            conversationId: conversation.id,
            isTyping
        });
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

    // Handle key press
    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    // Linkify text
    const linkify = (text) => {
        if (!text) return '';
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, (url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="message-link">${url}</a>`;
        });
    };

    // Format message time
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

    return (
        <div
            className={`chat-window ${minimized ? 'minimized' : 'open'}`}
            data-conversation-id={conversation?.id}
            data-friend-id={conversation?.id}
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

                    return (
                        <div
                            key={msg.id || index}
                            className={`chat-window-message ${isSent ? 'sent' : 'received'}`}
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
                                {msg.isLocation ? (
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
                                <div className="chat-window-message-time">
                                    {formatTime(msg.timestamp)}
                                    {msg.edited && <span className="edited-indicator"> (đã chỉnh sửa)</span>}
                                </div>
                            </div>
                        </div>
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

            <div className="chat-window-input-container">
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


import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './Chat.css';
import './ChatWindows.css';
import './LocationMessage.css';
import ChatWindow from './ChatWindow';
import { ChatService, webSocketService } from '../../services/ChatService';

export default function SideChat() {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeFriend, setActiveFriend] = useState(null);
    const [openChatWindows, setOpenChatWindows] = useState(new Map());
    const [conversations, setConversations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const wsConnectedRef = useRef(false);
    const conversationIdsRef = useRef(new Set()); // Track conversation IDs to detect new conversations

    // Load conversations from backend
    const loadConversations = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await ChatService.getUserConversations();
            // Parse location messages in lastMessage
            const processedData = data.map(conv => {
                if (conv.lastMessageContent?.startsWith('LOCATION:')) {
                    return {
                        ...conv,
                        lastMessageContent: 'Vị trí'
                    };
                }
                return conv;
            }).map(conv => ({ ...conv, typingUsers: [] })); // Add typingUsers array
            setConversations(processedData);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Connect to WebSocket
    useEffect(() => {
        const conversationIdsRefCurrent = conversationIdsRef.current; // Copy ref for cleanup

        if (!wsConnectedRef.current) {
            webSocketService.connect(
                () => {
                    console.log('✅ WebSocket connected');
                    setIsConnected(true);
                    wsConnectedRef.current = true;

                    // Lấy userId từ WebSocket service (đã được fetch từ backend)
                    const userId = webSocketService.getCurrentUserId();
                    setCurrentUserId(userId);

                    // Subscribe to user queue for unread counts
                    webSocketService.subscribeToUserQueue(
                        (unreadDTO) => {
                            // Update unread count for conversation
                            setConversations(prev => prev.map(conv =>
                                conv.id === unreadDTO.conversationId
                                    ? { ...conv, unreadCount: unreadDTO.count }
                                    : conv
                            ));
                        },
                        (error) => {
                            console.error('WebSocket error:', error);
                        }
                    );

                    // Subscribe to conversation updates
                    webSocketService.subscribeToConversationUpdates(
                        (updateDTO) => {
                            // Update conversation with new last message and unread count
                            let lastMessageContent = updateDTO.lastMessageContent;
                            if (updateDTO.lastMessageContent?.startsWith('LOCATION:')) {
                                lastMessageContent = 'Vị trí';
                            }

                            setConversations(prev => prev.map(conv =>
                                conv.id === updateDTO.conversationId
                                    ? {
                                        ...conv,
                                        lastMessageContent: lastMessageContent,
                                        lastMessageSenderId: updateDTO.lastMessageSenderId,
                                        lastMessageAt: updateDTO.lastMessageAt,
                                        unreadCount: updateDTO.unreadCount
                                    }
                                    : conv
                            ));
                        },
                        (error) => {
                            console.error('Conversation update error:', error);
                        }
                    );
                },
                (error) => {
                    console.error('WebSocket connection failed:', error);
                    setIsConnected(false);
                    wsConnectedRef.current = false;
                }
            );
        }

        return () => {
            if (wsConnectedRef.current) {
                webSocketService.disconnect();
                wsConnectedRef.current = false;
                // Clear subscription tracking to force re-subscribe on next connect
                conversationIdsRefCurrent.clear();
                console.log('🔌 WebSocket disconnected, cleared subscription tracking');
            }
        };
    }, []);

    // Load conversations on mount - CRITICAL: Load BEFORE subscribing
    useEffect(() => {
        console.log('🔄 Loading conversations on mount');
        loadConversations();
    }, [loadConversations]);

    // Subscribe to all conversations for both messages and typing
    // Only re-run when isConnected changes, NOT when conversations state updates
    useEffect(() => {
        if (!isConnected) return;

        console.log('🔄 Subscribe effect running (on connection change):', {
            isConnected,
            trackedIds: Array.from(conversationIdsRef.current)
        });

        // This effect should NOT re-run when conversations state changes
        // We'll use a separate effect to handle new conversations

        // Cleanup when component unmounts or connection changes
        return () => {
            console.log('🧹 Cleaning up all subscriptions due to unmount/disconnect');
            // Clear all tracked IDs to force re-subscribe on reconnect
            conversationIdsRef.current.clear();
        };
    }, [isConnected]);

    // Separate effect to subscribe to NEW conversations when they appear
    useEffect(() => {
        console.log('🔄 Effect 2 triggered:', {
            isConnected,
            conversationsLength: conversations.length,
            trackedIds: Array.from(conversationIdsRef.current)
        });

        if (!isConnected) {
            console.log('⏸️ Waiting for connection...');
            return;
        }

        if (conversations.length === 0) {
            console.log('⏸️ No conversations yet, waiting...');
            return;
        }

        console.log('✅ Ready to subscribe! Processing conversations...');

        let subscribedCount = 0;
        let skippedCount = 0;

        conversations.forEach(conv => {
            // Only subscribe to NEW conversations (not already in ref)
            if (conversationIdsRef.current.has(conv.id)) {
                // Already subscribed, do nothing
                console.log(`⏭️ Skipping ${conv.id} (already subscribed)`);
                skippedCount++;
                return;
            }

            console.log(`🆕 New conversation detected: ${conv.id}, will subscribe`);

            // Create message callback with closure over conv.id
            const messageCallback = (message) => {
                console.log('📨 SideChat received new message for conv', conv.id, ':', message);

                // Process location messages
                let lastMessageContent = message.content;
                if (message.content && message.content.startsWith('LOCATION:')) {
                    lastMessageContent = 'Vị trí';
                } else if (message.isLocation) {
                    lastMessageContent = 'Vị trí';
                }

                // Update conversation's last message
                setConversations(prev => prev.map(c => {
                    if (c.id === conv.id) {
                        console.log(`✏️ Updating last message for conv ${conv.id}:`, lastMessageContent);
                        return {
                            ...c,
                            lastMessageContent: lastMessageContent,
                            lastMessageSenderId: message.senderId,
                            lastMessageAt: message.timestamp || new Date().toISOString(),
                        };
                    }
                    return c;
                }));
            };

            // Create typing callback
            const typingCallback = (typingDTO) => {
                console.log('🎯 SideChat received typing from WebSocket:', typingDTO);

                // Handle both 'typing' and 'isTyping' field names from backend
                const isTyping = typingDTO.typing ?? typingDTO.isTyping ?? false;

                // Update typingUsers directly for THIS conversation
                setConversations(prev => prev.map(c => {
                    if (c.id === conv.id) {
                        let newTypingUsers = [...(c.typingUsers || [])];

                        if (isTyping) {
                            // User started typing
                            if (!newTypingUsers.includes(typingDTO.userId)) {
                                newTypingUsers.push(typingDTO.userId);
                                console.log(`✍️ User ${typingDTO.userId} started typing in conv ${conv.id}`);
                            }
                        } else {
                            // User stopped typing
                            newTypingUsers = newTypingUsers.filter(id => id !== typingDTO.userId);
                            console.log(`⏹️ User ${typingDTO.userId} stopped typing in conv ${conv.id}`);
                        }

                        console.log(`📝 Updated typingUsers for conv ${conv.id}:`, newTypingUsers);
                        return { ...c, typingUsers: newTypingUsers };
                    }
                    return c;
                }));

                // Also dispatch event for ChatWindow to handle
                window.dispatchEvent(new CustomEvent('typingStatus', {
                    detail: { conversationId: conv.id, isTyping: isTyping, userId: typingDTO.userId }
                }));
            };

            // Subscribe to messages AND typing for this conversation
            webSocketService.subscribeToConversation(
                conv.id,
                messageCallback,
                typingCallback,
                null
            );

            // Mark as subscribed (IMPORTANT: callbacks will persist via WebSocketService)
            conversationIdsRef.current.add(conv.id);
            subscribedCount++;

            console.log(`🔔 SideChat subscribed to conversation ${conv.id}`);
        });

        console.log(`📊 Subscribe summary: ${subscribedCount} new, ${skippedCount} skipped, ${conversationIdsRef.current.size} total tracked`);

        // NO cleanup function here - subscriptions persist across state updates
        // Cleanup only happens in the isConnected effect above
    }, [conversations, isConnected]);

    // Listen for openChatWindow event from Profile Page
    useEffect(() => {
        const handleOpenChatWindow = (event) => {
            const { conversation, minimized } = event.detail;

            if (!conversation) return;

            // Add to conversations list if not exists
            setConversations(prev => {
                const exists = prev.find(c => c.id === conversation.id);
                if (!exists) {
                    return [conversation, ...prev];
                }
                return prev;
            });

            // Open chat window
            setOpenChatWindows(prev => {
                const newMap = new Map(prev);
                newMap.set(conversation.id, { ...conversation, minimized: minimized || false });
                return newMap;
            });

            setActiveFriend(conversation.id);
        };

        window.addEventListener('openChatWindow', handleOpenChatWindow);

        return () => {
            window.removeEventListener('openChatWindow', handleOpenChatWindow);
        };
    }, []);

    // Listen for typing status updates from ChatWindow
    useEffect(() => {
        const handleTypingStatus = (event) => {
            const { conversationId, isTyping, userId } = event.detail;
            console.log('SideChat handling typingStatus:', { conversationId, isTyping, userId });
            setConversations(prev => prev.map(conv => {
                if (conv.id === conversationId) {
                    let newTypingUsers = [...conv.typingUsers];
                    if (isTyping) {
                        if (!newTypingUsers.includes(userId)) {
                            newTypingUsers.push(userId);
                        }
                    } else {
                        newTypingUsers = newTypingUsers.filter(id => id !== userId);
                    }
                    console.log('Updated typingUsers for conv', conv.id, ':', newTypingUsers);
                    return { ...conv, typingUsers: newTypingUsers };
                }
                return conv;
            }));
        };

        window.addEventListener('typingStatus', handleTypingStatus);

        return () => {
            window.removeEventListener('typingStatus', handleTypingStatus);
        };
    }, []);

    const handleChatToggle = useCallback(() => {
        setIsChatOpen(prev => !prev);
    }, []);

    const handleCloseChatPopup = useCallback(() => {
        setIsChatOpen(false);
    }, []);

    const handleOverlayClick = useCallback(() => {
        setIsChatOpen(false);
    }, []);

    const handleFriendClick = useCallback(async (conversation) => {
        setActiveFriend(conversation.id);
        setIsChatOpen(false);

        // Mark as read
        try {
            await ChatService.markAsRead(conversation.id);
            setConversations(prev => prev.map(conv =>
                conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
            ));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }

        // Open chat window
        setOpenChatWindows(prev => {
            const newMap = new Map(prev);
            if (!newMap.has(conversation.id)) {
                newMap.set(conversation.id, { ...conversation, minimized: false });
            } else {
                const existing = newMap.get(conversation.id);
                newMap.set(conversation.id, { ...existing, minimized: false });
            }
            return newMap;
        });
    }, []);

    const handleCloseChatWindow = useCallback((conversationId) => {
        setOpenChatWindows(prev => {
            const newMap = new Map(prev);
            newMap.delete(conversationId);
            return newMap;
        });
    }, []);

    const handleMinimizeChatWindow = useCallback((conversationId) => {
        setOpenChatWindows(prev => {
            const newMap = new Map(prev);
            const chatWindow = newMap.get(conversationId);
            if (chatWindow) {
                newMap.set(conversationId, { ...chatWindow, minimized: !chatWindow.minimized });
            }
            return newMap;
        });
    }, []);

    // Handle new messages from WebSocket
    const handleNewMessage = useCallback((conversationId, message) => {
        let lastMessageContent = message.content;
        if (message.content?.startsWith('LOCATION:')) {
            lastMessageContent = 'Vị trí';
        }

        setConversations(prev => prev.map(conv => {
            if (conv.id === conversationId) {
                return {
                    ...conv,
                    lastMessageContent: lastMessageContent,
                    lastMessageTime: message.timestamp,
                    lastMessageSender: message.senderName,
                };
            }
            return conv;
        }));
    }, []);

    useEffect(() => {
        const chatToggle = document.getElementById('chatToggle');
        if (chatToggle) {
            chatToggle.addEventListener('click', handleChatToggle);
            return () => chatToggle.removeEventListener('click', handleChatToggle);
        }
    }, [handleChatToggle]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isChatOpen) {
                setIsChatOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isChatOpen]);

    // Sort conversations by lastMessageAt (newest first) - REAL-TIME SORTING
    const sortedConversations = useMemo(() => {
        return [...conversations].sort((a, b) => {
            // Handle null/undefined lastMessageAt
            if (!a.lastMessageAt && !b.lastMessageAt) return 0;
            if (!a.lastMessageAt) return 1; // a goes to bottom
            if (!b.lastMessageAt) return -1; // b goes to bottom

            // Compare dates - newest first (descending order)
            const dateA = new Date(a.lastMessageAt);
            const dateB = new Date(b.lastMessageAt);
            return dateB - dateA;
        });
    }, [conversations]);

    // Filter conversations based on search query
    const filteredConversations = sortedConversations.filter(conv => {
        const displayName = conv.isGroup ? conv.groupName : conv.otherUser?.displayName || '';
        return displayName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Get display info for conversation
    const getConversationDisplay = (conv) => {
        if (conv.isGroup) {
            return {
                name: conv.groupName || 'Nhóm',
                avatar: conv.groupAvatar || '/channels/myprofile.jpg',
                status: `${conv.members?.length || 0} thành viên`,
            };
        } else {
            const otherUser = conv.otherUser || conv.members?.find(m => m.userId !== currentUserId);
            return {
                name: otherUser?.fullName || 'User',
                avatar: otherUser?.avatarUrl || '/channels/myprofile.jpg',
                status: otherUser?.online ? 'Đang hoạt động' : 'Không hoạt động',
            };
        }
    };

    // Format last message display
    const getLastMessageDisplay = (conv) => {
        if (conv.typingUsers && conv.typingUsers.length > 0) {
            return (
                <span className="typing-indicator-text">
                    <span className="typing-dots-inline">
                        <span>.</span><span>.</span><span>.</span>
                    </span>
                    {' '}đang nhập
                </span>
            );
        }

        if (conv.lastMessageContent) {
            const prefix = conv.lastMessageSenderId === currentUserId ? 'Bạn: ' : '';
            return `${prefix}${conv.lastMessageContent}`;
        }

        return 'Bắt đầu trò chuyện';
    };

    return (
        <>
            {/* Chat Popup Overlay */}
            <div
                className={`chat-popup-overlay ${isChatOpen ? 'is-active' : ''}`}
                id="chatPopupOverlay"
                onClick={handleOverlayClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleOverlayClick()}
                aria-label="Close chat"
            />

            {/* Side Chat */}
            <div className={`side-chat ${isChatOpen ? 'is-active' : ''}`} id="sideChat">
                <div className="chat-header">
                    <h3>Đoạn chat</h3>
                    <button className="chat-close-btn" id="chatCloseBtn" onClick={handleCloseChatPopup}>×</button>
                </div>

                {/* Search Box */}
                <div className="chat-search-box">
                    <input
                        type="text"
                        placeholder="Tìm kiếm đoạn chat..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="chat-search-input"
                    />
                    {searchQuery && (
                        <button
                            className="chat-search-clear"
                            onClick={() => setSearchQuery('')}
                        >
                            ×
                        </button>
                    )}
                </div>

                <div className="chat-friends-list">
                    {isLoading ? (
                        <div className="chat-loading">Đang tải...</div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="chat-empty">Không có đoạn chat nào</div>
                    ) : (
                        filteredConversations.map((conv) => {
                            const display = getConversationDisplay(conv);
                            return (
                                <div
                                    key={conv.id}
                                    className={`friend-item ${activeFriend === conv.id ? 'active' : ''}`}
                                    onClick={() => handleFriendClick(conv)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFriendClick(conv)}
                                    data-friend={conv.id}
                                >
                                    <img src={display.avatar} alt="Avatar" className="friend-avatar" />
                                    <div className="friend-info">
                                        <div className="friend-name">{display.name}</div>
                                        <div className="friend-status">
                                            {getLastMessageDisplay(conv)}
                                        </div>
                                    </div>
                                    {conv.unreadCount > 0 && (
                                        <div className="unread-count">{conv.unreadCount}</div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {!isConnected && (
                    <div className="chat-connection-status">
                        <span className="connection-indicator offline">●</span>
                        {' '}Đang kết nối lại...
                    </div>
                )}
            </div>

            {/* Chat Windows Container */}
            <div className="chat-windows-container" id="chatWindowsContainer">
                {Array.from(openChatWindows.entries()).map(([conversationId, chatData]) => {
                    const conversation = conversations.find(c => c.id === conversationId) || chatData;
                    return (
                        <ChatWindow
                            key={conversationId}
                            conversation={conversation}
                            minimized={chatData.minimized}
                            currentUserId={currentUserId}
                            unreadCount={conversation.unreadCount || 0}
                            onClose={() => handleCloseChatWindow(conversationId)}
                            onMinimize={() => handleMinimizeChatWindow(conversationId)}
                            onNewMessage={(message) => handleNewMessage(conversationId, message)}
                        />
                    );
                })}
            </div>
        </>
    );
}

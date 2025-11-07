import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatService } from '../../services/ChatService';
import { webSocketService } from '../../services/WebSocketChatService';
import { userService } from '../../services/userService';
import './ChatWindows.css';
import useRealtimeStatus from '../../hooks/useRealtimeStatus';

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
    const [hasMore, setHasMore] = useState(true);
    const [typingUsers, setTypingUsers] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true); // 🎬 Ẩn UI khi load lần đầu
    const [currentPage, setCurrentPage] = useState(0); // 📄 Track current page for pagination
    const [isLoadingMore, setIsLoadingMore] = useState(false); // State instead of ref for UI updates
    const [userStatus, setUserStatus] = useState({ isOnline: false, lastSeen: 'unknown' });

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const lastScrollHeightRef = useRef(0);
    const inputRef = useRef(null);
    const dropZoneRef = useRef(null);
    const navigate = useNavigate();

    // Track if user is currently typing to avoid unnecessary cleanup messages
    const isTypingRef = useRef(false);
    const [isDragOver, setIsDragOver] = useState(false);

    // ✅ Track active/minimized state for real-time mark as read
    const isActiveRef = useRef(isActive);
    const isMinimizedRef = useRef(minimized);

    // Format last seen time to friendly format
    const formatLastSeen = useCallback((lastSeen) => {
        if (!lastSeen || lastSeen === 'unknown') return 'Không hoạt động';

        // If it's already a formatted string (contains Vietnamese text), return as-is
        if (typeof lastSeen === 'string' && (
            lastSeen.includes('phút trước') ||
            lastSeen.includes('giờ trước') ||
            lastSeen.includes('ngày trước') ||
            lastSeen.includes('tuần trước') ||
            lastSeen.includes('Vừa xong') ||
            lastSeen.includes('vừa xong') ||
            lastSeen.includes('Không hoạt động')
        )) {
            return lastSeen;
        }

        // Try to parse as date
        const lastSeenDate = new Date(lastSeen);
        if (isNaN(lastSeenDate.getTime())) {
            // Invalid date string
            console.warn('Invalid date string for lastSeen:', lastSeen);
            return 'Không hoạt động';
        }

        try {
            const now = new Date();
            const diffInSeconds = Math.floor((now - lastSeenDate) / 1000);

            if (diffInSeconds < 60) {
                return 'Vừa xong';
            }

            const diffInMinutes = Math.floor(diffInSeconds / 60);
            if (diffInMinutes < 60) {
                return `${diffInMinutes} phút trước`;
            }

            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) {
                return `${diffInHours} giờ trước`;
            }

            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays < 7) {
                return `${diffInDays} ngày trước`;
            }

            const diffInWeeks = Math.floor(diffInDays / 7);
            if (diffInWeeks < 4) {
                return `${diffInWeeks} tuần trước`;
            }

            // For older than 4 weeks, show date
            return lastSeenDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (error) {
            console.error('Error formatting last seen:', error);
            return 'Không hoạt động';
        }
    }, []);

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
                status: userStatus.isOnline ? 'Đang hoạt động' : formatLastSeen(userStatus.lastSeen),
            };
        }
    }, [conversation, currentUserId, userStatus, formatLastSeen]);

    const displayInfo = getDisplayInfo();

    // ✅ Update refs when props change to ensure real-time mark as read
    useEffect(() => {
        isActiveRef.current = isActive;
    }, [isActive]);

    useEffect(() => {
        isMinimizedRef.current = minimized;
    }, [minimized]);

    // 🔹 Load recent messages (30 tin mới nhất)
    const loadRecentMessages = useCallback(async () => {
        if (!conversation?.id) return;

        try {
            console.log('📥 Loading recent messages for conversation:', conversation.id);
            
            const response = await ChatService.getMessages(conversation.id, { 
                page: 0, 
                size: 30 // Load 30 tin nhắn mới nhất
            });

            // Process location messages
            const processedMessages = response.content.map(msg => {
                if (typeof msg.content === 'string' && msg.content.startsWith('LOCATION:')) {
                    try {
                        const locationData = JSON.parse(msg.content.substring(9));
                        return { ...msg, content: locationData, isLocation: true };
                    } catch (e) {
                        console.error('Failed to parse location message:', e);
                        return msg;
                    }
                }
                return msg;
            }).reverse(); // ✅ Đảo để hiển thị từ cũ → mới (backend trả mới → cũ)

            setMessages(processedMessages);
            setHasMore(!response.last);
            
            console.log(`✅ Loaded ${processedMessages.length} recent messages`);
            console.log('📊 Pagination info:', {
                isLast: response.last,
                hasMore: !response.last,
                totalElements: response.totalElements,
                totalPages: response.totalPages,
                currentPage: response.number
            });
            console.log('📊 Message order (first 3):');
            console.log('   [0] (oldest):', processedMessages[0]?.createdAt, processedMessages[0]?.content?.substring?.(0, 20));
            console.log('   [1]:', processedMessages[1]?.createdAt);
            console.log('   [last] (newest):', processedMessages[processedMessages.length - 1]?.createdAt);

            // 🎬 Facebook-style: Scroll instant TRƯỚC, rồi mới hiện UI
            setTimeout(() => {
                scrollToBottom(); // Scroll instant (không smooth)

                // Hiện UI SAU KHI scroll xong
                setTimeout(() => {
                    setIsInitialLoad(false);
                    console.log('🎉 UI visible - scrolled to bottom');

                    // ✅ Debug: Check scroll state after initial load
                    const container = messagesContainerRef.current;
                    if (container) {
                        console.log('📊 Container state after load:', {
                            scrollTop: container.scrollTop,
                            scrollHeight: container.scrollHeight,
                            clientHeight: container.clientHeight,
                            hasScrollbar: container.scrollHeight > container.clientHeight,
                            canScrollUp: container.scrollTop > 0
                        });
                    }
                }, 50); // Đợi scroll complete
            }, 50);
        } catch (error) {
            console.error('Failed to load recent messages:', error);
            setIsInitialLoad(false); // Hiện UI dù lỗi
        }
    }, [conversation?.id]);

    // 🔹 Load older messages (Facebook-style infinite scroll with PAGE-based pagination)
    const loadOlderMessages = useCallback(async () => {
        if (!conversation?.id || isLoadingMore || !hasMore) return;

        const oldestMessage = messages[0];
        if (!oldestMessage) return;

        setIsLoadingMore(true); // ✅ Use state
        const nextPage = currentPage + 1;
        console.log(`🔼 Loading page ${nextPage} (older messages)`);

        try {
            // ✅ Use PAGE-based pagination instead of BEFORE timestamp
            const response = await ChatService.getMessages(conversation.id, {
                page: nextPage,
                size: 30
            });

            // Nếu hết tin nhắn
            if (!response.content || response.content.length === 0) {
                console.log('🏁 No more older messages.');
                setHasMore(false);
                setIsLoadingMore(false); // ✅ Use state
                return;
            }

            // Xử lý tin nhắn (giữ thứ tự cũ → mới)
            const processedMessages = response.content.map(msg => {
                if (typeof msg.content === 'string' && msg.content.startsWith('LOCATION:')) {
                    try {
                        const data = JSON.parse(msg.content.substring(9));
                        return { ...msg, content: data, isLocation: true };
                    } catch {
                        return msg;
                    }
                }
                return msg;
            }).reverse();

            // Giữ vị trí scroll khi prepend
            const container = messagesContainerRef.current;
            const prevScrollHeight = container.scrollHeight;

            let hasNewMessages = false;

            setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const newMessages = processedMessages.filter(m => !existingIds.has(m.id));

                if (newMessages.length === 0) {
                    console.log('⚠️ All duplicates skipped - Page may overlap');
                    hasNewMessages = false;
                    return prev;
                }

                console.log(`✅ Prepending ${newMessages.length} older messages from page ${nextPage}`);
                hasNewMessages = true;
                return [...newMessages, ...prev];
            });

            setHasMore(!response.last);
            setCurrentPage(nextPage); // ✅ Update current page

            // Khôi phục vị trí scroll (tránh nhảy)
            setTimeout(() => {
                if (hasNewMessages) {
                    const newScrollHeight = container.scrollHeight;
                    const diff = newScrollHeight - prevScrollHeight;
                    container.scrollTop = diff;
                    console.log(`✅ Restored scroll offset: +${diff}px`);
                } else {
                    console.log('⏭️ Skipped scroll restore (no new messages)');
                }
                // ✅ ALWAYS reset loading state
                setIsLoadingMore(false);
            }, 50);

        } catch (error) {
            console.error('❌ Failed to load older messages:', error);
            setIsLoadingMore(false); // ✅ Use state
        }
    }, [conversation?.id, messages, hasMore, currentPage, isLoadingMore]);

    // 🔹 Phát hiện scroll lên trên để load tin nhắn cũ (Facebook-style)
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;

        // ✅ Always log scroll events để debug
        if (container) {
            console.log('📜 SCROLL EVENT:', {
                scrollTop: Math.round(container.scrollTop),
                scrollHeight: container.scrollHeight,
                clientHeight: container.clientHeight,
                hasScrollbar: container.scrollHeight > container.clientHeight,
                hasMore: hasMore,
                isLoading: isLoadingMore, // ✅ Use state
                messagesCount: messages.length,
                shouldTrigger: container.scrollTop < 150 && hasMore && !isLoadingMore
            });
        }

        if (!container || isLoadingMore || !hasMore) { // ✅ Use state
            if (!container) console.warn('⚠️ No container ref');
            if (isLoadingMore) console.warn('⚠️ Already loading'); // ✅ Use state
            if (!hasMore) console.warn('⚠️ No more messages (hasMore=false)');
            return;
        }

        // Khi cuộn gần đầu (< 150px) - Facebook threshold
        if (container.scrollTop < 150) {
            console.log('✅ TRIGGER LOAD: scrollTop < 150px');
            loadOlderMessages();
        }
    }, [hasMore, loadOlderMessages, messages.length, isLoadingMore]); // ✅ Add to deps

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

    // 🔹 Load messages khi mở chat lần đầu
    useEffect(() => {
        if (conversation?.id) {
            console.log('🔄 Conversation changed, loading recent messages');
            setMessages([]);
            setHasMore(true);
            setCurrentPage(0); // ✅ Reset page to 0
            setIsInitialLoad(true); // 🎬 Ẩn UI khi load conversation mới
            loadRecentMessages(); // Load 30 tin mới nhất
        }
    }, [conversation?.id, loadRecentMessages]);

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
        // 3. AND last message is from another user (Messenger-style)
        if (conversation?.id && !minimized && isNowActive && !wasActive) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.senderId !== currentUserId) {
                console.log('👁️ Marking messages as read...');
                webSocketService.sendMarkAsRead({ conversationId: conversation.id });
                ChatService.markAsRead(conversation.id).catch(console.error);
                if (onMarkAsRead) {
                    onMarkAsRead(conversation.id);
                }
            } else {
                console.log('⏭️ Skipping mark as read: last message is from current user or no messages');
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
    }, [conversation?.id, minimized, isActive, onMarkAsRead, messages, currentUserId]);

    // Create stable callback refs to avoid recreating subscriptions
    const messageCallbackRef = useRef();
    const typingCallbackRef = useRef();
    const updateCallbackRef = useRef();
    const messageStatusCallbackRef = useRef();
    const readReceiptCallbackRef = useRef();

    // Update callback refs when dependencies change
    useEffect(() => {
        messageCallbackRef.current = (message) => {
            console.log('📨 ChatWindow received new message:', message);
            let processedMessage = message;

            // Type check before using string methods
            if (typeof message.content === 'string' && message.content.startsWith('LOCATION:')) {
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

            // ⚠️ Check duplicate trước khi append
            setMessages(prev => {
                // Nếu message đã tồn tại, không append
                if (prev.some(m => m.id === processedMessage.id)) {
                    console.warn('⚠️ Duplicate message received, skipping:', processedMessage.id);
                    return prev;
                }
                return [...prev, processedMessage];
            });
            scrollToBottom(true);

            if (onNewMessage) {
                onNewMessage(processedMessage);
            }

            // ✅ Auto mark as read if window is active and message is from another user
            // Use refs to get the LATEST state values (not stale closure values)
            const isWindowActive = isActiveRef.current;
            const isWindowMinimized = isMinimizedRef.current;

            console.log('📨 New message check for auto-read:', {
                isWindowActive,
                isWindowMinimized,
                isFromOtherUser: message.senderId !== currentUserId,
                conversationId: conversation.id,
                messageId: message.id
            });

            if (isWindowActive && !isWindowMinimized && message.senderId !== currentUserId) {
                console.log('✅ Auto-marking as read (window is active)');
                webSocketService.sendMarkAsRead({ conversationId: conversation.id });
                ChatService.markAsRead(conversation.id).catch(console.error);
                if (onMarkAsRead) {
                    onMarkAsRead(conversation.id);
                }
            } else {
                console.log('⏭️ Skipping auto-mark as read:', {
                    reason: !isWindowActive ? 'window not active' :
                            isWindowMinimized ? 'window minimized' :
                            'message from current user'
                });
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
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === updatedMessage.id ? updatedMessage : msg
                )
            );
        };

        // Message status update callback
        messageStatusCallbackRef.current = (statusUpdate) => {
            console.log('📬 ========== MESSAGE STATUS UPDATE ==========');
            console.log('📬 Raw status update:', JSON.stringify(statusUpdate, null, 2));
            console.log('📬 Message ID:', statusUpdate.messageId);
            console.log('📬 New status:', statusUpdate.status);
            console.log('📬 SeenBy:', statusUpdate.seenBy);

            setMessages((prev) => {
                const updated = prev.map(msg => {
                    if (msg.id === statusUpdate.messageId) {
                        console.log('📬 ✅ Found message, updating status');
                        const updatedMsg = {
                            ...msg,
                            status: statusUpdate.status,
                            seenBy: statusUpdate.seenBy
                        };
                        console.log('📬 Updated message:', updatedMsg);
                        return updatedMsg;
                    }
                    return msg;
                });
                console.log('📬 ========== END MESSAGE STATUS UPDATE ==========');
                return updated;
            });
        };

        // ✅ Read receipt callback
        readReceiptCallbackRef.current = (receipt) => {
            console.log('👁️ ========== READ RECEIPT RECEIVED ==========');
            console.log('👁️ Raw receipt:', JSON.stringify(receipt, null, 2));
            console.log('👁️ Current messages count:', messages.length);
            console.log('👁️ Looking for message ID:', receipt.lastMessageId);

            // Map backend DTO fields to frontend format
            const seenByUser = {
                userId: receipt.readByUserId || receipt.userId,
                userName: receipt.readByUserName || receipt.userName,
                userAvatar: receipt.readByUserAvatar || receipt.userAvatar,
                seenAt: receipt.readAt || receipt.seenAt,
            };

            console.log('👁️ Mapped seenBy user:', seenByUser);

            setMessages((prev) => {
                console.log('👁️ Messages before update:', prev.length);

                const updated = prev.map(msg => {
                    if (msg.id === receipt.lastMessageId) {
                        console.log('👁️ Found matching message!', msg.id);

                        // Check if this user already in seenBy list
                        const existingSeenBy = msg.seenBy || [];
                        const alreadySeen = existingSeenBy.some(s => s.userId === seenByUser.userId);

                        if (alreadySeen) {
                            console.log('👁️ User already marked as seen, skipping');
                            return msg;
                        }

                        console.log('👁️ ✅ Updating message to SEEN status');
                        const updatedMsg = {
                            ...msg,
                            status: 'SEEN',
                            seenBy: [...existingSeenBy, seenByUser],
                        };
                        console.log('👁️ Updated message:', updatedMsg);
                        return updatedMsg;
                    }
                    return msg;
                });

                console.log('👁️ Messages after update:', updated.length);
                console.log('👁️ ========== END READ RECEIPT ==========');
                return updated;
            });
        };
    }, [conversation, currentUserId, isActive, minimized, onNewMessage, onMarkAsRead, scrollToBottom]);

    // Load user status for conversation
    useEffect(() => {
        const loadUserStatus = async () => {
            if (!conversation || conversation.isGroup) return;

            const otherUser = conversation.otherUser || conversation.members?.find(m => m.userId !== currentUserId);
            if (!otherUser?.userId) return;

            try {
                const status = await userService.getUserStatus(otherUser.userId);
                setUserStatus(status);
            } catch (error) {
                console.error('Failed to load user status for chat:', error);
            }
        };

        loadUserStatus();
    }, [conversation, currentUserId]);

    // Handle realtime status updates
    const handleStatusChange = useCallback((userId, status) => {
        console.log('🔄 ChatWindow realtime status update:', { userId, status });

        // Only update if this is the user in this conversation
        const otherUser = conversation?.otherUser || conversation?.members?.find(m => m.userId !== currentUserId);
        if (otherUser?.userId === userId) {
            setUserStatus(prev => {
                if (status === 'online') {
                    return { ...prev, isOnline: true };
                } else if (status === 'offline') {
                    // Format as friendly string instead of timestamp
                    return { ...prev, isOnline: false, lastSeen: 'Vừa xong' };
                }
                return prev;
            });
        }
    }, [conversation, currentUserId]);

    // Use realtime status hook
    useRealtimeStatus(handleStatusChange);

    // Subscribe to WebSocket updates
    useEffect(() => {
        if (!conversation?.id) return;

        // Wrapper functions that call the refs
        const messageCallback = (msg) => messageCallbackRef.current?.(msg);
        const typingCallback = (dto) => typingCallbackRef.current?.(dto);
        const updateCallback = (msg) => updateCallbackRef.current?.(msg);
        const messageStatusCallback = (statusUpdate) => messageStatusCallbackRef.current?.(statusUpdate);
        const readReceiptCallback = (receipt) => readReceiptCallbackRef.current?.(receipt);

        console.log('🔔 ChatWindow subscribing to conversation:', conversation.id);
        webSocketService.subscribeToConversation(
            conversation.id,
            messageCallback,
            typingCallback,
            updateCallback
        );

        // ✅ Subscribe to message status updates (Messenger-style)
        console.log('📬 ========== SUBSCRIBING TO MESSAGE STATUS ==========');
        console.log('📬 WebSocket connected:', webSocketService.stompClient?.connected);
        console.log('📬 Current userId:', currentUserId);
        webSocketService.subscribeToMessageStatus(messageStatusCallback);
        console.log('📬 Subscription to /user/queue/message-status completed');

        // ✅ Subscribe to read receipts (Messenger-style)
        console.log('👁️ ========== SUBSCRIBING TO READ RECEIPTS ==========');
        console.log('👁️ WebSocket connected:', webSocketService.stompClient?.connected);
        console.log('👁️ Current userId:', currentUserId);
        webSocketService.subscribeToReadReceipts(readReceiptCallback);
        console.log('👁️ Subscription to /user/queue/read-receipt completed');

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

    // Render message status text (Messenger-style - Vietnamese)
    const renderMessageStatus = (msg) => {
        // Only show status for messages sent by current user
        if (msg.senderId !== currentUserId) return null;

        // Messenger logic: Chỉ hiển thị status ở tin nhắn CUỐI CÙNG của mình
        const myMessages = messages.filter(m => m.senderId === currentUserId);
        const lastMyMessage = myMessages[myMessages.length - 1];

        // Nếu không phải tin nhắn cuối cùng của user -> không hiển thị gì
        if (!lastMyMessage || msg.id !== lastMyMessage.id) return null;

        // Nếu tin nhắn đã được XEM (SEEN)
        if (msg.status === 'SEEN' && msg.seenBy?.length > 0) {
            const firstViewer = msg.seenBy[0];
            return (
                <div className="message-status-wrapper">
                    <img
                        src={firstViewer.userAvatar || displayInfo.avatar}
                        alt={firstViewer.userName || displayInfo.name}
                        className="message-status-avatar"
                        title={`Đã xem bởi ${firstViewer.userName || displayInfo.name}`}
                    />
                    <span className="message-status-text seen">Đã xem</span>
                </div>
            );
        }

        // Tin nhắn chưa được đọc (SENT) - chỉ hiển thị ở tin cuối cùng
        return (
            <div className="message-status-wrapper">
                <span className="message-status-text sent">Đã gửi</span>
            </div>
        );
    };

    return (
        <div
            className={`chat-window ${minimized ? 'minimized' : 'open'} ${isActive ? 'active' : ''}`}
            data-conversation-id={conversation?.id}
            data-friend-id={conversation?.id}
            onClick={onWindowClick}
        >
            <div className={`chat-window-header ${unreadCount > 0 ? 'unread' : ''}`} onClick={onMinimize}>
                <div className="chat-window-avatar-wrapper">
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
                    {!conversation.isGroup && userStatus.isOnline && (
                        <div className="chat-window-online-dot"></div>
                    )}
                </div>
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
                className={`chat-window-messages ${isInitialLoad ? 'is-loading-initial' : ''}`}
                ref={messagesContainerRef}
                onScroll={handleScroll}
            >
                {/* 📥 Loading indicator khi load lần đầu (center screen) */}
                {isInitialLoad && (
                    <div className="chat-loading">
                        <div className="loading-spinner-large"></div>
                        <p>Đang tải tin nhắn...</p>
                    </div>
                )}
                {!hasMore && messages.length > 0 && (
                    <div className="chat-end-message">

                        <div className="chat-end-text">Đây là những tin nhắn đầu tiên của các bạn</div>
                        <div className="chat-end-subtext">
                            Cuộc trò chuyện với {displayInfo.name}
                        </div>
                    </div>
                )}

                {/* 📥 Loading spinner khi load tin nhắn cũ - Facebook style */}
                {isLoadingMore && messages.length > 0 && ( // ✅ Use state for re-render
                    <div className="chat-loading-more">
                        <div className="loading-spinner-small"></div>
                        <span className="loading-text">Đang tải tin cũ...</span>
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isSent = msg.senderId === currentUserId;
                    const showAvatar = !isSent && (index === 0 || messages[index - 1].senderId !== msg.senderId);
                    const showTimestamp = shouldShowTimestamp(msg, messages[index - 1]);

                    // ✅ Generate unique key: msg.id + timestamp để tránh duplicate
                    const uniqueKey = msg.id ? `${msg.id}-${msg.createdAt || index}` : `msg-${index}`;

                    return (
                        <React.Fragment key={uniqueKey}>
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
                                    {/* Message status indicator (Facebook-style) */}
                                    {isSent && (
                                        <div className="message-status-container">
                                            {renderMessageStatus(msg)}
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


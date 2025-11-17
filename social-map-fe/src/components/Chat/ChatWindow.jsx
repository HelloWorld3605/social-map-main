import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatService } from '../../services/ChatService';
import { webSocketService } from '../../services/WebSocketChatService';
import { userService } from '../../services/userService';
import { processLocationMessages, processLocationMessage } from '../../utils/locationMessageUtils';
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

    // 🆕 Animation states for header effects
    const [headerAnimation, setHeaderAnimation] = useState(''); // 'unread', 'flash', 'pulse'

    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Track if user is currently typing to avoid unnecessary cleanup messages
    const isTypingRef = useRef(false);

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

            // Process location messages using utility function
            const processedMessages = processLocationMessages(response.content).reverse(); // ✅ Đảo để hiển thị từ cũ → mới (backend trả mới → cũ)

            // ✅ Ensure all messages have status and seenBy
            const messagesWithStatus = processedMessages.map(msg => ({
                ...msg,
                status: msg.status || 'SENT',
                seenBy: msg.seenBy || []
            }));

            setMessages(messagesWithStatus);
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

                    // ✅ Facebook-style: Mark as read after messages load if window is active
                    // Check window state after messages load (use refs to get latest state)
                    setTimeout(() => {
                        if (isActiveRef.current && !isMinimizedRef.current && messagesWithStatus.length > 0) {
                            const lastMessage = messagesWithStatus[messagesWithStatus.length - 1];
                            if (lastMessage && lastMessage.senderId !== currentUserId) {
                                console.log('👁️ Marking messages as read (after load, window is active)...');
                                const now = Date.now();
                                lastMarkAsReadTimeRef.current = now;
                                webSocketService.sendMarkAsRead({ conversationId: conversation.id });
                                ChatService.markAsRead(conversation.id).catch(console.error);
                                if (onMarkAsRead) {
                                    onMarkAsRead(conversation.id);
                                }
                            }
                        }
                    }, 100); // Small delay to ensure state is updated
                }, 50); // Đợi scroll complete
            }, 50);
        } catch (error) {
            console.error('Failed to load recent messages:', error);
            setIsInitialLoad(false); // Hiện UI dù lỗi
        }
    }, [conversation?.id, currentUserId, onMarkAsRead]);

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

            // Xử lý tin nhắn (giữ thứ tự cũ → mới) using utility function
            const processedMessages = processLocationMessages(response.content).reverse();

            // ✅ Ensure all messages have status and seenBy
            const messagesWithStatus = processedMessages.map(msg => ({
                ...msg,
                status: msg.status || 'SENT',
                seenBy: msg.seenBy || []
            }));

            // Giữ vị trí scroll khi prepend
            const container = messagesContainerRef.current;
            const prevScrollHeight = container.scrollHeight;

            let hasNewMessages = false;

            setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const newMessages = messagesWithStatus.filter(m => !existingIds.has(m.id));

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

    // ✅ Facebook-style: Mark as read whenever window becomes active and messages are loaded
    // Track last mark as read time to avoid spamming
    const lastMarkAsReadTimeRef = useRef(0);
    const MARK_AS_READ_THROTTLE_MS = 1000; // Throttle: only mark once per second

    // Mark as read when window becomes active AND messages are loaded
    useEffect(() => {
        // Only mark as read when:
        // 1. Window is active (not minimized)
        // 2. AND messages are loaded (not initial load)
        // 3. AND there are messages
        // 4. AND enough time has passed since last mark (throttle)
        if (conversation?.id && !minimized && isActive && !isInitialLoad && messages.length > 0) {
            const now = Date.now();
            const timeSinceLastMark = now - lastMarkAsReadTimeRef.current;

            // Throttle: only mark if enough time has passed
            if (timeSinceLastMark < MARK_AS_READ_THROTTLE_MS) {
                console.log('⏭️ Mark as read throttled:', { timeSinceLastMark, throttle: MARK_AS_READ_THROTTLE_MS });
                return;
            }

            const lastMessage = messages[messages.length - 1];

            // Mark as read if last message is from another user (has unread messages)
            if (lastMessage && lastMessage.senderId !== currentUserId) {
                console.log('👁️ Marking messages as read (window is active)...', {
                    conversationId: conversation.id,
                    lastMessageId: lastMessage.id,
                    lastMessageSender: lastMessage.senderId,
                    currentUserId
                });

                lastMarkAsReadTimeRef.current = now;

                // Send via WebSocket (faster) and REST API (backup)
                webSocketService.sendMarkAsRead({ conversationId: conversation.id });
                ChatService.markAsRead(conversation.id).catch(console.error);

                if (onMarkAsRead) {
                    onMarkAsRead(conversation.id);
                }
            } else {
                console.log('⏭️ Skipping mark as read: last message is from current user');
            }
        }
    }, [conversation?.id, minimized, isActive, onMarkAsRead, messages, currentUserId, isInitialLoad]);

    // Reset throttle when conversation changes
    useEffect(() => {
        lastMarkAsReadTimeRef.current = 0;
    }, [conversation?.id]);

    // Create stable callback refs to avoid recreating subscriptions
    const messageCallbackRef = useRef();
    const typingCallbackRef = useRef();
    const updateCallbackRef = useRef();
    const messageStatusCallbackRef = useRef();
    const readReceiptCallbackRef = useRef();

    // ✅ Store subscription callbacks in refs for proper cleanup
    const subscriptionCallbacksRef = useRef({
        messageCallback: null,
        typingCallback: null,
        updateCallback: null,
        messageStatusCallback: null,
        readReceiptCallback: null
    });

    // Update callback refs when dependencies change
    useEffect(() => {
        messageCallbackRef.current = (message) => {
            console.log('📨 ChatWindow received new message:', message);
            // Process location message using utility function
            const processedMessage = processLocationMessage(message);

            // ✅ Ensure message has status (default to SENT if not set)
            if (!processedMessage.status) {
                processedMessage.status = 'SENT';
            }
            // ✅ Ensure seenBy array exists
            if (!processedMessage.seenBy) {
                processedMessage.seenBy = [];
            }

            // ⚠️ Check duplicate trước khi append (Facebook-style: prevent duplicate messages)
            setMessages(prev => {
                // Nếu message đã tồn tại, không append
                const isDuplicate = prev.some(m => m.id === processedMessage.id);
                if (isDuplicate) {
                    console.warn('⚠️ Duplicate message received, skipping:', {
                        messageId: processedMessage.id,
                        currentMessagesCount: prev.length,
                        messageContent: processedMessage.content?.substring(0, 50)
                    });
                    return prev;
                }
                console.log('✅ Adding new message:', {
                    messageId: processedMessage.id,
                    senderId: processedMessage.senderId,
                    currentMessagesCount: prev.length
                });
                return [...prev, processedMessage];
            });
            scrollToBottom(true);

            if (onNewMessage) {
                onNewMessage(processedMessage);
            }

            // ✅ Facebook-style: Auto mark as read if window is active and message is from another user
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
                console.log('✅ Auto-marking as read (new message received, window is active)');
                // Throttle: only mark if enough time has passed
                const now = Date.now();
                const timeSinceLastMark = now - lastMarkAsReadTimeRef.current;
                if (timeSinceLastMark >= MARK_AS_READ_THROTTLE_MS) {
                    lastMarkAsReadTimeRef.current = now;
                    webSocketService.sendMarkAsRead({ conversationId: conversation.id });
                    ChatService.markAsRead(conversation.id).catch(console.error);
                    if (onMarkAsRead) {
                        onMarkAsRead(conversation.id);
                    }
                } else {
                    console.log('⏭️ Auto-mark as read throttled:', { timeSinceLastMark });
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
            // ReadReceiptDTO has: readByUserId, readByUserName, readByUserAvatar, readAt
            if (!receipt.readByUserId || !receipt.lastMessageId) {
                console.error('👁️ ❌ Invalid read receipt: missing required fields', receipt);
                return;
            }

            const seenByUser = {
                userId: receipt.readByUserId,
                userName: receipt.readByUserName || 'User',
                userAvatar: receipt.readByUserAvatar || '/channels/myprofile.jpg',
                seenAt: receipt.readAt || new Date().toISOString(),
            };

            console.log('👁️ Mapped seenBy user:', seenByUser);

            setMessages((prev) => {
                console.log('👁️ Messages before update:', prev.length);

                let found = false;
                const updated = prev.map(msg => {
                    if (msg.id === receipt.lastMessageId) {
                        found = true;
                        console.log('👁️ ✅ Found matching message!', msg.id);

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

                if (!found) {
                    console.warn('👁️ ⚠️ Message not found in current messages list:', receipt.lastMessageId);
                    console.log('👁️ Available message IDs:', prev.map(m => m.id));
                }

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

            // Dispatch event to notify SideChat about status change
            window.dispatchEvent(new CustomEvent('userStatusChange', {
                detail: { userId, status }
            }));
        }
    }, [conversation, currentUserId]);

    // Use realtime status hook
    useRealtimeStatus(handleStatusChange);

    // Subscribe to WebSocket updates
    useEffect(() => {
        if (!conversation?.id) return;

        // ✅ Unsubscribe old callbacks first to prevent duplicates
        const oldCallbacks = subscriptionCallbacksRef.current;
        if (oldCallbacks.messageCallback) {
            console.log('🧹 Unsubscribing old callbacks before re-subscribing');
            webSocketService.unsubscribe(`/topic/conversation/${conversation.id}`, oldCallbacks.messageCallback);
            webSocketService.unsubscribe(`/topic/conversation/${conversation.id}/typing`, oldCallbacks.typingCallback);
            webSocketService.unsubscribe(`/topic/conversation/${conversation.id}/update`, oldCallbacks.updateCallback);
            if (oldCallbacks.messageStatusCallback) {
                webSocketService.unsubscribe('/user/queue/message-status', oldCallbacks.messageStatusCallback);
            }
            if (oldCallbacks.readReceiptCallback) {
                webSocketService.unsubscribe('/user/queue/read-receipt', oldCallbacks.readReceiptCallback);
            }
        }

        // ✅ Create stable wrapper functions that call the refs
        // These functions are recreated on each effect run, but they call the latest refs
        const messageCallback = (msg) => {
            console.log('📨 ChatWindow messageCallback wrapper called for message:', msg.id);
            messageCallbackRef.current?.(msg);
        };
        const typingCallback = (dto) => typingCallbackRef.current?.(dto);
        const updateCallback = (msg) => updateCallbackRef.current?.(msg);
        const messageStatusCallback = (statusUpdate) => messageStatusCallbackRef.current?.(statusUpdate);
        const readReceiptCallback = (receipt) => readReceiptCallbackRef.current?.(receipt);

        // ✅ Store callbacks in ref for cleanup
        subscriptionCallbacksRef.current = {
            messageCallback,
            typingCallback,
            updateCallback,
            messageStatusCallback,
            readReceiptCallback
        };

        console.log('🔔 ChatWindow subscribing to conversation:', conversation.id);
        webSocketService.subscribeToConversation(
            conversation.id,
            messageCallback,
            typingCallback,
            updateCallback
        );

        // ✅ Subscribe to message status updates (Messenger-style)
        // These are global subscriptions (per user), so they should only be subscribed once
        // But we'll let WebSocketChatService handle duplicate prevention
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
            // ✅ Use stored callbacks from ref for proper cleanup
            const callbacks = subscriptionCallbacksRef.current;
            if (callbacks.messageCallback) {
                webSocketService.unsubscribe(`/topic/conversation/${conversation.id}`, callbacks.messageCallback);
            }
            if (callbacks.typingCallback) {
                webSocketService.unsubscribe(`/topic/conversation/${conversation.id}/typing`, callbacks.typingCallback);
            }
            if (callbacks.updateCallback) {
                webSocketService.unsubscribe(`/topic/conversation/${conversation.id}/update`, callbacks.updateCallback);
            }
            if (callbacks.messageStatusCallback) {
                webSocketService.unsubscribe('/user/queue/message-status', callbacks.messageStatusCallback);
            }
            if (callbacks.readReceiptCallback) {
                webSocketService.unsubscribe('/user/queue/read-receipt', callbacks.readReceiptCallback);
            }

            // Clear typing users on unmount
            setTypingUsers([]);

            // ✅ Reset callbacks ref
            subscriptionCallbacksRef.current = {
                messageCallback: null,
                typingCallback: null,
                updateCallback: null,
                messageStatusCallback: null,
                readReceiptCallback: null
            };
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

    // 🆕 Manage header animations based on message events and window state
    useEffect(() => {
        // Reset animations when unread count changes
        if (unreadCount > 0) {
            if (minimized) {
                // Window minimized with unread messages - apply glow effect
                setHeaderAnimation('unread');
            } else if (!isActive) {
                // Window open but not active with new message - apply flash effect
                setHeaderAnimation('flash');
                // Remove flash after animation completes
                setTimeout(() => setHeaderAnimation(''), 600);
            }
        } else {
            // No unread messages - clear animations
            setHeaderAnimation('');
        }
    }, [unreadCount, minimized, isActive]);

    // 🆕 Handle visibility change for pulse effect when returning to tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && unreadCount > 0) {
                // User returned to tab with unread messages - apply pulse effect
                setHeaderAnimation('pulse');
                setTimeout(() => setHeaderAnimation(''), 800);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [unreadCount]);

    // 🆕 Handle click on window to clear animations and mark as read
    const handleWindowClick = useCallback(() => {
        // Clear all animations when user clicks on window
        setHeaderAnimation('');

        // Call parent onWindowClick
        onWindowClick();
    }, [onWindowClick]);

    // 🆕 Handle minimize click to potentially show animations
    const handleMinimizeClick = useCallback(() => {
        if (unreadCount > 0 && !minimized) {
            // If minimizing with unread messages, ensure glow effect shows
            setHeaderAnimation('unread');
        }
        onMinimize();
    }, [unreadCount, minimized, onMinimize]);

    return (
        <div
            className={`chat-window ${minimized ? 'minimized' : 'open'} ${isActive ? 'active' : ''}`}
            data-conversation-id={conversation?.id}
            data-friend-id={conversation?.id}
            onClick={handleWindowClick}
        >
            <div className={`chat-window-header ${unreadCount > 0 ? 'unread' : ''} ${headerAnimation}`} onClick={onMinimize}>
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
                            handleMinimizeClick();
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
                                    {msg.isLocation ? (
                                        <div className="location-message-card">
                                            <div className="location-card-image">
                                                <img src={msg.content.image} alt={msg.content.name} />
                                                <div className="location-card-overlay"><img src="/icons/location.svg" alt="location" /></div>
                                            </div>
                                            <div className="location-card-content">
                                                <div className="location-card-title">{msg.content.name}</div>
                                                <div className="location-card-description">{msg.content.description}</div>
                                                <button
                                                    className="location-card-button"
                                                    onClick={() => window.focusLocation?.(msg.content.coordinates[0], msg.content.coordinates[1], msg.content.name)}
                                                >
                                                    🗺️ Xem trên bản đồ
                                                    {/*<img src="/icons/map-outline.svg" alt="map"/> Xem trên bản đồ*/}
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


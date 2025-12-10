import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './Chat.css';
import './ChatWindows.css';
import './LocationMessage.css';
import ChatWindow from './ChatWindow';
import { ChatService } from '../../services/ChatService';
import { webSocketService } from '../../services/WebSocketChatService';
import { userService } from '../../services/userService';
import useRealtimeStatus from '../../hooks/useRealtimeStatus';
import { getLocationDisplayText } from '../../utils/locationMessageUtils';

export default function SideChat() {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeFriend, setActiveFriend] = useState(null);

    // Get current user ID from token for localStorage key
    const getStorageKey = (key) => {
        try {
            const token = localStorage.getItem('authToken');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userId = payload.userId || payload.id || payload.sub;
                return `${key}_${userId}`;
            }
        } catch (e) {
            console.error('Failed to get user ID from token:', e);
        }
        return null;
    };

    // Initialize openChatWindows from localStorage
    const [openChatWindows, setOpenChatWindows] = useState(() => {
        try {
            const storageKey = getStorageKey('openChatWindows');
            if (storageKey) {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    return new Map(parsed);
                }
            }
        } catch (e) {
            console.error('Failed to parse saved chat windows:', e);
        }
        return new Map();
    });

    // Initialize activeChatWindow from localStorage
    const [activeChatWindow, setActiveChatWindow] = useState(() => {
        try {
            const storageKey = getStorageKey('activeChatWindow');
            if (storageKey) {
                return localStorage.getItem(storageKey) || null;
            }
        } catch {
            // ignore - localStorage might not be available
        }
        return null;
    });

    const [conversations, setConversations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [userStatuses, setUserStatuses] = useState(new Map()); // Map userId -> {isOnline, lastSeen}
    const [openMenuId, setOpenMenuId] = useState(null); // Track which conversation menu is open
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 }); // Position for fixed menu
    const wsConnectedRef = useRef(false);
    const conversationIdsRef = useRef(new Set()); // Track conversation IDs to detect new conversations
    const activeChatWindowRef = useRef(null); // Track active window with ref for immediate access
    const conversationsRef = useRef([]); // Track latest conversations for callbacks
    const menuRef = useRef(null); // Ref for menu popup to detect outside clicks

    // Save openChatWindows to localStorage whenever it changes
    useEffect(() => {
        try {
            const storageKey = getStorageKey('openChatWindows');
            if (storageKey) {
                const serialized = JSON.stringify(Array.from(openChatWindows.entries()));
                localStorage.setItem(storageKey, serialized);
            }
        } catch (e) {
            console.error('Failed to save chat windows:', e);
        }
    }, [openChatWindows]);

    // Save activeChatWindow to localStorage whenever it changes
    useEffect(() => {
        try {
            const storageKey = getStorageKey('activeChatWindow');
            if (storageKey) {
                if (activeChatWindow) {
                    localStorage.setItem(storageKey, activeChatWindow);
                } else {
                    localStorage.removeItem(storageKey);
                }
            }
        } catch (e) {
            console.error('Failed to save active chat window:', e);
        }
    }, [activeChatWindow]);

    // Sync activeChatWindowRef with activeChatWindow state
    useEffect(() => {
        activeChatWindowRef.current = activeChatWindow;
    }, [activeChatWindow]);

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
                        lastMessageContent: getLocationDisplayText(conv.lastMessageContent)
                    };
                }
                return conv;
            }).map(conv => ({ ...conv, typingUsers: [] })); // Add typingUsers array
            setConversations(processedData);
            conversationsRef.current = processedData; // Keep ref in sync

            // Sync restored chat windows with loaded conversations
            // Update chat windows with fresh conversation data
            setOpenChatWindows(prev => {
                if (prev.size === 0) return prev;

                const newMap = new Map();
                prev.forEach((chatData, convId) => {
                    const freshConv = processedData.find(c => c.id === convId);
                    if (freshConv) {
                        // Update with fresh data but keep minimized state
                        newMap.set(convId, { ...freshConv, minimized: chatData.minimized });
                    }
                    // If conversation not found (deleted/cleared), don't restore it
                });
                return newMap;
            });
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Subscribe to WebSocket (đã được kết nối từ App.jsx)
    useEffect(() => {
        const initializeWebSocketSubscriptions = () => {
            if (!webSocketService.stompClient?.connected) {
                console.log('⏸️ WebSocket chưa connected, bỏ qua subscribe');
                return;
            }

            console.log('✅ WebSocket đã kết nối toàn cục, thực hiện subscribe');
            setIsConnected(true);
            wsConnectedRef.current = true;

            // Lấy userId từ WebSocket service (đã được fetch từ backend)
            const userId = webSocketService.getCurrentUserId();
            setCurrentUserId(userId);

            // Subscribe to user queue for unread counts
            webSocketService.subscribeToUserQueue(
                (unreadDTO) => {
                    console.log('📊 Received unread count update:', unreadDTO);
                    // Update unread count for conversation
                    setConversations(prev => prev.map(conv => {
                        if (conv.id === unreadDTO.conversationId) {
                            console.log(`📊 Updating unread count for conv ${conv.id}: ${conv.unreadCount} → ${unreadDTO.count}`);
                            return { ...conv, unreadCount: unreadDTO.count };
                        }
                        return conv;
                    }));
                },
                (error) => {
                    console.error('WebSocket error:', error);
                }
            );

            // Subscribe to conversation updates
            webSocketService.subscribeToConversationUpdates(
                (updateDTO) => {
                    console.log('🔄 Received conversation update:', updateDTO);
                    // Update conversation with new last message and unread count
                    let lastMessageContent = updateDTO.lastMessageContent;
                    if (updateDTO.lastMessageContent?.startsWith('LOCATION:')) {
                        lastMessageContent = getLocationDisplayText(updateDTO.lastMessageContent);
                    }

                    setConversations(prev => prev.map(conv => {
                        if (conv.id === updateDTO.conversationId) {
                            console.log(`🔄 Updating conversation ${conv.id} with unread count: ${updateDTO.unreadCount}`);
                            return {
                                ...conv,
                                lastMessageContent: lastMessageContent,
                                lastMessageSenderId: updateDTO.lastMessageSenderId,
                                lastMessageAt: updateDTO.lastMessageAt,
                                unreadCount: updateDTO.unreadCount
                            };
                        }
                        return conv;
                    }));
                },
                (error) => {
                    console.error('Conversation update error:', error);
                }
            );
        };

        // Kiểm tra ngay khi mount
        console.log('🔍 SideChat mounting, checking WebSocket status...');
        console.log('🔍 WebSocket.stompClient:', webSocketService.stompClient);
        console.log('🔍 WebSocket.connected:', webSocketService.stompClient?.connected);

        let retryInterval = null;
        let retryCount = 0;
        const maxRetries = 10; // Retry tối đa 10 lần
        const retryDelay = 500; // 500ms giữa mỗi lần retry
        let isSubscribed = false; // Track xem đã subscribe thành công chưa

        const trySubscribe = () => {
            if (isSubscribed) return; // Đã subscribe rồi, không cần retry nữa

            if (webSocketService.stompClient?.connected) {
                console.log(`✅ WebSocket connected (attempt ${retryCount}), initializing subscriptions`);
                initializeWebSocketSubscriptions();
                isSubscribed = true;
                if (retryInterval) {
                    clearInterval(retryInterval);
                    retryInterval = null;
                }
            } else {
                retryCount++;
                if (retryCount >= maxRetries) {
                    console.warn(`⚠️ WebSocket vẫn chưa connected sau ${maxRetries} lần retry. Chờ event...`);
                    if (retryInterval) {
                        clearInterval(retryInterval);
                        retryInterval = null;
                    }
                } else {
                    console.log(`🔄 Retry ${retryCount}/${maxRetries}: Checking WebSocket connection...`);
                }
            }
        };

        // Check ngay lập tức
        if (webSocketService.stompClient?.connected) {
            console.log('✅ WebSocket already connected, initializing subscriptions');
            initializeWebSocketSubscriptions();
            isSubscribed = true;
        } else {
            console.log('⏸️ Đang chờ WebSocket từ App.jsx...');
            // 🔄 Retry mỗi 500ms, tối đa 10 lần (5 giây)
            retryInterval = setInterval(trySubscribe, retryDelay);
        }

        // Lắng nghe event websocket-connected từ App.jsx
        const handleWebSocketConnected = () => {
            if (isSubscribed) return; // Đã subscribe rồi
            console.log('🎉 SideChat received websocket-connected event');
            initializeWebSocketSubscriptions();
            isSubscribed = true;
            if (retryInterval) {
                clearInterval(retryInterval);
                retryInterval = null;
            }
        };

        window.addEventListener('websocket-connected', handleWebSocketConnected);

        return () => {
            if (retryInterval) clearInterval(retryInterval);
            window.removeEventListener('websocket-connected', handleWebSocketConnected);
            console.log('🔌 SideChat unmounting, giữ WebSocket connection');
        };
    }, []);

    // Load conversations on mount - CRITICAL: Load BEFORE subscribing
    useEffect(() => {
        console.log('🔄 Loading conversations on mount');
        loadConversations();
    }, [loadConversations]);

    // 🆕 Lắng nghe soft-sync event từ TokenMonitor (thay vì reload page)
    useEffect(() => {
        const handleSoftSync = async (event) => {
            console.log('🔄 [SideChat] Soft sync triggered:', event.detail);

            // 1. Reload conversations để lấy data mới nhất
            await loadConversations();

            // 2. Sync messages cho các chat windows đang mở
            openChatWindows.forEach((_, convId) => {
                window.dispatchEvent(new CustomEvent('sync-chat-messages', {
                    detail: { conversationId: convId }
                }));
            });

            // 3. Reconnect WebSocket nếu cần
            if (!webSocketService.stompClient?.connected) {
                console.log('🔌 [SideChat] WebSocket disconnected, reconnecting...');
                webSocketService.reconnect();
            }

            console.log('✅ [SideChat] Soft sync completed');
        };

        window.addEventListener('soft-sync-required', handleSoftSync);

        return () => {
            window.removeEventListener('soft-sync-required', handleSoftSync);
        };
    }, [loadConversations, openChatWindows]);

    // ✅ Facebook-style: Click outside to deactivate active chat window
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Don't deactivate if clicking on chat-related elements
            const chatContainer = document.getElementById('chatWindowsContainer');
            const sideChat = document.querySelector('.side-chat');
            const chatToggle = document.querySelector('.chat-toggle');

            // If click is inside chat windows container, side chat, or chat toggle, don't deactivate
            if (chatContainer?.contains(event.target) ||
                sideChat?.contains(event.target) ||
                chatToggle?.contains(event.target)) {
                return;
            }

            // Click outside - deactivate active chat window
            if (activeChatWindow) {
                console.log('👆 Click outside - deactivating active chat window');
                setActiveChatWindow(null);
                activeChatWindowRef.current = null;
            }
        };

        // Add event listener
        document.addEventListener('mousedown', handleClickOutside);

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeChatWindow]);

    // ✅ Reload conversations when SideChat opens to get latest data
    useEffect(() => {
        if (isChatOpen) {
            console.log('📂 SideChat opened - reloading conversations to get latest messages');
            loadConversations();
        }
    }, [isChatOpen, loadConversations]);

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

    // Keep conversationsRef in sync with conversations state
    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    // Separate effect to subscribe to NEW conversations when they appear
    useEffect(() => {
        // ✅ Reduced logging - only process when ready
        if (!isConnected || conversations.length === 0 || !currentUserId) {
            return;
        }

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
                if ((message.content && message.content.startsWith('LOCATION:')) || message.isLocation) {
                    lastMessageContent = getLocationDisplayText(message.content);
                }

                // Check if message is from someone else
                const isFromOthers = message.senderId !== currentUserId;

                // 🆕 Facebook-style: Auto-open ChatWindow if message is from others and window not opened yet
                if (isFromOthers) {
                    setOpenChatWindows(prev => {
                        // Only open if not already opened
                        if (!prev.has(conv.id)) {
                            console.log(`💬 Auto-opening ChatWindow for conv ${conv.id} (new message from others)`);

                            // Set this conversation as active immediately
                            setActiveChatWindow(conv.id);
                            activeChatWindowRef.current = conv.id;
                            setActiveFriend(conv.id);

                            // First, try to get from current conversations state (in-memory, fast)
                            const cachedConv = conversationsRef.current.find(c => c.id === conv.id);

                            if (cachedConv) {
                                // Use cached data immediately - Open EXPANDED (not minimized) like Facebook
                                console.log('📋 Using cached conversation data for auto-open (expanded & active)');
                                const newMap = new Map(prev);
                                newMap.set(conv.id, { ...cachedConv, minimized: false });
                                return newMap;
                            } else {
                                // Fetch fresh conversation data from API (Facebook approach)
                                console.log('🔄 Fetching conversation data from API for auto-open');
                                ChatService.getConversation(conv.id)
                                    .then(fetchedConv => {
                                        console.log('✅ Fetched conversation data:', fetchedConv);

                                        // Add to conversations list if not exists
                                        setConversations(prevConvs => {
                                            const exists = prevConvs.find(c => c.id === conv.id);
                                            if (!exists) {
                                                return [{ ...fetchedConv, typingUsers: [] }, ...prevConvs];
                                            }
                                            return prevConvs;
                                        });

                                        // Open chat window EXPANDED (not minimized) like Facebook
                                        setOpenChatWindows(prevWindows => {
                                            const newMap = new Map(prevWindows);
                                            newMap.set(conv.id, { ...fetchedConv, minimized: false });
                                            return newMap;
                                        });
                                    })
                                    .catch(error => {
                                        console.error('Failed to fetch conversation for auto-open:', error);
                                    });

                                return prev; // Return unchanged while fetching
                            }
                        }
                        return prev;
                    });
                }

                // Update conversation's last message
                setConversations(prev => prev.map(c => {
                    if (c.id === conv.id) {
                        console.log(`✏️ Updating last message for conv ${conv.id}:`, lastMessageContent);

                        const newUnreadCount = isFromOthers ? (c.unreadCount || 0) + 1 : c.unreadCount;

                        if (isFromOthers) {
                            console.log(`📬 Incrementing unread count for conv ${conv.id}: ${c.unreadCount} → ${newUnreadCount}`);
                        }

                        return {
                            ...c,
                            lastMessageContent: lastMessageContent,
                            lastMessageSenderId: message.senderId,
                            lastMessageAt: message.createdAt || message.timestamp || new Date().toISOString(),
                            unreadCount: newUnreadCount
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
                        let hasChanged = false;

                        if (isTyping) {
                            // User started typing
                            if (!newTypingUsers.includes(typingDTO.userId)) {
                                newTypingUsers.push(typingDTO.userId);
                                hasChanged = true;
                                console.log(`✍️ User ${typingDTO.userId} started typing in conv ${conv.id}`);
                            }
                        } else {
                            // User stopped typing
                            const beforeLength = newTypingUsers.length;
                            newTypingUsers = newTypingUsers.filter(id => id !== typingDTO.userId);
                            hasChanged = beforeLength !== newTypingUsers.length;
                            if (hasChanged) {
                                console.log(`⏹️ User ${typingDTO.userId} stopped typing in conv ${conv.id}`);
                            }
                        }

                        // Only update if actually changed to prevent unnecessary re-renders
                        if (hasChanged) {
                            console.log(`📝 Updated typingUsers for conv ${conv.id}:`, newTypingUsers);
                            return { ...c, typingUsers: newTypingUsers };
                        }
                        return c; // No change, return same reference
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

            // ✅ IMPORTANT: Fetch current typing users after subscribing
            // This ensures we see typing status from users who started typing BEFORE we subscribed
            ChatService.getTypingUsers(conv.id)
                .then(typingUserIds => {
                    console.log(`📋 Fetched current typing users for conv ${conv.id}:`, typingUserIds);

                    if (typingUserIds && typingUserIds.length > 0) {
                        setConversations(prev => prev.map(c => {
                            if (c.id === conv.id) {
                                // Filter out duplicates and current user
                                const uniqueTypingUsers = [...new Set([...(c.typingUsers || []), ...typingUserIds])]
                                    .filter(userId => userId !== currentUserId);

                                console.log(`✍️ Setting initial typing users for conv ${conv.id}:`, uniqueTypingUsers);
                                return { ...c, typingUsers: uniqueTypingUsers };
                            }
                            return c;
                        }));
                    }
                })
                .catch(error => {
                    console.error(`Failed to fetch typing users for conv ${conv.id}:`, error);
                });
        });

        console.log(`📊 Subscribe summary: ${subscribedCount} new, ${skippedCount} skipped, ${conversationIdsRef.current.size} total tracked`);

        // NO cleanup function here - subscriptions persist across state updates
        // Cleanup only happens in the isConnected effect above
    }, [conversations, isConnected, currentUserId]); // ✅ Add currentUserId to deps

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

    // Load user statuses for conversations
    useEffect(() => {
        const loadUserStatuses = async () => {
            if (!conversations.length || !currentUserId) return;

            const userIdsToLoad = new Set();

            conversations.forEach(conv => {
                if (!conv.isGroup) {
                    const otherUser = conv.otherUser || conv.members?.find(m => m.userId !== currentUserId);
                    if (otherUser?.userId) {
                        userIdsToLoad.add(otherUser.userId);
                    }
                }
            });

            if (userIdsToLoad.size === 0) return;

            console.log('📥 Loading user statuses for:', Array.from(userIdsToLoad));

            const loadPromises = Array.from(userIdsToLoad).map(async (userId) => {
                try {
                    const status = await userService.getUserStatus(userId);
                    return { userId, status };
                } catch (error) {
                    console.error(`Failed to load status for user ${userId}:`, error);
                    return { userId, status: { isOnline: false, lastSeen: 'unknown' } };
                }
            });

            const results = await Promise.all(loadPromises);

            setUserStatuses(prev => {
                const newMap = new Map(prev);
                results.forEach(({ userId, status }) => {
                    newMap.set(userId, status);
                });
                return newMap;
            });
        };

        loadUserStatuses();
    }, [conversations, currentUserId]); // ✅ Removed userStatuses to prevent infinite loop

    // Refresh user statuses when tab becomes visible
    useEffect(() => {
        const refreshStatusesOnVisible = async () => {
            if (document.visibilityState === 'visible' && conversations.length > 0 && currentUserId) {
                console.log('👁️ Tab visible - refreshing user statuses');

                const userIdsToRefresh = new Set();
                conversations.forEach(conv => {
                    if (!conv.isGroup) {
                        const otherUser = conv.otherUser || conv.members?.find(m => m.userId !== currentUserId);
                        if (otherUser?.userId) {
                            userIdsToRefresh.add(otherUser.userId);
                        }
                    }
                });

                if (userIdsToRefresh.size === 0) return;

                const loadPromises = Array.from(userIdsToRefresh).map(async (userId) => {
                    try {
                        const status = await userService.getUserStatus(userId);
                        return { userId, status };
                    } catch (error) {
                        console.error(`Failed to refresh status for user ${userId}:`, error);
                        return null;
                    }
                });

                const results = await Promise.all(loadPromises);

                setUserStatuses(prev => {
                    const newMap = new Map(prev);
                    results.forEach(result => {
                        if (result) {
                            newMap.set(result.userId, result.status);
                        }
                    });
                    return newMap;
                });
            }
        };

        const handleVisibilityChange = () => {
            refreshStatusesOnVisible();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [conversations, currentUserId]);

    // Handle realtime status updates - simple online/offline for SideChat
    const handleStatusChange = useCallback((userId, status) => {
        console.log('🔄 SideChat realtime status update:', { userId, status });

        setUserStatuses(prev => {
            const newMap = new Map(prev);

            // Always update to ensure all users get real-time updates
            if (status === 'online') {
                console.log(`✅ User ${userId} is now ONLINE`);
                newMap.set(userId, { isOnline: true, lastSeen: null });
            } else if (status === 'offline') {
                console.log(`⭕ User ${userId} is now OFFLINE`);
                newMap.set(userId, { isOnline: false, lastSeen: new Date().toISOString() });
            }

            return newMap;
        });
    }, []);

    // Use realtime status hook
    useRealtimeStatus(handleStatusChange);

    // Listen for status updates from ChatWindow
    useEffect(() => {
        const handleUserStatusChange = (event) => {
            const { userId, status } = event.detail;
            console.log('🔄 SideChat received status change from ChatWindow:', { userId, status });
            handleStatusChange(userId, status);
        };

        window.addEventListener('userStatusChange', handleUserStatusChange);

        return () => {
            window.removeEventListener('userStatusChange', handleUserStatusChange);
        };
    }, [handleStatusChange]);

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

        // Set as active chat window (Facebook-style) - both state and ref
        console.log('🎯 Setting active chat window (handleFriendClick):', conversation.id);
        setActiveChatWindow(conversation.id);
        activeChatWindowRef.current = conversation.id; // Immediate update via ref

        // Open chat window (mark as read will be handled by ChatWindow when it becomes active)
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
                const willBeMinimized = !chatWindow.minimized;

                // ✅ IMPORTANT: ANY minimized window should NOT be active
                if (willBeMinimized) {
                    // Minimizing - always clear active if this window is active
                    if (activeChatWindow === conversationId) {
                        console.log('🔽 Minimizing window, clearing active state:', conversationId);
                        setActiveChatWindow(null);
                        activeChatWindowRef.current = null;
                    } else {
                        console.log('🔽 Minimizing inactive window:', conversationId);
                    }
                } else {
                    // Un-minimizing - set as active
                    console.log('🔼 Un-minimizing window, setting as active:', conversationId);
                    setActiveChatWindow(conversationId);
                    activeChatWindowRef.current = conversationId;
                }

                newMap.set(conversationId, { ...chatWindow, minimized: willBeMinimized });
            }
            return newMap;
        });
    }, [activeChatWindow]);

    // Handle chat window click to set as active (Facebook-style)
    const handleChatWindowClick = useCallback((conversationId) => {
        console.log('🎯 Setting active chat window (handleChatWindowClick):', conversationId);
        setActiveChatWindow(conversationId);
        activeChatWindowRef.current = conversationId; // Immediate update via ref
    }, []);

    // Handle mark as read callback from ChatWindow
    const handleMarkAsRead = useCallback((conversationId) => {
        console.log('📖 Mark as read callback for:', conversationId);
        setConversations(prev => prev.map(conv =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        ));
    }, []);

    // Handle new messages from WebSocket
    const handleNewMessage = useCallback((conversationId, message) => {
        let lastMessageContent = message.content;

        // Check if content is string before using startsWith
        if (typeof message.content === 'string') {
            if (message.content.startsWith('LOCATION:')) {
                lastMessageContent = '📍 ' + getLocationDisplayText(message.content);
            } else if (message.content.startsWith('SHOP:')) {
                lastMessageContent = '🏪 Cửa hàng';
            }
        } else if (typeof message.content === 'object') {
            // Content đã được parse thành object
            if (message.isLocation) {
                lastMessageContent = '📍 Địa điểm: ' + (message.content?.name || 'Vị trí');
            } else {
                lastMessageContent = '[Tin nhắn đa phương tiện]';
            }
        }

        setConversations(prev => prev.map(conv => {
            if (conv.id === conversationId) {
                return {
                    ...conv,
                    lastMessageContent: lastMessageContent,
                    lastMessageTime: message.createdAt || message.timestamp,
                    lastMessageSender: message.senderName,
                };
            }
            return conv;
        }));
    }, []);

    // Toggle conversation menu
    const handleMenuToggle = useCallback((e, conversationId) => {
        e.stopPropagation(); // Prevent opening chat window

        if (openMenuId === conversationId) {
            setOpenMenuId(null);
            return;
        }

        // Calculate position for fixed menu (show right below the conversation item)
        const friendItem = e.currentTarget.closest('.friend-item');
        const rect = friendItem.getBoundingClientRect();
        const menuWidth = 250; // min-width of menu

        // Position menu aligned with conversation, but ensure it stays on screen
        let left = rect.left;

        // If menu would go off the right edge, align to right edge instead
        if (left + menuWidth > window.innerWidth - 10) {
            left = rect.right - menuWidth;
        }

        // Ensure minimum left position
        if (left < 10) {
            left = 10;
        }

        const position = {
            top: rect.bottom,
            left: left
        };

        setMenuPosition(position);
        setOpenMenuId(conversationId);
    }, [openMenuId]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            // Ignore clicks on menu button
            if (e.target.closest('.conv-menu-btn')) {
                return;
            }
            if (openMenuId && menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenuId(null);
            }
        };

        if (openMenuId) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [openMenuId]);

    // Handle mark as unread
    const handleMarkAsUnread = useCallback(async (e, conversationId) => {
        e.stopPropagation();
        try {
            await ChatService.markAsUnread(conversationId);
            setConversations(prev => prev.map(conv =>
                conv.id === conversationId ? { ...conv, unreadCount: Math.max(conv.unreadCount, 1) } : conv
            ));
            setOpenMenuId(null);
        } catch (error) {
            console.error('Failed to mark as unread:', error);
        }
    }, []);

    // Handle mute notifications
    const handleMuteNotification = useCallback(async (e, conversationId) => {
        e.stopPropagation();
        try {
            const conv = conversations.find(c => c.id === conversationId);
            const isMuted = conv?.isMuted;
            await ChatService.toggleMuteConversation(conversationId, !isMuted);
            setConversations(prev => prev.map(c =>
                c.id === conversationId ? { ...c, isMuted: !isMuted } : c
            ));
            setOpenMenuId(null);
        } catch (error) {
            console.error('Failed to toggle mute:', error);
        }
    }, [conversations]);

    // Handle delete conversation
    const handleDeleteConversation = useCallback(async (e, conversationId) => {
        e.stopPropagation();
        if (!window.confirm('Bạn có chắc chắn muốn xóa đoạn chat này?')) return;

        try {
            await ChatService.deleteConversation(conversationId);
            setConversations(prev => prev.filter(conv => conv.id !== conversationId));
            // Close chat window if open
            setOpenChatWindows(prev => {
                const newMap = new Map(prev);
                newMap.delete(conversationId);
                return newMap;
            });
            setOpenMenuId(null);
        } catch (error) {
            console.error('Failed to delete conversation:', error);
        }
    }, []);

    // Handle leave group
    const handleLeaveGroup = useCallback(async (e, conversationId) => {
        e.stopPropagation();
        if (!window.confirm('Bạn có chắc chắn muốn rời khỏi nhóm này?')) return;

        try {
            await ChatService.leaveGroup(conversationId);
            setConversations(prev => prev.filter(conv => conv.id !== conversationId));
            // Close chat window if open
            setOpenChatWindows(prev => {
                const newMap = new Map(prev);
                newMap.delete(conversationId);
                return newMap;
            });
            setOpenMenuId(null);
        } catch (error) {
            console.error('Failed to leave group:', error);
        }
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
    const filteredConversations = useMemo(() => {
        return sortedConversations.filter(conv => {
            const displayName = conv.isGroup ? conv.groupName : conv.otherUser?.displayName || '';
            return displayName.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [sortedConversations, searchQuery]);

    // Get display info for conversation - simple online/offline for SideChat
    // ✅ useCallback to make it reactive to userStatuses changes
    const getConversationDisplay = useCallback((conv) => {
        if (conv.isGroup) {
            return {
                name: conv.groupName || 'Nhóm',
                avatar: conv.groupAvatar || '/channels/myprofile.jpg',
                status: `${conv.members?.length || 0} thành viên`,
                isOnline: false, // Groups don't have online status
            };
        } else {
            const otherUser = conv.otherUser || conv.members?.find(m => m.userId !== currentUserId);
            const userStatus = userStatuses.get(otherUser?.userId) || { isOnline: false, lastSeen: 'unknown' };
            return {
                name: otherUser?.fullName || 'User',
                avatar: otherUser?.avatarUrl || '/channels/myprofile.jpg',
                status: '', // No status text needed, blue dot shows online status
                isOnline: userStatus.isOnline,
            };
        }
    }, [currentUserId, userStatuses]); // Track userStatuses changes

    // Compute display info for all conversations to trigger re-render when userStatuses changes
    const conversationsWithDisplay = useMemo(() => {
        return filteredConversations.map(conv => ({
            ...conv,
            displayInfo: getConversationDisplay(conv)
        }));
    }, [filteredConversations, getConversationDisplay]);

    // Format last message display with truncation
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
            const maxLength = 30; // Maximum characters to display

            let displayContent = conv.lastMessageContent;
            if (displayContent.length > maxLength) {
                displayContent = displayContent.substring(0, maxLength) + '...';
            }

            return `${prefix}${displayContent}`;
        }

        return 'Bắt đầu trò chuyện';
    };

    // Format time ago like Facebook (e.g., "6 giờ", "2 phút", "vừa xong")
    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return '';

        const now = new Date();
        const messageTime = new Date(timestamp);
        const diffInSeconds = Math.floor((now - messageTime) / 1000);

        if (diffInSeconds < 60) {
            return 'vừa xong';
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes} phút`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours} giờ`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
            return `${diffInDays} ngày`;
        }

        const diffInWeeks = Math.floor(diffInDays / 7);
        if (diffInWeeks < 4) {
            return `${diffInWeeks} tuần`;
        }

        // For messages older than 4 weeks, show date
        return messageTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    // Refresh user statuses when SideChat popup opens
    useEffect(() => {
        if (isChatOpen && conversations.length > 0 && currentUserId) {
            console.log('💬 SideChat opened - refreshing user statuses for real-time updates');

            const userIdsToRefresh = new Set();
            conversations.forEach(conv => {
                if (!conv.isGroup) {
                    const otherUser = conv.otherUser || conv.members?.find(m => m.userId !== currentUserId);
                    if (otherUser?.userId) {
                        userIdsToRefresh.add(otherUser.userId);
                    }
                }
            });

            if (userIdsToRefresh.size === 0) return;

            const loadPromises = Array.from(userIdsToRefresh).map(async (userId) => {
                try {
                    const status = await userService.getUserStatus(userId);
                    return { userId, status };
                } catch (error) {
                    console.error(`Failed to refresh status for user ${userId}:`, error);
                    return null;
                }
            });

            Promise.all(loadPromises).then(results => {
                setUserStatuses(prev => {
                    const newMap = new Map(prev);
                    results.forEach(result => {
                        if (result) {
                            newMap.set(result.userId, result.status);
                        }
                    });
                    return newMap;
                });
            });
        }
    }, [isChatOpen, conversations, currentUserId]);

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
                    ) : conversationsWithDisplay.length === 0 ? (
                        <div className="chat-empty">Không có đoạn chat nào</div>
                    ) : (
                        conversationsWithDisplay.map((conv) => {
                            const display = conv.displayInfo; // ✅ Use pre-computed display info
                            const hasUnread = conv.unreadCount > 0;
                            const showBlueDot = hasUnread && conv.unreadCount <= 5; // Show dot for 1-5 unread

                            return (
                                <div
                                    key={conv.id}
                                    className={`friend-item ${activeFriend === conv.id ? 'active' : ''} ${hasUnread ? 'unread' : ''} ${showBlueDot ? 'has-dot' : ''}`}
                                    onClick={() => handleFriendClick(conv)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFriendClick(conv)}
                                    data-friend={conv.id}
                                >
                                    {/* Blue Dot Indicator for new messages */}
                                    {showBlueDot && <div className="unread-dot"></div>}

                                    <div className="friend-avatar-wrapper">
                                        <img src={display.avatar} alt="Avatar" className="friend-avatar" />
                                        {display.isOnline && <div className="friend-online-dot"></div>}
                                    </div>
                                    <div className="friend-info">
                                        <div className="friend-name">
                                            {display.name}
                                            {conv.isMuted && (
                                                <img
                                                    src="/icons/notifications-off-outline.svg"
                                                    alt="Đã tắt thông báo"
                                                    className="muted-icon"
                                                    title="Đã tắt thông báo"
                                                />
                                            )}
                                        </div>
                                        <div className="friend-status">
                                            <span className="last-message">{getLastMessageDisplay(conv)}</span>
                                            {/* Only show timestamp if NOT typing and has last message */}
                                            {!conv.typingUsers?.length && conv.lastMessageAt && conv.lastMessageContent && (
                                                <span className="friend-message-time"> · {formatTimeAgo(conv.lastMessageAt)}</span>
                                            )}
                                            {/* Show seen avatars if last message has been seen by others */}
                                            {conv.lastMessageSeenByUserIds && conv.lastMessageSeenByUserIds.length > 0 && (
                                                <div className="seen-avatars">
                                                    {conv.lastMessageSeenByUserIds
                                                        .filter(userId => userId !== currentUserId) // Exclude current user
                                                        .slice(0, 3) // Show max 3 avatars
                                                        .map(userId => {
                                                            const member = conv.members.find(m => m.userId === userId);
                                                            return member ? (
                                                                <img
                                                                    key={userId}
                                                                    src={member.avatarUrl || '/default-avatar.png'}
                                                                    alt=""
                                                                    className="seen-avatar"
                                                                    title={member.username}
                                                                />
                                                            ) : null;
                                                        })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ellipsis Menu Button - Shows on hover */}
                                    <button
                                        className="conv-menu-btn"
                                        onClick={(e) => handleMenuToggle(e, conv.id)}
                                        title="Tùy chọn"
                                    >
                                        <img src="/icons/ellipsis-horizontal-outline.svg" alt="Menu" />
                                    </button>


                                    {hasUnread && (
                                        <div className={`unread-count ${conv.unreadCount > 99 ? 'large' : ''}`}>
                                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                        </div>
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

                    // ✅ IMPORTANT: Minimized windows should NEVER be active
                    const isActive = chatData.minimized ? false : (activeChatWindow === conversationId);

                    return (
                        <ChatWindow
                            key={conversationId}
                            conversation={conversation}
                            minimized={chatData.minimized}
                            isActive={isActive}
                            currentUserId={currentUserId}
                            unreadCount={conversation.unreadCount || 0}
                            onClose={() => handleCloseChatWindow(conversationId)}
                            onMinimize={() => handleMinimizeChatWindow(conversationId)}
                            onNewMessage={(message) => handleNewMessage(conversationId, message)}
                            onMarkAsRead={handleMarkAsRead}
                            onWindowClick={() => handleChatWindowClick(conversationId)}
                        />
                    );
                })}
            </div>

            {/* Conversation Menu Popup - Rendered outside side-chat for proper positioning */}
            {openMenuId && (() => {
                const menuConv = conversations.find(c => c.id === openMenuId);
                const isGroup = menuConv?.isGroup || menuConv?.members?.length > 2;
                return (
                    <div
                        className="conv-menu-popup"
                        ref={menuRef}
                        style={{
                            top: `${menuPosition.top}px`,
                            left: `${menuPosition.left}px`
                        }}
                    >
                        <button
                            className="conv-menu-item"
                            onClick={(e) => handleMarkAsUnread(e, openMenuId)}
                        >
                            <span className="conv-menu-icon">📩</span>
                            Đánh dấu là chưa đọc
                        </button>
                        <button
                            className="conv-menu-item"
                            onClick={(e) => handleMuteNotification(e, openMenuId)}
                        >
                            <span className="conv-menu-icon">{menuConv?.isMuted ? '🔔' : '🔕'}</span>
                            {menuConv?.isMuted ? 'Bật thông báo' : 'Tắt thông báo'}
                        </button>
                        <button
                            className="conv-menu-item conv-menu-item-danger"
                            onClick={(e) => handleDeleteConversation(e, openMenuId)}
                        >
                            <span className="conv-menu-icon">🗑️</span>
                            Xóa đoạn chat
                        </button>
                        {isGroup && (
                            <button
                                className="conv-menu-item conv-menu-item-danger"
                                onClick={(e) => handleLeaveGroup(e, openMenuId)}
                            >
                                <span className="conv-menu-icon">🚪</span>
                                Rời nhóm
                            </button>
                        )}
                    </div>
                );
            })()}
        </>
    );
}

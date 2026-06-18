import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService';
import { notificationService } from '../../services/notificationService';
import { webSocketService } from '../../services/WebSocketChatService';
import { friendshipService } from '../../services/friendshipService';
import { FaUserPlus, FaUserCheck, FaStore, FaTimesCircle, FaBell } from 'react-icons/fa';

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'vừa xong';
  }
  if (diffMins < 60) {
    return `${diffMins} phút trước`;
  }
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }
  if (diffDays === 1) {
    return 'hôm qua';
  }
  return `${diffDays} ngày trước`;
};

export default function ProfileMenu() {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);

  // States cho thông báo
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsDropdownRef = useRef(null);

  // Lấy thông tin user từ localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Lấy dữ liệu thông báo từ API
  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data || []);
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Kết nối và đăng ký nhận thông báo real-time qua WebSocket
  useEffect(() => {
    if (!user) return;

    const handleWsMessage = (notification) => {
      console.log('Received real-time notification via WebSocket:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    if (webSocketService.isConnected()) {
      webSocketService.subscribe('/user/queue/notifications', handleWsMessage);
    }

    const onConnected = () => {
      webSocketService.subscribe('/user/queue/notifications', handleWsMessage);
    };
    window.addEventListener('websocket-connected', onConnected);

    return () => {
      webSocketService.unsubscribe('/user/queue/notifications', handleWsMessage);
      window.removeEventListener('websocket-connected', onConnected);
    };
  }, [user]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Đóng notifications dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSettings = () => {
    console.log('Mở settings');
    setIsDropdownOpen(false);
  };

  const handleProfile = () => {
    navigate('/profile');
    setIsDropdownOpen(false);
  };

  const handleDashboard = () => {
    console.log('Mở dashboard');
    navigate('/dashboard');
    setIsDropdownOpen(false);
  };

  const handleAcceptFriend = async (friendshipId, notificationId, event) => {
    event.stopPropagation();
    try {
      await friendshipService.acceptFriendRequest(friendshipId);
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prev => prev.map(n => n.id === notificationId ? { 
        ...n, 
        isRead: true, 
        content: "Bạn đã chấp nhận lời mời kết bạn." 
      } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to accept friend request:', err);
    }
  };

  const handleDeclineFriend = async (friendshipId, notificationId, event) => {
    event.stopPropagation();
    try {
      await friendshipService.cancelFriendRequest(friendshipId);
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prev => prev.map(n => n.id === notificationId ? { 
        ...n, 
        isRead: true, 
        content: "Bạn đã từ chối lời mời kết bạn." 
      } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to decline friend request:', err);
    }
  };

  // Click vào từng thông báo
  const handleNotificationClick = async (item) => {
    try {
      if (!item.isRead) {
        await notificationService.markAsRead(item.id);
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setIsNotificationsOpen(false);

      // Chuyển hướng hoặc xử lý dựa trên loại thông báo
      if (item.type === 'FRIEND_REQUEST' || item.type === 'FRIEND_ACCEPT') {
        navigate('/profile');
      } else if (item.type === 'SELLER_APPROVED' || item.type === 'SELLER_REJECTED') {
        navigate('/profile');
      }
    } catch (err) {
      console.error('Failed to click notification:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'FRIEND_REQUEST':
        return <FaUserPlus />;
      case 'FRIEND_ACCEPT':
        return <FaUserCheck />;
      case 'SELLER_APPROVED':
        return <FaStore />;
      case 'SELLER_REJECTED':
        return <FaTimesCircle />;
      default:
        return <FaBell />;
    }
  };

  // Lấy avatar URL hoặc dùng default
  const avatarUrl = user?.avatarUrl || '/channels/myprofile.jpg';
  const displayName = user?.displayName || 'Người dùng';
  const email = user?.email || 'user@example.com';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <>
      <div className="chat-container icon-btn" id="chatToggle">
        <img className="chat-icon" src="/icons/chatbubbles-outline.svg" alt="Chat" />
        {/*<span className="unread-messages">1</span>*/}
      </div>

      <div className="notifications-container" ref={notificationsDropdownRef}>
        <div 
          className="notifications-trigger icon-btn" 
          onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
        >
          <img className="notifications-icon" src="/icons/notifications.svg" alt="Notifications" />
          {unreadCount > 0 && (
            <span className="notification-count">{unreadCount}</span>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className={`notifications-dropdown ${isNotificationsOpen ? 'show' : ''}`}>
          <div className="notifications-header">
            <span className="notifications-title">Thông báo</span>
            {unreadCount > 0 && (
              <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
                Đánh dấu đã đọc tất cả
              </button>
            )}
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <FaBell className="no-notifications-icon" />
                <span className="no-notifications-text">Không có thông báo nào</span>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`notification-item ${item.isRead ? '' : 'unread'}`}
                  onClick={() => handleNotificationClick(item)}
                >
                  <div className={`notification-icon-wrapper ${item.type?.toLowerCase()}`}>
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="notification-item-content">
                    <div className="notification-item-title">{item.title}</div>
                    <div className="notification-item-body">{item.content}</div>
                    <div className="notification-item-time">{formatRelativeTime(item.createdAt)}</div>
                    {item.type === 'FRIEND_REQUEST' && !item.isRead && (
                      <div className="notification-actions">
                        <button 
                          className="notif-btn notif-accept-btn" 
                          onClick={(e) => handleAcceptFriend(item.relatedId, item.id, e)}
                        >
                          Chấp nhận
                        </button>
                        <button 
                          className="notif-btn notif-decline-btn" 
                          onClick={(e) => handleDeclineFriend(item.relatedId, item.id, e)}
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                  {!item.isRead && <span className="unread-dot"></span>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="profile-container" ref={dropdownRef}>
        <div
          className="profile-trigger icon-btn"
          onClick={toggleDropdown}
        >
          <img className="current-user-picture" src={avatarUrl} alt="User" />
          <img
            className={`arrow-down-icon ${isDropdownOpen ? 'rotated' : ''}`}
            src="/icons/arrow-down.svg"
            alt="Menu"
          />
        </div>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="profile-dropdown show">
            <div className="dropdown-header">
              <img className="dropdown-avatar" src={avatarUrl} alt="User" />
              <div className="dropdown-user-info">
                <div className="dropdown-username">{displayName}</div>
                <div className="dropdown-email">{email}</div>
              </div>
            </div>

            <div className="dropdown-divider"></div>

            <button className="dropdown-item profile" onClick={handleProfile}>
              <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Trang cá nhân
            </button>

            <button className="dropdown-item settings" onClick={handleSettings}>
              <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Cài đặt
            </button>

            {/* Chỉ hiển thị Dashboard nếu user là ADMIN */}
            {isAdmin && (
              <button className="dropdown-item dashboard" onClick={handleDashboard}>
                <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Dashboard
              </button>
            )}

            <button className="dropdown-item help" onClick={() => { console.log('Trợ giúp'); setIsDropdownOpen(false); }}>
              <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Trợ giúp
            </button>

            <div className="dropdown-divider"></div>

            <button className="dropdown-item logout" onClick={handleLogout}>
              <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </>
  );
}

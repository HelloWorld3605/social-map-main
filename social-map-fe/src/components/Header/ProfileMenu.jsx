import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProfileMenu() {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);

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

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    // Xóa token và user info khỏi localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Chuyển hướng về trang login
    navigate('/login', { replace: true });
  };

  const handleSettings = () => {
    // TODO: Chuyển đến trang settings
    console.log('Mở settings');
    setIsDropdownOpen(false);
  };

  const handleProfile = () => {
    // Chuyển đến trang profile của người dùng hiện tại
    navigate('/profile');
    setIsDropdownOpen(false);
  };

  const handleDashboard = () => {
    // Chuyển đến trang dashboard
    console.log('Mở dashboard');
    navigate('/dashboard');
    setIsDropdownOpen(false);
  };

  // Lấy avatar URL hoặc dùng default
  const avatarUrl = user?.avatarUrl || '/channels/myprofile.jpg';
  const displayName = user?.displayName || 'Người dùng';
  const email = user?.email || 'user@example.com';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <>
      <div className="chat-container" id="chatToggle">
        <img className="chat-icon" src="/icons/chatbubbles-outline.svg" alt="Chat" />
        <span className="unread-messages">1</span>
      </div>

      <div className="notifications-container">
        <img className="notifications-icon" src="/icons/notifications.svg" alt="Notifications" />
        <span className="notification-count">3</span>
      </div>

      <div className="profile-container" ref={dropdownRef}>
        <div
          className="profile-trigger"
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

            <button className="dropdown-item" onClick={handleProfile}>
              <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Trang cá nhân
            </button>

            <button className="dropdown-item" onClick={handleSettings}>
              <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Cài đặt
            </button>

            {/* Chỉ hiển thị Dashboard nếu user là ADMIN */}
            {isAdmin && (
              <button className="dropdown-item" onClick={handleDashboard}>
                <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Dashboard
              </button>
            )}

            <button className="dropdown-item" onClick={() => { console.log('Trợ giúp'); setIsDropdownOpen(false); }}>
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

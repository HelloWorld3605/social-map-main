import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { friendshipService } from '../../services/friendshipService';
import { ChatService } from '../../services/ChatService';
import EditProfileModal from '../../components/Profile/EditProfileModal';
import './ProfilePage.css';

export default function ProfilePage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [friendshipStatus, setFriendshipStatus] = useState(null);
    const [friendshipId, setFriendshipId] = useState(null);
    const [mutualFriendsCount, setMutualFriendsCount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Load user profile
    useEffect(() => {
        const loadProfile = async () => {
            try {
                setIsLoading(true);

                // Load current user
                const currentUserData = await userService.getMyProfile();
                setCurrentUser(currentUserData);

                // If viewing own profile
                if (!userId || userId === currentUserData.id) {
                    setUser(currentUserData);
                    setIsLoading(false);
                    return;
                }

                // Load other user's profile
                const userData = await userService.getProfile(userId);
                setUser(userData);

                // Load friendship status
                const status = await friendshipService.getFriendshipStatus(userId);
                setFriendshipStatus(status);

                // Load mutual friends count
                const mutualCount = await userService.getMutualFriendsCount(userId);
                setMutualFriendsCount(mutualCount);

            } catch (error) {
                console.error('Failed to load profile:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [userId]);

    // Handle send friend request
    const handleAddFriend = async () => {
        if (isProcessing) return;

        try {
            setIsProcessing(true);
            await friendshipService.sendFriendRequest(userId);
            setFriendshipStatus('PENDING');
        } catch (error) {
            console.error('Failed to send friend request:', error);
            alert('Không thể gửi lời mời kết bạn');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle accept friend request - Cần lấy friendshipId từ pending requests
    const handleAcceptFriend = async () => {
        if (isProcessing) return;

        try {
            setIsProcessing(true);

            // Lấy danh sách pending requests để tìm friendshipId
            const pendingRequests = await friendshipService.getPendingRequests();
            const request = pendingRequests.find(req =>
                req.senderId === userId || req.receiverId === userId
            );

            if (!request) {
                alert('Không tìm thấy lời mời kết bạn');
                return;
            }

            await friendshipService.acceptFriendRequest(request.id);
            setFriendshipStatus('ACCEPTED');
        } catch (error) {
            console.error('Failed to accept friend request:', error);
            alert('Không thể chấp nhận lời mời kết bạn');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle unfriend
    const handleUnfriend = async () => {
        if (isProcessing) return;

        if (!confirm('Bạn có chắc muốn hủy kết bạn?')) return;

        try {
            setIsProcessing(true);
            await friendshipService.unfriend(userId);
            setFriendshipStatus('NONE');
        } catch (error) {
            console.error('Failed to unfriend:', error);
            alert('Không thể hủy kết bạn');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle cancel friend request
    const handleCancelRequest = async () => {
        if (isProcessing) return;

        try {
            setIsProcessing(true);

            // Kiểm tra xem đây là lời mời đã gửi hay đã nhận
            let friendshipId = null;

            // Nếu status là PENDING, tìm trong sent requests (mình đã gửi)
            if (friendshipStatus === 'PENDING') {
                const sentRequests = await friendshipService.getSentRequests();
                const request = sentRequests.find(req => req.receiverId === userId);
                if (request) {
                // So sánh với toString() vì backend trả về UUID
                const request = sentRequests.find(req => req.receiverId.toString() === userId);
                }
            }
            // Nếu status là RECEIVED, tìm trong pending requests (mình nhận được)
            else if (friendshipStatus === 'RECEIVED') {
                const pendingRequests = await friendshipService.getPendingRequests();
                const request = pendingRequests.find(req => req.senderId === userId);
                if (request) {
                // So sánh với toString() vì backend trả về UUID
                const request = pendingRequests.find(req => req.senderId.toString() === userId);
                }
            }

            if (!friendshipId) {
                alert('Không tìm thấy lời mời kết bạn');
                return;
            }

            await friendshipService.cancelFriendRequest(friendshipId);
            setFriendshipStatus('NONE');
        } catch (error) {
            console.error('Failed to cancel request:', error);
            alert('Không thể hủy lời mời');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle message button - Open chat window
    const handleMessage = async () => {
        try {
            // Get or create conversation with this user
            const conversation = await ChatService.getOrCreatePrivateConversation(userId);

            // Dispatch custom event to open chat window
            window.dispatchEvent(new CustomEvent('openChatWindow', {
                detail: {
                    conversation: conversation,
                    minimized: false
                }
            }));

        } catch (error) {
            console.error('Failed to open chat:', error);
            alert('Không thể mở chat');
        }
    };

    // Handle open edit modal
    const handleOpenEditModal = () => {
        setIsEditModalOpen(true);
    };

    // Handle profile updated
    const handleProfileUpdated = (updatedUser) => {
        setUser(updatedUser);
        if (!userId || userId === currentUser?.id) {
            setCurrentUser(updatedUser);
        }
    };

    // Render friendship button
    const renderFriendshipButton = () => {
        if (!user || !currentUser || user.id === currentUser.id) {
            return null; // Don't show buttons on own profile
        }

        switch (friendshipStatus) {
            case 'ACCEPTED':
                return (
                    <button
                        className="profile-btn profile-btn-secondary"
                        onClick={handleUnfriend}
                        disabled={isProcessing}
                    >
                        <img src="/icons/checkmark.svg" alt="" />
                        <span>Bạn bè</span>
                    </button>
                );

            case 'PENDING':
                return (
                    <button
                        className="profile-btn profile-btn-secondary"
                        onClick={handleCancelRequest}
                        disabled={isProcessing}
                    >
                        <img src="/icons/hourglass.svg" alt="" />
                        <span>Hủy lời mời</span>
                    </button>
                );

            case 'RECEIVED':
                return (
                    <>
                        <button
                            className="profile-btn profile-btn-primary"
                            onClick={handleAcceptFriend}
                            disabled={isProcessing}
                        >
                            <img src="/icons/person-add.svg" alt="" />
                            <span>Chấp nhận</span>
                        </button>
                        <button
                            className="profile-btn profile-btn-secondary"
                            onClick={handleCancelRequest}
                            disabled={isProcessing}
                        >
                            <span>Từ chối</span>
                        </button>
                    </>
                );

            default:
                return (
                    <button
                        className="profile-btn profile-btn-primary"
                        onClick={handleAddFriend}
                        disabled={isProcessing}
                    >
                        <img src="/icons/person-add.svg" alt="" />
                        <span>Thêm bạn bè</span>
                    </button>
                );
        }
    };

    if (isLoading) {
        return (
            <div className="profile-page">
                <div className="profile-loading">
                    <div className="loading-spinner"></div>
                    <p>Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="profile-page">
                <div className="profile-error">
                    <p>Không tìm thấy người dùng</p>
                    <button onClick={() => navigate('/')}>Quay lại trang chủ</button>
                </div>
            </div>
        );
    }

    const isOwnProfile = !userId || (currentUser && user.id === currentUser.id);

    return (
        <div className="profile-page">
            {/* Cover Photo */}
            <div className="profile-cover">
                {user.coverPhoto ? (
                    <img
                        src={user.coverPhoto}
                        alt="Cover"
                        className="cover-image"
                    />
                ) : (
                    <div className="cover-default-gradient"></div>
                )}
            </div>

            {/* Profile Header */}
            <div className="profile-header-container">
                <div className="profile-header">
                    {/* Avatar */}
                    <div className="profile-avatar-wrapper">
                        <img
                            src={user.avatarUrl || '/channels/myprofile.jpg'}
                            alt={user.displayName}
                            className="profile-avatar"
                        />
                    </div>

                    {/* User Info */}
                    <div className="profile-info">
                        <div className="profile-name-section">
                            <h1 className="profile-name">{user.displayName}</h1>
                            {mutualFriendsCount > 0 && (
                                <p className="profile-mutual-friends">
                                    {mutualFriendsCount} bạn chung
                                </p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="profile-actions">
                            {!isOwnProfile && (
                                <>
                                    {renderFriendshipButton()}

                                    <button
                                        className="profile-btn profile-btn-message"
                                        onClick={handleMessage}
                                    >
                                        <img src="/icons/chatbubbles-outline.svg" alt="" />
                                        <span>Nhắn tin</span>
                                    </button>
                                </>
                            )}

                            {isOwnProfile && (
                                <button
                                    className="profile-btn profile-btn-secondary"
                                    onClick={handleOpenEditModal}
                                >
                                    <span>Chỉnh sửa trang cá nhân</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="profile-nav">
                    <button className="profile-nav-item active">Bài viết</button>
                    <button className="profile-nav-item">Giới thiệu</button>
                    <button className="profile-nav-item">Bạn bè</button>
                    <button className="profile-nav-item">Ảnh</button>
                </div>
            </div>

            {/* Profile Content */}
            <div className="profile-content">
                {/* Left Column - About */}
                <div className="profile-sidebar">
                    <div className="profile-card">
                        <h3 className="profile-card-title">Giới thiệu</h3>
                        <div className="profile-about">
                            {user.bio && (
                                <p className="profile-bio">{user.bio}</p>
                            )}

                            <div className="profile-info-item">
                                <img src="/icons/mail.svg" alt="" />
                                <span>{user.email}</span>
                            </div>

                            {user.location && (
                                <div className="profile-info-item">
                                    <img src="/icons/location.svg" alt="" />
                                    <span>{user.location}</span>
                                </div>
                            )}

                            <div className="profile-info-item">
                                <img src="/icons/calendar.svg" alt="" />
                                <span>Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Friends Preview */}
                    <div className="profile-card">
                        <h3 className="profile-card-title">Bạn bè</h3>
                        <div className="profile-friends-preview">
                            <p className="friends-count">Đang phát triển...</p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Posts */}
                <div className="profile-main">
                    {isOwnProfile && (
                        <div className="profile-card create-post-card">
                            <div className="create-post-header">
                                <img src={user.avatarUrl || '/channels/myprofile.jpg'} alt="" />
                                <input
                                    type="text"
                                    placeholder={`${user.displayName} ơi, bạn đang nghĩ gì thế?`}
                                    readOnly
                                />
                            </div>
                        </div>
                    )}

                    {/* Posts will be loaded here */}
                    <div className="profile-posts">
                        <div className="no-posts">
                            <p>Chưa có bài viết nào</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <EditProfileModal
                    user={user}
                    onClose={() => setIsEditModalOpen(false)}
                    onProfileUpdated={handleProfileUpdated}
                />
            )}
        </div>
    );
}

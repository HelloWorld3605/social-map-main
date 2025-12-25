import React, { useState, useRef } from 'react';
import { userService } from '../../services/userService';
import { UploadService } from '../../services/UploadService';
import './EditProfileModal.css';

export default function EditProfileModal({ user, onClose, onProfileUpdated }) {
    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        avatarUrl: user?.avatarUrl || '',
        coverPhoto: user?.coverPhoto || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [error, setError] = useState('');
    const [understandRestriction, setUnderstandRestriction] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    // Check if name change is allowed
    const canChangeName = () => {
        if (!user?.lastNameChangeDate) return true;
        const lastChange = new Date(user.lastNameChangeDate);
        const now = new Date();
        const twoWeeks = 14 * 24 * 60 * 60 * 1000; // 14 days in ms
        return (now - lastChange) >= twoWeeks;
    };

    const nextChangeDate = () => {
        if (!user?.lastNameChangeDate) return null;
        const lastChange = new Date(user.lastNameChangeDate);
        const next = new Date(lastChange.getTime() + 14 * 24 * 60 * 60 * 1000);
        return next.toLocaleDateString('vi-VN');
    };

    const lastChangeDateFormatted = () => {
        if (!user?.lastNameChangeDate) return null;
        const date = new Date(user.lastNameChangeDate);
        return date.toLocaleDateString('vi-VN');
    };

    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const handleAvatarClick = () => {
        avatarInputRef.current?.click();
    };

    const handleCoverClick = () => {
        coverInputRef.current?.click();
    };

    const handleRemoveCover = () => {
        setFormData(prev => ({ ...prev, coverPhoto: '' }));
        // Reset input file để có thể chọn lại cùng file
        if (coverInputRef.current) {
            coverInputRef.current.value = '';
        }
    };

    const handleCoverChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            setError('Vui lòng chọn file ảnh');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Kích thước ảnh không được vượt quá 5MB');
            return;
        }

        try {
            setUploadingCover(true);
            setError('');
            const imageUrl = await UploadService.uploadImage(file);
            setFormData(prev => ({ ...prev, coverPhoto: imageUrl }));

            // Reset input file sau khi upload thành công để có thể chọn lại
            if (coverInputRef.current) {
                coverInputRef.current.value = '';
            }
        } catch (err) {
            console.error('Upload cover failed:', err);
            setError('Không thể tải ảnh lên. Vui lòng thử lại.');
        } finally {
            setUploadingCover(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            setError('Vui lòng chọn file ảnh');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Kích thước ảnh không được vượt quá 5MB');
            return;
        }

        try {
            setUploadingAvatar(true);
            setError('');
            const imageUrl = await UploadService.uploadImage(file);
            setFormData(prev => ({ ...prev, avatarUrl: imageUrl }));

            // Reset input file sau khi upload thành công
            if (avatarInputRef.current) {
                avatarInputRef.current.value = '';
            }
        } catch (err) {
            console.error('Upload avatar failed:', err);
            setError('Không thể tải ảnh lên. Vui lòng thử lại.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.displayName.trim()) {
            setError('Tên hiển thị không được để trống');
            return;
        }

        if (formData.displayName.length > 20) {
            setError('Tên hiển thị không được vượt quá 20 ký tự');
            return;
        }

        // Check if trying to change name but not allowed
        if (formData.displayName.trim() !== user?.displayName && !canChangeName()) {
            setError('Bạn chỉ có thể thay đổi tên hiển thị mỗi 2 tuần một lần');
            return;
        }

        // Check if changing name and must check the box
        if (formData.displayName.trim() !== user?.displayName && canChangeName() && !understandRestriction) {
            setError('Vui lòng xác nhận rằng bạn hiểu quy tắc thay đổi tên hiển thị');
            return;
        }

        try {
            setIsSubmitting(true);
            setError('');

            const updateData = {
                displayName: formData.displayName.trim(),
                avatarUrl: formData.avatarUrl || undefined,
                coverPhoto: formData.coverPhoto || '' // Empty string để xóa ảnh bìa
            };

            const updatedUser = await userService.updateMyProfile(updateData);

            // Update localStorage
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const newUserData = { ...currentUser, ...updatedUser };
            localStorage.setItem('user', JSON.stringify(newUserData));

            // Callback to parent
            onProfileUpdated(updatedUser);
            onClose();
        } catch (err) {
            console.error('Update profile failed:', err);
            setError(err.response?.data?.message || 'Không thể cập nhật thông tin. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="edit-profile-overlay" onClick={handleOverlayClick}>
            <div className="edit-profile-modal">
                <div className="edit-profile-header">
                    <h2>Chỉnh sửa trang cá nhân</h2>
                    <button className="close-btn" onClick={onClose} type="button">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="edit-profile-form">
                    {/* Cover Photo Section */}
                    <div className="form-section">
                        <label className="section-label">Ảnh bìa</label>
                        <div className="cover-upload-container">
                            {formData.coverPhoto ? (
                                <div className="cover-preview">
                                    <img src={formData.coverPhoto} alt="Cover" />
                                    <div className="cover-actions">
                                        <button
                                            type="button"
                                            className="cover-action-btn"
                                            onClick={handleCoverClick}
                                            disabled={uploadingCover}
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                                            </svg>
                                            Thay đổi
                                        </button>
                                        <button
                                            type="button"
                                            className="cover-action-btn delete-btn"
                                            onClick={handleRemoveCover}
                                            disabled={uploadingCover}
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                            </svg>
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="cover-default" onClick={handleCoverClick}>
                                    <div className="cover-default-gradient"></div>
                                    <div className="cover-upload-overlay">
                                        {uploadingCover ? (
                                            <div className="upload-spinner"></div>
                                        ) : (
                                            <>
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                                                </svg>
                                                <span>Thêm ảnh bìa</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                            <input
                                ref={coverInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleCoverChange}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <p className="field-hint">
                            Để trống hoặc xóa ảnh bìa để sử dụng màu gradient mặc định
                        </p>
                    </div>

                    {/* Avatar Section */}
                    <div className="form-section">
                        <label className="section-label">Ảnh đại diện</label>
                        <div className="avatar-upload-container">
                            <div className="avatar-preview" onClick={handleAvatarClick}>
                                <img
                                    src={formData.avatarUrl || '/channels/myprofile.jpg'}
                                    alt="Avatar"
                                />
                                <div className="avatar-overlay">
                                    {uploadingAvatar ? (
                                        <div className="upload-spinner"></div>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-3.2-5c0 1.77 1.43 3.2 3.2 3.2s3.2-1.43 3.2-3.2-1.43-3.2-3.2-3.2-3.2 1.43-3.2 3.2z" />
                                            </svg>
                                            <span>Thay đổi</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Display Name */}
                    <div className="form-section">
                        <div className="label-with-icon">
                            <label className="section-label" htmlFor="displayName">
                                Tên hiển thị
                            </label>
                        </div>
                        <div className="input-with-icon">
                            <input
                                id="displayName"
                                type="text"
                                className="form-input"
                                value={formData.displayName}
                                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                                maxLength={20}
                                placeholder="Nhập tên hiển thị"
                                disabled={!canChangeName()}
                            />
                            {user?.lastNameChangeDate && (
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    className="input-warning-icon-svg"
                                    onMouseEnter={() => setShowTooltip(true)}
                                    onMouseLeave={() => setShowTooltip(false)}
                                    onClick={() => setShowTooltip(!showTooltip)}
                                >
                                    <path d="M9.75 12a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-3.75h-.75a.75.75 0 0 1-.75-.75M12 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path>
                                    <path fillRule="evenodd" clipRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12M12 3.75a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5"></path>
                                </svg>
                            )}
                            {showTooltip && user?.lastNameChangeDate && (
                                <div className="info-tooltip">
                                    Xin lưu ý: Lần cuối cùng bạn thay đổi Tên hiển thị trên Social Map là vào ngày {lastChangeDateFormatted()}. Bạn không thể thay đổi lại cho đến ngày {nextChangeDate()}.
                                </div>
                            )}
                        </div>
                        <p className="field-hint">
                            {formData.displayName.length}/20 ký tự
                        </p>
                        {canChangeName() && formData.displayName.trim() !== user?.displayName && (
                            <div className="restriction-checkbox">
                                <input
                                    type="checkbox"
                                    id="understandRestriction"
                                    checked={understandRestriction}
                                    onChange={(e) => setUnderstandRestriction(e.target.checked)}
                                />
                                <label htmlFor="understandRestriction">
                                    Tôi hiểu rằng tôi không thể thay đổi tên hiển thị của mình trong vòng 2 tuần sau khi thay đổi này diễn ra.
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="error-message">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-cancel"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="btn btn-save"
                            disabled={isSubmitting || uploadingAvatar || uploadingCover}
                        >
                            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

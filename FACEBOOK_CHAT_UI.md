# Facebook-style Chat UI - Click Outside to Deactivate

## ✅ Tính năng đã được thêm
Chat windows giờ đây hoạt động giống Facebook Messenger:
- **Click vào chat window** → Chat window đó trở thành active (shadow mạnh hơn, header sáng hơn)
- **Click vào vùng khác** (không phải chat windows) → Chat window active sẽ trở thành inactive

## 🎯 Cách hoạt động

### Active State (khi click vào chat window):
- Shadow: `0 -4px 20px rgba(0, 0, 0, 0.25)` (mạnh hơn)
- Header: Background `#f06ba3`, opacity 1.0 (sáng hơn)
- Avatar: opacity 1.0 (sáng hơn)

### Inactive State (khi click outside):
- Shadow: `0 -1px 6px rgba(0, 0, 0, 0.08)` (nhẹ hơn)
- Header: opacity 0.75 (mờ hơn)
- Avatar: opacity 0.6 (mờ hơn)

## 🧪 Test tính năng

1. **Mở nhiều chat windows:**
   - Click vào icon chat để mở side chat
   - Click vào 2-3 người bạn khác nhau để mở nhiều chat windows

2. **Test active/inactive:**
   - Click vào chat window đầu tiên → Nó sẽ trở thành active (shadow mạnh, header sáng)
   - Click vào chat window thứ hai → Chat window đầu tiên trở thành inactive, chat window thứ hai trở thành active
   - Click vào vùng trống trên map (không phải chat windows) → Chat window active sẽ trở thành inactive

3. **Kiểm tra Console Log:**
   ```
   🎯 Setting active chat window (handleChatWindowClick): [conversationId]
   👆 Click outside - deactivating active chat window
   ```

## 📝 Code đã thay đổi

### File: `social-map-fe/src/components/Chat/SideChat.jsx`
```javascript
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
```

### File: `social-map-fe/src/components/Chat/ChatWindows.css`
```css
/* Active window (Facebook-style) - stronger shadow */
.chat-window.active {
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.25);
    z-index: 10;
}

/* Inactive windows - lighter shadow only, keep background bright */
.chat-window:not(.active) {
    box-shadow: 0 -1px 6px rgba(0, 0, 0, 0.08);
}

/* Inactive window header - slightly transparent */
.chat-window:not(.active) .chat-window-header {
    opacity: 0.75;
}

/* Brighter header for active window */
.chat-window.active .chat-window-header {
    background: #f06ba3;
    opacity: 1;
}

/* Dim avatar when inactive */
.chat-window:not(.active) .chat-window-avatar {
    opacity: 0.6;
}

.chat-window.active .chat-window-avatar {
    opacity: 1;
}
```

## 🎨 Visual Feedback

### Active Chat Window:
- **Shadow**: Đậm và dài hơn
- **Header**: Màu hồng sáng (#f06ba3)
- **Avatar**: Sáng và rõ nét
- **Z-index**: Cao hơn (z-index: 10)

### Inactive Chat Window:
- **Shadow**: Nhẹ và ngắn hơn
- **Header**: Mờ hơn (opacity: 0.75)
- **Avatar**: Mờ hơn (opacity: 0.6)
- **Z-index**: Thấp hơn

## 🔧 Technical Details

- **Event**: `mousedown` trên `document`
- **Exclusion zones**: Chat windows container, side chat panel, chat toggle button
- **State management**: `activeChatWindow` state + `activeChatWindowRef` ref
- **CSS classes**: `.chat-window.active` vs `.chat-window:not(.active)`

## 🚀 Performance

- Event listener được cleanup khi component unmount
- Sử dụng `useRef` để tránh re-render không cần thiết
- Chỉ re-run effect khi `activeChatWindow` thay đổi
- Không affect các chat windows khác khi deactivate

## 🎯 Facebook Messenger Comparison

| Feature | Our Implementation | Facebook Messenger |
|---------|-------------------|-------------------|
| Click window | ✅ Active | ✅ Active |
| Click outside | ✅ Deactivate | ✅ Deactivate |
| Visual feedback | ✅ Shadow + opacity | ✅ Shadow + opacity |
| Multiple windows | ✅ Supported | ✅ Supported |
| Minimize behavior | ✅ Clear active | ✅ Clear active |

Tính năng đã hoàn thành và hoạt động giống Facebook Messenger!

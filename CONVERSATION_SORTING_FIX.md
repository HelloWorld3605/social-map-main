# Fix: Sắp Xếp Conversation Theo Tin Nhắn Mới Nhất (Real-Time)

## Vấn Đề
Trong SideChat (danh sách conversation), conversation có tin nhắn mới không tự động di chuyển lên đầu danh sách. Danh sách không được sắp xếp real-time theo thời gian tin nhắn mới nhất.

## Nguyên Nhân
- **Backend**: ✅ Đã có sorting theo `lastMessageAt` khi load conversations
- **Frontend**: ❌ Không có sorting khi hiển thị, dẫn đến khi có tin nhắn mới thì conversation không tự động di chuyển lên đầu

## Giải Pháp

### Frontend - SideChat.jsx

#### File: `social-map-fe/src/components/Chat/SideChat.jsx`

**1. Import `useMemo`:**
```javascript
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
```

**2. Thêm logic sorting với `useMemo`:**
```javascript
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
```

## Cách Hoạt Động

### 1. **useMemo Hook**
- Tự động re-compute khi `conversations` state thay đổi
- Chỉ tính toán lại khi cần thiết (optimization)
- Trả về một mảng mới đã được sắp xếp

### 2. **Sorting Logic**
```javascript
dateB - dateA  // Descending order (mới nhất lên đầu)
```

- Conversations có `lastMessageAt` mới nhất → index 0 (top)
- Conversations không có `lastMessageAt` → xuống cuối danh sách
- So sánh theo milliseconds của Date object

### 3. **Real-Time Updates**
Khi có tin nhắn mới từ WebSocket:
```javascript
// messageCallback trong useEffect
setConversations(prev => prev.map(c => {
    if (c.id === conv.id) {
        return {
            ...c,
            lastMessageContent: lastMessageContent,
            lastMessageSenderId: message.senderId,
            lastMessageAt: message.timestamp || new Date().toISOString(), // ← Cập nhật timestamp
        };
    }
    return c;
}));
```

→ State `conversations` thay đổi
→ `useMemo` trigger lại
→ `sortedConversations` được tính toán lại với thứ tự mới
→ UI tự động re-render với conversation mới nhất ở đầu

### 4. **Flow Diagram**
```
Tin nhắn mới từ WebSocket
        ↓
Update lastMessageAt trong conversation
        ↓
conversations state thay đổi
        ↓
useMemo detect dependency change
        ↓
Re-sort toàn bộ conversations
        ↓
sortedConversations cập nhật
        ↓
filteredConversations filter từ sortedConversations
        ↓
UI re-render với thứ tự mới
        ↓
Conversation với tin nhắn mới nhất hiển thị ở đầu
```

## Kết Quả

✅ **Khi nhận tin nhắn mới:**
- Conversation tự động di chuyển lên đầu danh sách
- Không cần reload trang
- Real-time sorting

✅ **Khi gửi tin nhắn:**
- Conversation bạn đang chat cũng di chuyển lên đầu
- Thời gian cập nhật ngay lập tức

✅ **Performance:**
- `useMemo` chỉ sort khi `conversations` thay đổi
- Không sort lại không cần thiết
- Optimal re-rendering

✅ **Edge Cases:**
- Conversations không có tin nhắn → xuống cuối danh sách
- Multiple conversations cùng update → sort theo timestamp chính xác
- Conversations mới tạo → hiển thị ở vị trí đúng theo timestamp

## Test Cases

### Test 1: Nhận Tin Nhắn Mới
1. Mở SideChat
2. Có conversation "User A" ở giữa danh sách
3. "User A" gửi tin nhắn mới
4. ✅ "User A" tự động di chuyển lên đầu danh sách

### Test 2: Gửi Tin Nhắn
1. Mở chat window với "User B" (ở giữa danh sách)
2. Gửi tin nhắn
3. ✅ "User B" di chuyển lên đầu danh sách

### Test 3: Multiple Conversations Cập Nhật
1. "User C" gửi tin nhắn (10:00:00)
2. "User D" gửi tin nhắn (10:00:05)
3. "User E" gửi tin nhắn (10:00:03)
4. ✅ Thứ tự: User D → User E → User C

### Test 4: Conversation Mới
1. Tạo conversation mới với "User F"
2. ✅ "User F" hiển thị ở đầu danh sách

### Test 5: Search Với Sorted List
1. Danh sách đã sorted: A → B → C
2. Search "B"
3. ✅ Chỉ hiển thị B (vẫn giữ nguyên sorting)

## So Sánh Trước/Sau

### Trước Fix:
```
User A (10:00:00)
User B (09:55:00)  ← nhận tin nhắn mới (10:05:00)
User C (09:50:00)

→ Sau khi User B nhận tin nhắn:
User A (10:00:00)
User B (10:05:00)  ← VẪN Ở VỊ TRÍ CŨ ❌
User C (09:50:00)
```

### Sau Fix:
```
User A (10:00:00)
User B (09:55:00)  ← nhận tin nhắn mới (10:05:00)
User C (09:50:00)

→ Sau khi User B nhận tin nhắn:
User B (10:05:00)  ← TỰ ĐỘNG LÊN ĐẦU ✅
User A (10:00:00)
User C (09:50:00)
```

## Lưu Ý

1. **Không cần restart backend** - Chỉ cần refresh frontend
2. **Real-time** - Không cần polling hay refresh
3. **Compatible** - Hoạt động với tất cả loại conversation (1-1 và group)
4. **Performance** - useMemo tối ưu, không ảnh hưởng hiệu suất

## Code Changes Summary

- ✅ Import `useMemo`
- ✅ Thêm `sortedConversations` với logic sorting
- ✅ Thay `conversations` thành `sortedConversations` trong filter
- ✅ Không thay đổi backend
- ✅ Không thay đổi WebSocket logic
- ✅ Zero breaking changes

## Cách Test

1. **Mở ứng dụng** (frontend tự động reload):
   ```bash
   cd D:\Spring-boot\social-map-main\social-map-fe
   npm run dev
   ```

2. **Test scenarios** như mô tả ở trên

3. **Kiểm tra console logs** để thấy conversations được update và sorted


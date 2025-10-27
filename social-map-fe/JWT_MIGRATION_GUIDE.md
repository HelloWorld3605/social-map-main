# JWT Migration Guide - Frontend Services Updated

## Overview
All frontend services have been updated to rely on JWT authentication instead of passing `userId` from localStorage. The backend automatically extracts the user identity from the JWT token in the Authorization header.

---

## ✅ Updated Services

### 1. **userService.js**

#### New Methods (Recommended)
```javascript
// Get current user's profile (from JWT)
getMyProfile()

// Update current user's profile (from JWT)
updateMyProfile(data)

// Delete current user's account (from JWT)
deleteMyAccount()

// Get mutual friends count with another user (from JWT)
getMyMutualFriendsCount(otherUserId)
```

#### Deprecated Methods (Backward Compatible)
```javascript
updateProfile(userId, data)  // ⚠️ Use updateMyProfile(data) instead
deleteUser(userId)           // ⚠️ Use deleteMyAccount() instead
```

#### Migration Example
```javascript
// ❌ OLD WAY
const user = JSON.parse(localStorage.getItem('user'));
await updateProfile(user.id, { displayName: 'New Name' });

// ✅ NEW WAY
await updateMyProfile({ displayName: 'New Name' });
```

---

### 2. **authService.js**

#### Updated Methods
```javascript
// Change password (from JWT)
changePassword({ currentPassword, newPassword })

// Resend email verification (query param instead of body)
resendEmailVerification(email)
```

#### Migration Example
```javascript
// ❌ OLD WAY
const user = JSON.parse(localStorage.getItem('user'));
await changePassword(user.id, { currentPassword: '...', newPassword: '...' });

// ✅ NEW WAY
await changePassword({ currentPassword: '...', newPassword: '...' });
```

---

### 3. **friendshipService.js**

All methods now use JWT - no more `userId` from localStorage!

#### Updated Methods
```javascript
// Send friend request (from JWT)
sendFriendRequest(receiverId)

// Accept friend request (from JWT)
acceptFriendRequest(friendshipId)

// Cancel or reject friend request (from JWT)
cancelOrRejectRequest(friendshipId)

// Get current user's friend list (from JWT)
getFriendList()

// Get pending friend requests (from JWT)
getPendingRequests()

// Get friend list of specific user (public view)
getFriendListByUserId(userId)
```

#### Migration Example
```javascript
// ❌ OLD WAY
const user = JSON.parse(localStorage.getItem('user'));
await sendFriendRequest(user.id, receiverId);

// ✅ NEW WAY
await sendFriendRequest(receiverId);
```

---

### 4. **shopService.js**

Already using JWT correctly! ✅ No changes needed.

```javascript
createShop(shopData)
updateShop(shopId, shopData)
deleteShop(shopId)
getShopById(shopId)
getAllShops()
```

---

### 5. **menuService.js**

Already using JWT correctly! ✅ No changes needed.

```javascript
createMenu(menuData)
updateMenu(menuId, menuData)
deleteMenu(menuId)
getMenuById(menuId)
```

---

### 6. **ChatService.js**

Already using JWT correctly! ✅ No changes needed.

All REST API methods and WebSocket connections use the JWT token from the Authorization header.

---

## 🔧 Backend API Endpoints Reference

### UserController
- `GET /api/users/me` - Get current user's profile
- `PUT /api/users/me` - Update current user's profile
- `DELETE /api/users/me` - Delete current user's account
- `GET /api/users/me/mutual-friends/{otherUserId}/count` - Count mutual friends
- `GET /api/users/{id}` - Get specific user's profile (public)

### AuthController
- `POST /api/auth/change-password` - Change password (JWT required)
- `POST /api/auth/resend-verification?email={email}` - Resend verification email

### FriendshipController
- `POST /api/friends/request?receiverId={id}` - Send friend request
- `POST /api/friends/{id}/accept` - Accept friend request
- `DELETE /api/friends/{id}` - Cancel/reject friend request
- `GET /api/friends` - Get current user's friends
- `GET /api/friends/pending` - Get pending requests
- `GET /api/friends?userId={id}` - Get specific user's friends

### ShopController
- `POST /api/shops` - Create shop
- `PUT /api/shops/{id}` - Update shop
- `DELETE /api/shops/{id}` - Delete shop

### MenuController
- `POST /api/menus` - Create menu
- `PUT /api/menus/{id}` - Update menu
- `DELETE /api/menus/{id}` - Delete menu

### ChatController
All endpoints automatically use JWT via `@AuthenticationPrincipal UserPrincipal`

---

## 🔑 How JWT Authentication Works

### 1. **apiClient.js** Configuration
The API client automatically attaches the JWT token to every request:

```javascript
// In apiClient.js
const authToken = localStorage.getItem('authToken');
if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
}
```

### 2. **Backend JWT Filter**
```java
// JwtAuthenticationFilter.java
@Override
protected void doFilterInternal(HttpServletRequest request, ...) {
    String jwt = getJwtFromRequest(request); // Extract from "Authorization: Bearer {token}"
    if (jwtUtils.validateToken(jwt)) {
        String email = jwtUtils.getEmailFromToken(jwt);
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
        // Set authentication in SecurityContext
    }
}
```

### 3. **Backend Controllers**
```java
// Controllers use @AuthenticationPrincipal to get current user
@PutMapping("/me")
public ResponseEntity<UserResponse> updateMyProfile(
    @AuthenticationPrincipal UserPrincipal userPrincipal,
    @RequestBody UpdateProfileRequest request
) {
    UUID userId = userPrincipal.getUser().getId(); // Auto from JWT!
    // ...
}
```

---

## 📝 Migration Checklist

- [x] ✅ Update userService.js with JWT methods
- [x] ✅ Update authService.js (changePassword, resendEmailVerification)
- [x] ✅ Update friendshipService.js (remove all localStorage usage)
- [x] ✅ Verify shopService.js (already correct)
- [x] ✅ Verify menuService.js (already correct)
- [x] ✅ Verify ChatService.js (already correct)
- [ ] ⏳ Test all updated services with real backend
- [ ] ⏳ Update components using old deprecated methods

---

## 🚀 Benefits of JWT-Based Authentication

1. **Security**: No userId exposed in frontend code
2. **Simplicity**: No need to manually pass userId everywhere
3. **Consistency**: Backend has single source of truth (JWT token)
4. **Stateless**: Backend doesn't need to store sessions
5. **Scalability**: Easier to scale horizontally

---

## ⚠️ Important Notes

1. **Token Storage**: JWT token is stored in `localStorage.getItem('authToken')`
2. **Auto-Attach**: `apiClient.js` automatically adds `Authorization: Bearer {token}` header
3. **Backward Compatibility**: Deprecated methods still work but show console warnings
4. **User Data**: Can still store basic user info in localStorage for UI display, but don't use for API calls

---

## 🔍 Testing Guide

### Test User Profile Update
```javascript
import { updateMyProfile } from './services/userService';

// Should work without userId
const result = await updateMyProfile({
    displayName: 'Test User',
    bio: 'Hello world'
});
console.log('Updated:', result);
```

### Test Friend Request
```javascript
import { sendFriendRequest } from './services/friendshipService';

// Should work without userId
await sendFriendRequest('receiver-uuid-here');
```

### Test Password Change
```javascript
import { changePassword } from './services/authService';

// Should work without userId
await changePassword({
    currentPassword: 'old123',
    newPassword: 'new456'
});
```

---

## 📚 Additional Resources

- **Backend Code**: Check `SecurityConfig.java`, `JwtAuthenticationFilter.java`, `JwtUtils.java`
- **API Documentation**: Swagger UI at `http://localhost:8080/swagger-ui.html`
- **Frontend API Client**: `src/services/apiClient.js`

---

**Last Updated**: October 26, 2025  
**Migration Status**: ✅ Complete - Ready for Testing

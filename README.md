## Nền tảng mạng xã hội dựa trên bản đồ, cho phép tương tác thời gian thực và quản lý địa điểm kinh doanh.

### 🔐 Login Page

![LoginPage](https://github.com/HelloWorld3605/social-map-main/blob/main/Login.png?raw=true)

* User authentication using JWT (Access + Refresh Token)
* Email & password login with secure validation
* Redirect to Register Page for new users
* Forgot Password flow (email-based reset)
* Email verification during registration process
* Automatic redirect after successful login
* Protected routes handling (unauthenticated → login)
---

### 🗺️ Home Page (Map View)

![HomePage](https://github.com/HelloWorld3605/social-map-main/blob/main/Only%20homepage.png?raw=true)
![SearchDropdown](https://github.com/HelloWorld3605/social-map-main/blob/main/Search.png?raw=true)

* Fullscreen interactive map (Mapbox GL)
* Real-time shop markers
* Spatial navigation & search
* List all shop

---

### 💬 Chat Window (Location Sharing)

![ChatPopUp](https://github.com/HelloWorld3605/social-map-main/blob/main/ChatPopUp.png?raw=true)

* Real-time messaging (WebSocket)
* Drag & drop location from map → chat
* Location message preview (mini map)
* Typing indicators & read receipts
* Multi-window chat system (Messenger-like UX)
* Infinite scroll message history

---

### 📝 Floating Notes (Location Embedding)

![Note](https://github.com/HelloWorld3605/social-map-main/blob/main/M%C3%A0n%20h%C3%ACnh%20notepad.png?raw=true)

* Drag & drop location into notes
* Draggable & resizable popup window
* Save favorite places visually

---

### 👤 Profile Page

![Profile](https://github.com/HelloWorld3605/social-map-main/blob/main/Trang%20c%C3%A1%20nh%C3%A2n.png?raw=true)

* User profile with avatar & cover photo
* Friendship system (add/accept/remove)
* Online/offline status
* Chat integration
* Update info (The time between each name update must be at least 2 weeks)

---

## 📡 Core Functionalities

* 🔐 Authentication: Login, Register, Email Verification, Password Reset
* 👤 User: Profile management, avatar upload
* 🤝 Friendship: Add, accept, remove friends
* 🗺️ Map & Shops: Search, clustering, CRUD shop
* 💬 Chat: Real-time messaging, typing indicator, read receipts
* 🧾 Admin: User management, seller approval


## 🛠️ Tech Stack

**Frontend**

* React 19, Vite
* Mapbox GL JS
* STOMP + SockJS
* Axios, Context API

**Backend**

* Java 21, Spring Boot
* Spring Security, JWT
* WebSocket (STOMP)

**Database**

* PostgreSQL + PostGIS
* MongoDB
* Redis

**Other**

* Cloudinary (media storage)




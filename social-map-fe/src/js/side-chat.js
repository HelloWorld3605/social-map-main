document.addEventListener("DOMContentLoaded", function () {
    // Lấy các elements
    const chatToggle = document.getElementById("chatToggle");
    const sideChat = document.getElementById("sideChat");
    const chatPopupOverlay = document.getElementById("chatPopupOverlay");
    const chatCloseBtn = document.getElementById("chatCloseBtn");
    const friendItems = document.querySelectorAll(".friend-item");
    const chatWindowsContainer = document.getElementById("chatWindowsContainer");

    // Store opened chat windows
    const openChatWindows = new Map();

    // Mở/đóng popup chat
    chatToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        const isActive = sideChat.classList.contains("is-active");

        if (isActive) {
            closeChatPopup();
        } else {
            openChatPopup();
        }
    });

    chatCloseBtn.addEventListener("click", function () {
        closeChatPopup();
    });

    // Close popup khi click vào overlay
    chatPopupOverlay.addEventListener("click", function () {
        closeChatPopup();
    });

    function openChatPopup() {
        sideChat.classList.add("is-active");
        chatPopupOverlay.classList.add("is-active");
        // Remove body overflow modification to prevent CSS conflicts
    }

    function closeChatPopup() {
        sideChat.classList.remove("is-active");
        chatPopupOverlay.classList.remove("is-active");
        // Remove body overflow modification to prevent CSS conflicts
    }

    // Chọn bạn bè để chat - Mở Facebook-style chat window
    friendItems.forEach(item => {
        item.addEventListener("click", function () {
            // Lấy thông tin bạn bè
            const friendId = this.dataset.friend;
            const friendName = this.querySelector(".friend-name").textContent;
            const friendStatus = this.querySelector(".friend-status").textContent;
            const friendAvatar = this.querySelector(".friend-avatar").src;

            // Đóng popup chat
            closeChatPopup();

            // Mở hoặc focus chat window
            openChatWindow({
                id: friendId,
                name: friendName,
                status: friendStatus,
                avatar: friendAvatar
            });

            // Xóa unread count
            const unreadCount = this.querySelector(".unread-count");
            if (unreadCount) {
                unreadCount.remove();
            }
        });
    });

    // Function to create Facebook-style chat window
    function openChatWindow(friend) {
        // Kiểm tra xem chat window đã tồn tại chưa
        if (openChatWindows.has(friend.id)) {
            const existingWindow = openChatWindows.get(friend.id);
            existingWindow.classList.remove('minimized');
            existingWindow.classList.add('open');
            existingWindow.scrollIntoView({ behavior: 'smooth', block: 'end' });
            return;
        }

        // Tạo chat window mới
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chat-window';
        chatWindow.dataset.friendId = friend.id;

        chatWindow.innerHTML = `
            <div class="chat-window-header">
                <img src="${friend.avatar}" alt="Avatar" class="chat-window-avatar">
                <div class="chat-window-info">
                    <div class="chat-window-name">${friend.name}</div>
                    <div class="chat-window-status">${friend.status}</div>
                </div>
                <div class="chat-window-controls">
                    <button class="chat-window-minimize" title="Thu nhỏ">−</button>
                    <button class="chat-window-close" title="Đóng">×</button>
                </div>
            </div>
            <div class="chat-window-messages" data-friend-id="${friend.id}">
                <!-- Messages will be loaded here -->
            </div>
            <div class="chat-window-input-container">
                <input type="text" placeholder="Aa" class="chat-window-input" data-friend-id="${friend.id}">
                <button class="chat-window-send">→</button>
            </div>
        `;

        // Thêm vào container
        chatWindowsContainer.appendChild(chatWindow);
        openChatWindows.set(friend.id, chatWindow);

        // Load tin nhắn
        loadChatWindowMessages(friend.id);

        // Show với animation
        setTimeout(() => {
            chatWindow.classList.add('open');
        }, 10);

        // Event listeners cho chat window
        setupChatWindowEvents(chatWindow, friend);
    }

    function setupChatWindowEvents(chatWindow, friend) {
        const header = chatWindow.querySelector('.chat-window-header');
        const minimizeBtn = chatWindow.querySelector('.chat-window-minimize');
        const closeBtn = chatWindow.querySelector('.chat-window-close');
        const input = chatWindow.querySelector('.chat-window-input');
        const sendBtn = chatWindow.querySelector('.chat-window-send');

        // Toggle minimize when clicking header
        header.addEventListener('click', (e) => {
            if (e.target === minimizeBtn || e.target === closeBtn) return;
            chatWindow.classList.toggle('minimized');
        });

        // Minimize
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            chatWindow.classList.toggle('minimized');
        });

        // Close
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            chatWindow.classList.remove('open');
            setTimeout(() => {
                chatWindow.remove();
                openChatWindows.delete(friend.id);
            }, 300);
        });

        // Send message
        function sendChatWindowMessage() {
            const messageText = input.value.trim();
            if (messageText === "") return;

            // Add message to chat window
            addMessageToChatWindow(friend.id, messageText, true);
            input.value = "";

            // Simulate reply
            setTimeout(() => {
                simulateChatWindowReply(friend.id);
            }, 1000 + Math.random() * 2000);
        }

        sendBtn.addEventListener('click', sendChatWindowMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatWindowMessage();
            }
        });
    }

    // Function to detect and format links in text
    function linkify(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, (url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="message-link">${url}</a>`;
        });
    }

    function addMessageToChatWindow(friendId, messageText, isSent = false) {
        const chatWindow = openChatWindows.get(friendId);
        if (!chatWindow) return;

        const messagesContainer = chatWindow.querySelector('.chat-window-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-window-message ${isSent ? 'sent' : 'received'}`;

        const currentTime = new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        if (isSent) {
            messageDiv.innerHTML = `
                <div class="chat-window-message-content">
                    <div class="chat-window-message-text">${linkify(messageText)}</div>
                    <div class="chat-window-message-time">${currentTime}</div>
                </div>
            `;
        } else {
            const friend = Array.from(friendItems).find(item => item.dataset.friend === friendId);
            const avatar = friend ? friend.querySelector('.friend-avatar').src : 'channels/myprofile.jpg';

            messageDiv.innerHTML = `
                <img src="${avatar}" alt="Avatar" class="chat-window-message-avatar">
                <div class="chat-window-message-content">
                    <div class="chat-window-message-text">${linkify(messageText)}</div>
                    <div class="chat-window-message-time">${currentTime}</div>
                </div>
            `;
        }

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function simulateChatWindowReply(friendId) {
        const replies = [
            "Cảm ơn bạn!",
            "Mình hiểu rồi 😊",
            "Được thôi!",
            "Haha, thật à?",
            "OK, chúng ta gặp nhau sau nhé",
            "Chúc bạn một ngày tốt lành!",
        ];

        const randomReply = replies[Math.floor(Math.random() * replies.length)];

        // Show typing indicator first
        showTypingIndicator(friendId);

        setTimeout(() => {
            hideTypingIndicator(friendId);
            addMessageToChatWindow(friendId, randomReply, false);
        }, 1500);
    }

    function showTypingIndicator(friendId) {
        const chatWindow = openChatWindows.get(friendId);
        if (!chatWindow) return;

        const messagesContainer = chatWindow.querySelector('.chat-window-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-window-message received typing-indicator-message';
        typingDiv.innerHTML = `
            <img src="channels/myprofile.jpg" alt="Avatar" class="chat-window-message-avatar">
            <div class="typing-indicator">
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;

        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function hideTypingIndicator(friendId) {
        const chatWindow = openChatWindows.get(friendId);
        if (!chatWindow) return;

        const typingIndicator = chatWindow.querySelector('.typing-indicator-message');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    function loadChatWindowMessages(friendId) {
        const messageExamples = {
            "nguyen-van-a": [
                {
                    type: "received",
                    text: "Chào bạn! Bạn có khỏe không?",
                    time: "10:30"
                },
                {
                    type: "sent",
                    text: "Chào! Mình khỏe, cảm ơn bạn nhé",
                    time: "10:32"
                }
            ],
            "tran-thi-b": [
                {
                    type: "received",
                    text: "Hôm nay công việc thế nào?",
                    time: "09:15"
                },
                {
                    type: "sent",
                    text: "Khá bận, nhưng mọi thứ đều ổn. Bạn thì sao?",
                    time: "09:20"
                }
            ],
            "le-van-c": [
                {
                    type: "sent",
                    text: "Bạn ơi, lâu rồi không gặp!",
                    time: "08:45"
                },
                {
                    type: "received",
                    text: "Ừa, mình cũng nhớ bạn lắm. Khi nào rảnh gặp nhau nhé!",
                    time: "08:50"
                }
            ]
        };

        const messages = messageExamples[friendId] || [];
        messages.forEach(msg => {
            addMessageToChatWindow(friendId, msg.text, msg.type === "sent");
        });
    }

    // Removed old conversation code - now using Facebook-style chat windows

    // Prevent event bubbling khi click trong popup chat
    sideChat.addEventListener("click", function (e) {
        e.stopPropagation();
    });

    // Handle ESC key to close popup
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && sideChat.classList.contains("is-active")) {
            closeChatPopup();
        }
    });
});
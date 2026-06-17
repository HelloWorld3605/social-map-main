// ============================================================
// SOCIAL MAP - DỮ LIỆU MẪU MONGODB (Chat System)
// ============================================================
// Chạy script này trong MongoDB shell: mongosh socialmap_chat < data-sample-mongo.js
// Hoặc copy từng block vào MongoDB Compass / mongosh
// ============================================================
// Lưu ý: userId ở đây tham chiếu đến UUID trong PostgreSQL (dạng string)
// ============================================================

// Xóa dữ liệu cũ (nếu có)
db.conversations.deleteMany({});
db.conversation_members.deleteMany({});
db.messages.deleteMany({});

// ============================================================
// 1. CONVERSATIONS (5 conversations: 4 private + 1 group)
// ============================================================

db.conversations.insertMany([
  // Conv 1: An & Mai (private chat)
  {
    _id: ObjectId("665000000000000000000001"),
    isGroup: false,
    groupName: null,
    groupAvatar: null,
    createdBy: "c0000000-0000-0000-0000-000000000001",
    createdAt: ISODate("2025-03-20T08:00:00Z"),
    lastMessageAt: ISODate("2025-06-17T03:30:00Z"),
    updatedAt: ISODate("2025-06-17T03:30:00Z")
  },

  // Conv 2: An & Khoa (private chat)
  {
    _id: ObjectId("665000000000000000000002"),
    isGroup: false,
    groupName: null,
    groupAvatar: null,
    createdBy: "c0000000-0000-0000-0000-000000000001",
    createdAt: ISODate("2025-04-05T10:00:00Z"),
    lastMessageAt: ISODate("2025-06-16T09:15:00Z"),
    updatedAt: ISODate("2025-06-16T09:15:00Z")
  },

  // Conv 3: An & Seller Minh (private chat)
  {
    _id: ObjectId("665000000000000000000003"),
    isGroup: false,
    groupName: null,
    groupAvatar: null,
    createdBy: "b0000000-0000-0000-0000-000000000001",
    createdAt: ISODate("2025-04-12T14:00:00Z"),
    lastMessageAt: ISODate("2025-06-15T11:20:00Z"),
    updatedAt: ISODate("2025-06-15T11:20:00Z")
  },

  // Conv 4: Mai & Thảo (private chat)
  {
    _id: ObjectId("665000000000000000000004"),
    isGroup: false,
    groupName: null,
    groupAvatar: null,
    createdBy: "c0000000-0000-0000-0000-000000000002",
    createdAt: ISODate("2025-04-25T16:00:00Z"),
    lastMessageAt: ISODate("2025-06-14T20:45:00Z"),
    updatedAt: ISODate("2025-06-14T20:45:00Z")
  },

  // Conv 5: Group Chat "Hội Sài Gòn Ăn Vặt" (An, Mai, Khoa, Nam, Premium Hùng)
  {
    _id: ObjectId("665000000000000000000005"),
    isGroup: true,
    groupName: "Hội Sài Gòn Ăn Vặt 🍜",
    groupAvatar: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200",
    createdBy: "c0000000-0000-0000-0000-000000000001",
    createdAt: ISODate("2025-05-01T12:00:00Z"),
    lastMessageAt: ISODate("2025-06-17T04:00:00Z"),
    updatedAt: ISODate("2025-06-17T04:00:00Z")
  }
]);

print("✅ Inserted 5 conversations");


// ============================================================
// 2. CONVERSATION_MEMBERS
// ============================================================

db.conversation_members.insertMany([
  // --- Conv 1: An & Mai ---
  {
    conversationId: "665000000000000000000001",
    userId: "c0000000-0000-0000-0000-000000000001",
    lastReadAt: ISODate("2025-06-17T03:30:00Z"),
    joinedAt: ISODate("2025-03-20T08:00:00Z"),
    lastActiveAt: ISODate("2025-06-17T03:30:00Z"),
    active: true,
    role: "MEMBER",
    typing: false,
    typingStartedAt: null,
    muted: false,
    mutedAt: null,
    clearedAt: null,
    deleted: false,
    deletedAt: null
  },
  {
    conversationId: "665000000000000000000001",
    userId: "c0000000-0000-0000-0000-000000000002",
    lastReadAt: ISODate("2025-06-17T03:25:00Z"),
    joinedAt: ISODate("2025-03-20T08:00:00Z"),
    lastActiveAt: ISODate("2025-06-17T03:25:00Z"),
    active: true,
    role: "MEMBER",
    typing: false,
    typingStartedAt: null,
    muted: false,
    mutedAt: null,
    clearedAt: null,
    deleted: false,
    deletedAt: null
  },

  // --- Conv 2: An & Khoa ---
  {
    conversationId: "665000000000000000000002",
    userId: "c0000000-0000-0000-0000-000000000001",
    lastReadAt: ISODate("2025-06-16T09:15:00Z"),
    joinedAt: ISODate("2025-04-05T10:00:00Z"),
    lastActiveAt: ISODate("2025-06-16T09:15:00Z"),
    active: true,
    role: "MEMBER",
    typing: false,
    typingStartedAt: null,
    muted: false,
    mutedAt: null,
    clearedAt: null,
    deleted: false,
    deletedAt: null
  },
  {
    conversationId: "665000000000000000000002",
    userId: "c0000000-0000-0000-0000-000000000003",
    lastReadAt: ISODate("2025-06-16T09:10:00Z"),
    joinedAt: ISODate("2025-04-05T10:00:00Z"),
    lastActiveAt: ISODate("2025-06-16T09:10:00Z"),
    active: true,
    role: "MEMBER",
    typing: false,
    typingStartedAt: null,
    muted: false,
    mutedAt: null,
    clearedAt: null,
    deleted: false,
    deletedAt: null
  },

  // --- Conv 3: An & Seller Minh ---
  {
    conversationId: "665000000000000000000003",
    userId: "c0000000-0000-0000-0000-000000000001",
    lastReadAt: ISODate("2025-06-15T11:20:00Z"),
    joinedAt: ISODate("2025-04-12T14:00:00Z"),
    lastActiveAt: ISODate("2025-06-15T11:20:00Z"),
    active: true,
    role: "MEMBER",
    typing: false,
    typingStartedAt: null,
    muted: false,
    mutedAt: null,
    clearedAt: null,
    deleted: false,
    deletedAt: null
  },
  {
    conversationId: "665000000000000000000003",
    userId: "b0000000-0000-0000-0000-000000000001",
    lastReadAt: ISODate("2025-06-15T11:15:00Z"),
    joinedAt: ISODate("2025-04-12T14:00:00Z"),
    lastActiveAt: ISODate("2025-06-15T11:15:00Z"),
    active: true,
    role: "MEMBER",
    typing: false,
    typingStartedAt: null,
    muted: false,
    mutedAt: null,
    clearedAt: null,
    deleted: false,
    deletedAt: null
  },

  // --- Conv 4: Mai & Thảo ---
  {
    conversationId: "665000000000000000000004",
    userId: "c0000000-0000-0000-0000-000000000002",
    lastReadAt: ISODate("2025-06-14T20:45:00Z"),
    joinedAt: ISODate("2025-04-25T16:00:00Z"),
    lastActiveAt: ISODate("2025-06-14T20:45:00Z"),
    active: true,
    role: "MEMBER",
    typing: false,
    typingStartedAt: null,
    muted: false,
    mutedAt: null,
    clearedAt: null,
    deleted: false,
    deletedAt: null
  },
  {
    conversationId: "665000000000000000000004",
    userId: "c0000000-0000-0000-0000-000000000004",
    lastReadAt: ISODate("2025-06-14T20:40:00Z"),
    joinedAt: ISODate("2025-04-25T16:00:00Z"),
    lastActiveAt: ISODate("2025-06-14T20:40:00Z"),
    active: true,
    role: "MEMBER",
    typing: false,
    typingStartedAt: null,
    muted: true,
    mutedAt: ISODate("2025-06-10T09:00:00Z"),
    clearedAt: null,
    deleted: false,
    deletedAt: null
  },

  // --- Conv 5: Group "Hội Sài Gòn Ăn Vặt" ---
  {
    conversationId: "665000000000000000000005",
    userId: "c0000000-0000-0000-0000-000000000001",
    lastReadAt: ISODate("2025-06-17T04:00:00Z"),
    joinedAt: ISODate("2025-05-01T12:00:00Z"),
    lastActiveAt: ISODate("2025-06-17T04:00:00Z"),
    active: true,
    role: "ADMIN",
    typing: false,
    typingStartedAt: null,
    muted: false,
    mutedAt: null,
    clearedAt: null,
    deleted: false,
    deletedAt: null
  },
  {
    conversationId: "665000000000000000000005",
    userId: "c0000000-0000-0000-0000-000000000002",
    lastReadAt: ISODate("2025-06-17T03:55:00Z"),
    joinedAt: ISODate("2025-05-01T12:00:00Z"),
    lastActiveAt: ISODate("2025-06-17T03:55:00Z"),
    active: true,
    role: "MEMBER",
    typing: false,
    typingStartedAt: null,
    muted: false,
    mutedAt: null,
    clearedAt: null,
    deleted: false,
    deletedAt: null
  },
  {
    conversationId: "665000000000000000000005",
    userId: "c0000000-0000-0000-0000-000000000003",
    lastReadAt: ISODate("2025-06-17T03:50:00Z"),
    joinedAt: ISODate("2025-05-01T12:05:00Z"),
    lastActiveAt: ISODate("2025-06-17T03:50:00Z"),
    active: true,
    role: "MEMBER",
    typing: false,
    typingStartedAt: null,
    muted: false,
    mutedAt: null,
    clearedAt: null,
    deleted: false,
    deletedAt: null
  },
  {
    conversationId: "665000000000000000000005",
    userId: "c0000000-0000-0000-0000-000000000005",
    lastReadAt: ISODate("2025-06-16T22:00:00Z"),
    joinedAt: ISODate("2025-05-02T08:00:00Z"),
    lastActiveAt: ISODate("2025-06-16T22:00:00Z"),
    active: true,
    role: "MEMBER",
    typing: false,
    typingStartedAt: null,
    muted: false,
    mutedAt: null,
    clearedAt: null,
    deleted: false,
    deletedAt: null
  },
  {
    conversationId: "665000000000000000000005",
    userId: "d0000000-0000-0000-0000-000000000001",
    lastReadAt: ISODate("2025-06-17T03:45:00Z"),
    joinedAt: ISODate("2025-05-03T10:00:00Z"),
    lastActiveAt: ISODate("2025-06-17T03:45:00Z"),
    active: true,
    role: "MEMBER",
    typing: false,
    typingStartedAt: null,
    muted: false,
    mutedAt: null,
    clearedAt: null,
    deleted: false,
    deletedAt: null
  }
]);

print("✅ Inserted 14 conversation members");


// ============================================================
// 3. MESSAGES
// ============================================================

db.messages.insertMany([

  // ====== Conv 1: An & Mai ======
  {
    conversationId: "665000000000000000000001",
    senderId: "c0000000-0000-0000-0000-000000000001",
    content: "Mai ơi, cuối tuần này đi cà phê không?",
    type: "TEXT",
    createdAt: ISODate("2025-06-17T02:00:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000002", seenAt: ISODate("2025-06-17T02:05:00Z") }
    ]
  },
  {
    conversationId: "665000000000000000000001",
    senderId: "c0000000-0000-0000-0000-000000000002",
    content: "Được nè! Đi chỗ nào?",
    type: "TEXT",
    createdAt: ISODate("2025-06-17T02:05:30Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000001", seenAt: ISODate("2025-06-17T02:06:00Z") }
    ]
  },
  {
    conversationId: "665000000000000000000001",
    senderId: "c0000000-0000-0000-0000-000000000001",
    content: "The Coffee House Nguyễn Huệ nhé, view đẹp lắm!",
    type: "TEXT",
    createdAt: ISODate("2025-06-17T02:10:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000002", seenAt: ISODate("2025-06-17T02:12:00Z") }
    ]
  },
  // Location message
  {
    conversationId: "665000000000000000000001",
    senderId: "c0000000-0000-0000-0000-000000000001",
    content: "{\"shopId\": \"f0000000-0000-0000-0000-000000000001\", \"name\": \"The Coffee House - Nguyễn Huệ\", \"latitude\": 10.7769, \"longitude\": 106.7009, \"address\": \"82 Nguyễn Huệ, Quận 1\"}",
    type: "LOCATION",
    createdAt: ISODate("2025-06-17T02:10:30Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000002", seenAt: ISODate("2025-06-17T02:12:00Z") }
    ]
  },
  {
    conversationId: "665000000000000000000001",
    senderId: "c0000000-0000-0000-0000-000000000002",
    content: "Oke perfect! 9h sáng thứ 7 nhé 😍",
    type: "TEXT",
    createdAt: ISODate("2025-06-17T02:15:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000001", seenAt: ISODate("2025-06-17T02:16:00Z") }
    ]
  },
  {
    conversationId: "665000000000000000000001",
    senderId: "c0000000-0000-0000-0000-000000000001",
    content: "👍 See you!",
    type: "TEXT",
    createdAt: ISODate("2025-06-17T03:30:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "DELIVERED",
    seenBy: []
  },

  // ====== Conv 2: An & Khoa ======
  {
    conversationId: "665000000000000000000002",
    senderId: "c0000000-0000-0000-0000-000000000003",
    content: "An ơi, biết chỗ nào spa tốt ở Thủ Đức không?",
    type: "TEXT",
    createdAt: ISODate("2025-06-16T09:00:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000001", seenAt: ISODate("2025-06-16T09:05:00Z") }
    ]
  },
  {
    conversationId: "665000000000000000000002",
    senderId: "c0000000-0000-0000-0000-000000000001",
    content: "Có nè! Zen Spa ở Thảo Điền, mình đi rồi thấy ok lắm",
    type: "TEXT",
    createdAt: ISODate("2025-06-16T09:06:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000003", seenAt: ISODate("2025-06-16T09:08:00Z") }
    ]
  },
  // Location share
  {
    conversationId: "665000000000000000000002",
    senderId: "c0000000-0000-0000-0000-000000000001",
    content: "{\"shopId\": \"f0000000-0000-0000-0000-000000000004\", \"name\": \"Zen Spa & Wellness\", \"latitude\": 10.7872, \"longitude\": 106.7505, \"address\": \"15 Thảo Điền, TP. Thủ Đức\"}",
    type: "LOCATION",
    createdAt: ISODate("2025-06-16T09:07:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000003", seenAt: ISODate("2025-06-16T09:08:00Z") }
    ]
  },
  {
    conversationId: "665000000000000000000002",
    senderId: "c0000000-0000-0000-0000-000000000003",
    content: "Thanks bạn! Để cuối tuần mình book 🙏",
    type: "TEXT",
    createdAt: ISODate("2025-06-16T09:15:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000001", seenAt: ISODate("2025-06-16T09:15:30Z") }
    ]
  },

  // ====== Conv 3: An & Seller Minh ======
  {
    conversationId: "665000000000000000000003",
    senderId: "c0000000-0000-0000-0000-000000000001",
    content: "Anh Minh ơi, quán Coffee House có nhận đặt bàn trước không ạ?",
    type: "TEXT",
    createdAt: ISODate("2025-06-15T11:00:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "b0000000-0000-0000-0000-000000000001", seenAt: ISODate("2025-06-15T11:05:00Z") }
    ]
  },
  {
    conversationId: "665000000000000000000003",
    senderId: "b0000000-0000-0000-0000-000000000001",
    content: "Chào em! Có nhận đặt bàn nha. Em muốn đặt ngày nào, mấy người?",
    type: "TEXT",
    createdAt: ISODate("2025-06-15T11:06:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000001", seenAt: ISODate("2025-06-15T11:07:00Z") }
    ]
  },
  {
    conversationId: "665000000000000000000003",
    senderId: "c0000000-0000-0000-0000-000000000001",
    content: "Em muốn đặt thứ 7 này, 9h sáng, 2 người ạ",
    type: "TEXT",
    createdAt: ISODate("2025-06-15T11:10:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "b0000000-0000-0000-0000-000000000001", seenAt: ISODate("2025-06-15T11:12:00Z") }
    ]
  },
  {
    conversationId: "665000000000000000000003",
    senderId: "b0000000-0000-0000-0000-000000000001",
    content: "OK anh ghi nhận rồi nha! Bàn view phố đi bộ luôn nhé 😊",
    type: "TEXT",
    createdAt: ISODate("2025-06-15T11:20:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "DELIVERED",
    seenBy: []
  },

  // ====== Conv 4: Mai & Thảo ======
  {
    conversationId: "665000000000000000000004",
    senderId: "c0000000-0000-0000-0000-000000000002",
    content: "Thảo ơi, quán ăn vặt Bạch Đằng ngon lắm nè",
    type: "TEXT",
    createdAt: ISODate("2025-06-14T20:00:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000004", seenAt: ISODate("2025-06-14T20:10:00Z") }
    ]
  },
  // Image message
  {
    conversationId: "665000000000000000000004",
    senderId: "c0000000-0000-0000-0000-000000000002",
    content: "Bánh tráng trộn siêu ngon!",
    type: "IMAGE",
    createdAt: ISODate("2025-06-14T20:01:00Z"),
    replyToMessageId: null,
    attachmentUrls: ["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400"],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000004", seenAt: ISODate("2025-06-14T20:10:00Z") }
    ]
  },
  {
    conversationId: "665000000000000000000004",
    senderId: "c0000000-0000-0000-0000-000000000004",
    content: "Trời ơi ngon quá! Ở đâu vậy Mai?",
    type: "TEXT",
    createdAt: ISODate("2025-06-14T20:15:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000002", seenAt: ISODate("2025-06-14T20:16:00Z") }
    ]
  },
  {
    conversationId: "665000000000000000000004",
    senderId: "c0000000-0000-0000-0000-000000000002",
    content: "{\"shopId\": \"f0000000-0000-0000-0000-000000000005\", \"name\": \"Ăn Vặt Bà Huyện\", \"latitude\": 10.8041, \"longitude\": 106.7132, \"address\": \"130 Bạch Đằng, Bình Thạnh\"}",
    type: "LOCATION",
    createdAt: ISODate("2025-06-14T20:20:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000004", seenAt: ISODate("2025-06-14T20:25:00Z") }
    ]
  },
  {
    conversationId: "665000000000000000000004",
    senderId: "c0000000-0000-0000-0000-000000000004",
    content: "Cảm ơn bạn! Cuối tuần mình sẽ ghé 🤤",
    type: "TEXT",
    createdAt: ISODate("2025-06-14T20:45:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "DELIVERED",
    seenBy: []
  },

  // ====== Conv 5: Group Chat "Hội Sài Gòn Ăn Vặt" ======
  // System message
  {
    conversationId: "665000000000000000000005",
    senderId: "c0000000-0000-0000-0000-000000000001",
    content: "Trần Thiên Ân đã tạo nhóm \"Hội Sài Gòn Ăn Vặt 🍜\"",
    type: "SYSTEM",
    createdAt: ISODate("2025-05-01T12:00:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000002", seenAt: ISODate("2025-05-01T12:05:00Z") },
      { userId: "c0000000-0000-0000-0000-000000000003", seenAt: ISODate("2025-05-01T12:10:00Z") },
      { userId: "c0000000-0000-0000-0000-000000000005", seenAt: ISODate("2025-05-02T08:00:00Z") },
      { userId: "d0000000-0000-0000-0000-000000000001", seenAt: ISODate("2025-05-03T10:00:00Z") }
    ]
  },
  {
    conversationId: "665000000000000000000005",
    senderId: "c0000000-0000-0000-0000-000000000001",
    content: "Chào mọi người! Nhóm này mình chia sẻ các quán ăn ngon ở Sài Gòn nhé 🎉",
    type: "TEXT",
    createdAt: ISODate("2025-05-01T12:01:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000002", seenAt: ISODate("2025-05-01T12:05:00Z") },
      { userId: "c0000000-0000-0000-0000-000000000003", seenAt: ISODate("2025-05-01T12:10:00Z") },
      { userId: "c0000000-0000-0000-0000-000000000005", seenAt: ISODate("2025-05-02T08:00:00Z") },
      { userId: "d0000000-0000-0000-0000-000000000001", seenAt: ISODate("2025-05-03T10:00:00Z") }
    ]
  },
  {
    conversationId: "665000000000000000000005",
    senderId: "c0000000-0000-0000-0000-000000000002",
    content: "Yeahhh! Mình biết quán phở Hòa ở Pasteur ngon lắm nè",
    type: "TEXT",
    createdAt: ISODate("2025-06-16T08:00:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000001", seenAt: ISODate("2025-06-16T08:05:00Z") },
      { userId: "c0000000-0000-0000-0000-000000000003", seenAt: ISODate("2025-06-16T08:10:00Z") },
      { userId: "d0000000-0000-0000-0000-000000000001", seenAt: ISODate("2025-06-16T08:15:00Z") }
    ]
  },
  {
    conversationId: "665000000000000000000005",
    senderId: "c0000000-0000-0000-0000-000000000002",
    content: "{\"shopId\": \"f0000000-0000-0000-0000-000000000002\", \"name\": \"Phở Hòa Pasteur\", \"latitude\": 10.7834, \"longitude\": 106.6912, \"address\": \"260C Pasteur, Quận 3\"}",
    type: "LOCATION",
    createdAt: ISODate("2025-06-16T08:01:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000001", seenAt: ISODate("2025-06-16T08:05:00Z") },
      { userId: "c0000000-0000-0000-0000-000000000003", seenAt: ISODate("2025-06-16T08:10:00Z") },
      { userId: "d0000000-0000-0000-0000-000000000001", seenAt: ISODate("2025-06-16T08:15:00Z") }
    ]
  },
  {
    conversationId: "665000000000000000000005",
    senderId: "c0000000-0000-0000-0000-000000000003",
    content: "Phở Hòa GOAT! 🐐 Ai chưa ăn là thiếu sót",
    type: "TEXT",
    createdAt: ISODate("2025-06-16T08:15:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000001", seenAt: ISODate("2025-06-16T08:16:00Z") },
      { userId: "c0000000-0000-0000-0000-000000000002", seenAt: ISODate("2025-06-16T08:17:00Z") },
      { userId: "d0000000-0000-0000-0000-000000000001", seenAt: ISODate("2025-06-16T08:20:00Z") }
    ]
  },
  {
    conversationId: "665000000000000000000005",
    senderId: "d0000000-0000-0000-0000-000000000001",
    content: "Mình recommend Paris Baguette ở Phan Xích Long nha, bánh sừng bò giòn tan luôn 🥐",
    type: "TEXT",
    createdAt: ISODate("2025-06-17T03:30:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SEEN",
    seenBy: [
      { userId: "c0000000-0000-0000-0000-000000000001", seenAt: ISODate("2025-06-17T03:35:00Z") },
      { userId: "c0000000-0000-0000-0000-000000000002", seenAt: ISODate("2025-06-17T03:40:00Z") },
      { userId: "c0000000-0000-0000-0000-000000000003", seenAt: ISODate("2025-06-17T03:45:00Z") }
    ]
  },
  {
    conversationId: "665000000000000000000005",
    senderId: "c0000000-0000-0000-0000-000000000001",
    content: "Weekend này cả nhóm đi khám phá quán mới không? 🚗💨",
    type: "TEXT",
    createdAt: ISODate("2025-06-17T04:00:00Z"),
    replyToMessageId: null,
    attachmentUrls: [],
    deleted: false,
    updatedAt: null,
    edited: false,
    status: "SENT",
    seenBy: []
  }
]);

print("✅ Inserted 28 messages");

// ============================================================
// HOÀN TẤT! Tổng kết dữ liệu mẫu MongoDB:
// ============================================================
// ✅ 5 Conversations (4 private + 1 group chat)
// ✅ 14 Conversation Members
// ✅ 28 Messages (TEXT, LOCATION, IMAGE, SYSTEM types)
//    - Message statuses: SENT, DELIVERED, SEEN
//    - SeenBy tracking
//    - Cuộc hội thoại tự nhiên bằng tiếng Việt
//    - Chia sẻ location (shop) trong chat
// ============================================================

print("\n🎉 All MongoDB sample data inserted successfully!");

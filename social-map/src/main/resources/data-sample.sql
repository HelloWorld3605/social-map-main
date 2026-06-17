-- ============================================================
-- SOCIAL MAP - DỮ LIỆU MẪU (PostgreSQL + PostGIS)
-- ============================================================
-- Lưu ý: 
--   - password_hash là BCrypt hash của "password123"
--   - Tọa độ các shop nằm trong khu vực TP. Hồ Chí Minh
--   - Chạy script này SAU KHI Hibernate đã tạo schema (ddl-auto: update)
--   - Cần bật extension PostGIS: CREATE EXTENSION IF NOT EXISTS postgis;
-- ============================================================

-- Bật PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- 1. USERS (15 users với nhiều role khác nhau)
-- ============================================================
INSERT INTO users (id, email, password_hash, display_name, user_role, avatar_url, cover_photo, citizen_id, is_online, last_active_at, is_email_verified, created_at, updated_at, last_name_change_date)
VALUES
-- SUPER_ADMIN
('a0000000-0000-0000-0000-000000000001', 'admin@socialmap.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Super Admin', 'SUPER_ADMIN', 'https://res.cloudinary.com/dz9q8zkeh/image/upload/v1756438809/istockphoto-1393750072-612x612_n1h47x.jpg', NULL, '001099000001', true, NOW(), true, '2025-01-01 08:00:00', NOW(), NULL),

-- ADMIN
('a0000000-0000-0000-0000-000000000002', 'moderator@socialmap.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Mod Tuấn', 'ADMIN', 'https://res.cloudinary.com/dz9q8zkeh/image/upload/v1756438809/istockphoto-1393750072-612x612_n1h47x.jpg', NULL, '001099000002', false, '2025-06-15 10:30:00', true, '2025-01-15 09:00:00', NOW(), NULL),

-- SELLER users (5 sellers - chủ shop)
('b0000000-0000-0000-0000-000000000001', 'seller.minh@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Nguyễn Văn Minh', 'SELLER', 'https://randomuser.me/api/portraits/men/1.jpg', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', '079200001001', true, NOW(), true, '2025-02-01 10:00:00', NOW(), '2025-02-01 10:00:00'),

('b0000000-0000-0000-0000-000000000002', 'seller.hoa@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Trần Thị Hoa', 'SELLER', 'https://randomuser.me/api/portraits/women/2.jpg', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', '079200001002', true, NOW(), true, '2025-02-10 11:00:00', NOW(), '2025-02-10 11:00:00'),

('b0000000-0000-0000-0000-000000000003', 'seller.duc@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Lê Hoàng Đức', 'SELLER', 'https://randomuser.me/api/portraits/men/3.jpg', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', '079200001003', false, '2025-06-14 18:00:00', true, '2025-03-01 09:30:00', NOW(), '2025-03-01 09:30:00'),

('b0000000-0000-0000-0000-000000000004', 'seller.linh@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Phạm Thùy Linh', 'SELLER', 'https://randomuser.me/api/portraits/women/4.jpg', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800', '079200001004', true, NOW(), true, '2025-03-15 14:00:00', NOW(), '2025-03-15 14:00:00'),

('b0000000-0000-0000-0000-000000000005', 'seller.tuan@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Võ Thanh Tuấn', 'SELLER', 'https://randomuser.me/api/portraits/men/5.jpg', 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800', '079200001005', false, '2025-06-10 22:00:00', true, '2025-04-01 08:00:00', NOW(), '2025-04-01 08:00:00'),

-- Regular USER (6 users bình thường)
('c0000000-0000-0000-0000-000000000001', 'user.an@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Trần Thiên Ân', 'USER', 'https://randomuser.me/api/portraits/men/10.jpg', NULL, NULL, true, NOW(), true, '2025-03-01 12:00:00', NOW(), NULL),

('c0000000-0000-0000-0000-000000000002', 'user.mai@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Nguyễn Thị Mai', 'USER', 'https://randomuser.me/api/portraits/women/11.jpg', NULL, NULL, false, '2025-06-16 08:45:00', true, '2025-03-10 15:00:00', NOW(), NULL),

('c0000000-0000-0000-0000-000000000003', 'user.khoa@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Đặng Quốc Khoa', 'USER', 'https://randomuser.me/api/portraits/men/12.jpg', NULL, NULL, true, NOW(), true, '2025-04-01 09:00:00', NOW(), NULL),

('c0000000-0000-0000-0000-000000000004', 'user.thao@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Lê Phương Thảo', 'USER', 'https://randomuser.me/api/portraits/women/13.jpg', NULL, NULL, false, '2025-06-15 20:00:00', true, '2025-04-15 11:30:00', NOW(), NULL),

('c0000000-0000-0000-0000-000000000005', 'user.nam@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Huỳnh Hoàng Nam', 'USER', 'https://randomuser.me/api/portraits/men/14.jpg', NULL, NULL, true, NOW(), true, '2025-05-01 10:00:00', NOW(), NULL),

('c0000000-0000-0000-0000-000000000006', 'user.vy@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Bùi Tường Vy', 'USER', 'https://randomuser.me/api/portraits/women/15.jpg', NULL, NULL, false, '2025-06-12 16:00:00', true, '2025-05-15 13:00:00', NOW(), NULL),

-- PREMIUM user
('d0000000-0000-0000-0000-000000000001', 'premium.hung@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Ngô Quang Hùng', 'PREMIUM', 'https://randomuser.me/api/portraits/men/20.jpg', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', NULL, true, NOW(), true, '2025-02-20 10:00:00', NOW(), NULL);


-- ============================================================
-- 2. TAGS (Danh mục shop)
-- ============================================================
INSERT INTO tags (id, name) VALUES
('e0000000-0000-0000-0000-000000000001', 'Đồ ăn'),
('e0000000-0000-0000-0000-000000000002', 'Cà phê'),
('e0000000-0000-0000-0000-000000000003', 'Trà sữa'),
('e0000000-0000-0000-0000-000000000004', 'Thời trang'),
('e0000000-0000-0000-0000-000000000005', 'Spa & Làm đẹp'),
('e0000000-0000-0000-0000-000000000006', 'Gym & Fitness'),
('e0000000-0000-0000-0000-000000000007', 'Siêu thị'),
('e0000000-0000-0000-0000-000000000008', 'Giải trí'),
('e0000000-0000-0000-0000-000000000009', 'Sách & Văn phòng phẩm'),
('e0000000-0000-0000-0000-000000000010', 'Điện tử'),
('e0000000-0000-0000-0000-000000000011', 'Ăn vặt'),
('e0000000-0000-0000-0000-000000000012', 'Nhà hàng'),
('e0000000-0000-0000-0000-000000000013', 'Bánh & Dessert'),
('e0000000-0000-0000-0000-000000000014', 'Nước ép & Smoothie'),
('e0000000-0000-0000-0000-000000000015', 'Tiệm tóc');


-- ============================================================
-- 3. SHOPS (10 shops ở khu vực TP.HCM)
-- ============================================================
INSERT INTO shops (id, latitude, longitude, location, created_at, updated_at, deleted_at, name, address, description, phone_number, opening_time, closing_time, status, rating, review_count)
VALUES
-- Shop 1: Quán cà phê Quận 1
('f0000000-0000-0000-0000-000000000001', 10.7769, 106.7009, ST_SetSRID(ST_MakePoint(106.7009, 10.7769), 4326)::geography, '2025-02-05 08:00:00', NOW(), NULL,
 'The Coffee House - Nguyễn Huệ', '82 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
 'Không gian cà phê hiện đại, view đẹp nhìn ra phố đi bộ Nguyễn Huệ. Thích hợp cho làm việc và gặp gỡ bạn bè.',
 '0901234567', '07:00:00', '22:30:00', 'OPEN', 4.5, 128),

-- Shop 2: Nhà hàng Quận 3
('f0000000-0000-0000-0000-000000000002', 10.7834, 106.6912, ST_SetSRID(ST_MakePoint(106.6912, 10.7834), 4326)::geography, '2025-02-15 09:00:00', NOW(), NULL,
 'Phở Hòa Pasteur', '260C Pasteur, Phường 8, Quận 3, TP.HCM',
 'Phở truyền thống Sài Gòn nổi tiếng từ năm 1968. Nước dùng đậm đà, thịt bò tươi mềm.',
 '0281234568', '06:00:00', '23:00:00', 'OPEN', 4.7, 356),

-- Shop 3: Trà sữa Quận 7
('f0000000-0000-0000-0000-000000000003', 10.7295, 106.7218, ST_SetSRID(ST_MakePoint(106.7218, 10.7295), 4326)::geography, '2025-03-01 10:00:00', NOW(), NULL,
 'Tiger Sugar Phú Mỹ Hưng', 'L1-08 Crescent Mall, 101 Tôn Dật Tiên, Quận 7, TP.HCM',
 'Trà sữa đường đen Đài Loan chính gốc. Topping trân châu nóng, sữa tươi béo ngậy.',
 '0901234569', '09:30:00', '22:00:00', 'OPEN', 4.3, 89),

-- Shop 4: Spa Quận 2 (Thủ Đức)
('f0000000-0000-0000-0000-000000000004', 10.7872, 106.7505, ST_SetSRID(ST_MakePoint(106.7505, 10.7872), 4326)::geography, '2025-03-20 11:00:00', NOW(), NULL,
 'Zen Spa & Wellness', '15 Thảo Điền, Phường Thảo Điền, TP. Thủ Đức, TP.HCM',
 'Spa cao cấp với dịch vụ massage, chăm sóc da mặt, body. Không gian yên tĩnh, thư giãn.',
 '0901234570', '09:00:00', '21:00:00', 'OPEN', 4.8, 67),

-- Shop 5: Quán ăn vặt Quận Bình Thạnh
('f0000000-0000-0000-0000-000000000005', 10.8041, 106.7132, ST_SetSRID(ST_MakePoint(106.7132, 10.8041), 4326)::geography, '2025-04-01 08:30:00', NOW(), NULL,
 'Ăn Vặt Bà Huyện', '130 Bạch Đằng, Phường 24, Quận Bình Thạnh, TP.HCM',
 'Quán ăn vặt nổi tiếng với các món bánh tráng trộn, nem chua rán, xiên que đa dạng.',
 '0901234571', '14:00:00', '22:00:00', 'OPEN', 4.2, 215),

-- Shop 6: Gym Quận 10
('f0000000-0000-0000-0000-000000000006', 10.7726, 106.6681, ST_SetSRID(ST_MakePoint(106.6681, 10.7726), 4326)::geography, '2025-04-10 07:00:00', NOW(), NULL,
 'California Fitness & Yoga', '115 Sư Vạn Hạnh, Phường 13, Quận 10, TP.HCM',
 'Phòng tập gym hiện đại với đầy đủ thiết bị, lớp yoga, zumba, và huấn luyện viên cá nhân.',
 '0281234572', '05:30:00', '23:00:00', 'OPEN', 4.4, 178),

-- Shop 7: Tiệm bánh Quận Phú Nhuận
('f0000000-0000-0000-0000-000000000007', 10.7993, 106.6823, ST_SetSRID(ST_MakePoint(106.6823, 10.7993), 4326)::geography, '2025-04-20 09:00:00', NOW(), NULL,
 'Paris Baguette Phan Xích Long', '45 Phan Xích Long, Phường 2, Quận Phú Nhuận, TP.HCM',
 'Tiệm bánh Hàn Quốc cao cấp với bánh mì tươi, bánh ngọt, và cà phê thơm ngon.',
 '0901234573', '07:00:00', '22:00:00', 'OPEN', 4.6, 94),

-- Shop 8: Shop thời trang Quận 5 (CLOSED)
('f0000000-0000-0000-0000-000000000008', 10.7540, 106.6633, ST_SetSRID(ST_MakePoint(106.6633, 10.7540), 4326)::geography, '2025-05-01 10:00:00', NOW(), NULL,
 'Routine Vietnam', '156 Trần Hưng Đạo, Phường 10, Quận 5, TP.HCM',
 'Thương hiệu thời trang Việt Nam với phong cách tối giản, chất lượng cao.',
 '0901234574', '09:00:00', '21:30:00', 'CLOSED', 4.1, 42),

-- Shop 9: Quán nước ép Gò Vấp  
('f0000000-0000-0000-0000-000000000009', 10.8388, 106.6652, ST_SetSRID(ST_MakePoint(106.6652, 10.8388), 4326)::geography, '2025-05-10 08:00:00', NOW(), NULL,
 'Fresh Garden Juice', '23 Nguyễn Oanh, Phường 17, Quận Gò Vấp, TP.HCM',
 'Nước ép trái cây tươi, smoothie healthy, sinh tố bổ dưỡng. Nguyên liệu organic.',
 '0901234575', '07:30:00', '21:00:00', 'OPEN', 4.0, 53),

-- Shop 10: Tiệm tóc Tân Bình (BUSY)
('f0000000-0000-0000-0000-000000000010', 10.8018, 106.6535, ST_SetSRID(ST_MakePoint(106.6535, 10.8018), 4326)::geography, '2025-05-20 09:30:00', NOW(), NULL,
 '30Shine - Cộng Hòa', '425 Cộng Hòa, Phường 15, Quận Tân Bình, TP.HCM',
 'Chuỗi cắt tóc nam nổi tiếng. Combo cắt gội massage chuyên nghiệp. Đặt lịch online.',
 '0901234576', '08:00:00', '21:00:00', 'BUSY', 4.3, 289);


-- ============================================================
-- 4. SHOP_TAGS (Gắn tags cho shops)
-- ============================================================
INSERT INTO shop_tags (shop_id, tag_id) VALUES
-- The Coffee House: Cà phê
('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002'),
-- Phở Hòa: Đồ ăn, Nhà hàng
('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000012'),
-- Tiger Sugar: Trà sữa
('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003'),
-- Zen Spa: Spa & Làm đẹp
('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000005'),
-- Ăn Vặt Bà Huyện: Đồ ăn, Ăn vặt
('f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000011'),
-- California Fitness: Gym & Fitness
('f0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000006'),
-- Paris Baguette: Bánh & Dessert, Cà phê
('f0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000013'),
('f0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000002'),
-- Routine: Thời trang
('f0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000004'),
-- Fresh Garden: Nước ép & Smoothie
('f0000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000014'),
-- 30Shine: Tiệm tóc
('f0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000015');


-- ============================================================
-- 5. SHOP_IMAGES (Hình ảnh cho các shop)
-- ============================================================
INSERT INTO shop_images (shop_id, image_url) VALUES
('f0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800'),
('f0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=800'),
('f0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1583032015879-e5022cb87c3b?w=800'),
('f0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=800'),
('f0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=800'),
('f0000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800'),
('f0000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800'),
('f0000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'),
('f0000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'),
('f0000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'),
('f0000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800'),
('f0000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'),
('f0000000-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=800'),
('f0000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1521590832167-7228fcbdb4f4?w=800');


-- ============================================================
-- 6. USER_SHOP (Quan hệ user-shop: ai quản lý shop nào)
-- ============================================================
INSERT INTO user_shop (id, user_id, shop_id, manager_role, joined_at, left_at) VALUES
-- Seller Minh → Owner The Coffee House & Phở Hòa
('10000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'OWNER', '2025-02-05 08:00:00', NULL),
('10000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 'OWNER', '2025-02-15 09:00:00', NULL),

-- Seller Hoa → Owner Tiger Sugar & Paris Baguette
('10000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000003', 'OWNER', '2025-03-01 10:00:00', NULL),
('10000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000007', 'OWNER', '2025-04-20 09:00:00', NULL),

-- Seller Đức → Owner Zen Spa & Ăn Vặt Bà Huyện
('10000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000004', 'OWNER', '2025-03-20 11:00:00', NULL),
('10000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000005', 'OWNER', '2025-04-01 08:30:00', NULL),

-- Seller Linh → Owner California Fitness & Routine
('10000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000006', 'OWNER', '2025-04-10 07:00:00', NULL),
('10000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000008', 'OWNER', '2025-05-01 10:00:00', NULL),

-- Seller Tuấn → Owner Fresh Garden & 30Shine
('10000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000009', 'OWNER', '2025-05-10 08:00:00', NULL),
('10000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000010', 'OWNER', '2025-05-20 09:30:00', NULL),

-- User An → Staff ở The Coffee House
('10000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'STAFF', '2025-04-01 08:00:00', NULL),

-- User Khoa → Manager ở Phở Hòa
('10000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000002', 'MANAGER', '2025-05-01 09:00:00', NULL);


-- ============================================================
-- 7. MENUS & MENU_ITEMS (Thực đơn cho các shop)
-- ============================================================

-- === The Coffee House - Menus ===
INSERT INTO menus (id, name, shop_id) VALUES
('20000000-0000-0000-0000-000000000001', 'Cà Phê', 'f0000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000002', 'Trà & Nước Ép', 'f0000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000003', 'Bánh Ngọt', 'f0000000-0000-0000-0000-000000000001');

INSERT INTO menu_items (id, name, description, price, image_url, menu_id) VALUES
('30000000-0000-0000-0000-000000000001', 'Cà Phê Sữa Đá', 'Cà phê phin truyền thống kết hợp sữa đặc, đá mát lạnh', 35000, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=400', '20000000-0000-0000-0000-000000000001'),
('30000000-0000-0000-0000-000000000002', 'Cappuccino', 'Espresso Italy với lớp sữa bọt mịn màng', 55000, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', '20000000-0000-0000-0000-000000000001'),
('30000000-0000-0000-0000-000000000003', 'Cold Brew', 'Cà phê pha lạnh 18 giờ, vị thanh nhẹ', 49000, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', '20000000-0000-0000-0000-000000000001'),
('30000000-0000-0000-0000-000000000004', 'Trà Sen Vàng', 'Trà oolong hạt sen, mát lịm, thơm thanh', 45000, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', '20000000-0000-0000-0000-000000000002'),
('30000000-0000-0000-0000-000000000005', 'Nước Ép Cam', 'Cam tươi ép nguyên chất, không đường', 40000, 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400', '20000000-0000-0000-0000-000000000002'),
('30000000-0000-0000-0000-000000000006', 'Croissant Bơ', 'Bánh sừng bò Pháp giòn tan, nhân bơ thơm', 35000, 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=400', '20000000-0000-0000-0000-000000000003');

-- === Phở Hòa - Menus ===
INSERT INTO menus (id, name, shop_id) VALUES
('20000000-0000-0000-0000-000000000004', 'Phở', 'f0000000-0000-0000-0000-000000000002'),
('20000000-0000-0000-0000-000000000005', 'Đồ Uống', 'f0000000-0000-0000-0000-000000000002');

INSERT INTO menu_items (id, name, description, price, image_url, menu_id) VALUES
('30000000-0000-0000-0000-000000000007', 'Phở Bò Tái', 'Phở bò tái lát mỏng, nước dùng hầm xương 12 giờ', 65000, 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400', '20000000-0000-0000-0000-000000000004'),
('30000000-0000-0000-0000-000000000008', 'Phở Bò Tái Nạm', 'Phở bò tái kết hợp nạm mềm, bò viên giòn', 75000, 'https://images.unsplash.com/photo-1576577445504-6af96477db52?w=400', '20000000-0000-0000-0000-000000000004'),
('30000000-0000-0000-0000-000000000009', 'Phở Bò Đặc Biệt', 'Tất cả topping: tái, nạm, gầu, gân, bò viên', 89000, NULL, '20000000-0000-0000-0000-000000000004'),
('30000000-0000-0000-0000-000000000010', 'Trà Đá', 'Trà đá miễn phí', 0, NULL, '20000000-0000-0000-0000-000000000005'),
('30000000-0000-0000-0000-000000000011', 'Nước Ngọt', 'Coca, Pepsi, 7Up', 20000, NULL, '20000000-0000-0000-0000-000000000005');

-- === Tiger Sugar - Menu ===
INSERT INTO menus (id, name, shop_id) VALUES
('20000000-0000-0000-0000-000000000006', 'Trà Sữa Signature', 'f0000000-0000-0000-0000-000000000003');

INSERT INTO menu_items (id, name, description, price, image_url, menu_id) VALUES
('30000000-0000-0000-0000-000000000012', 'Brown Sugar Boba Milk', 'Trà sữa đường đen với trân châu nóng', 55000, 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=400', '20000000-0000-0000-0000-000000000006'),
('30000000-0000-0000-0000-000000000013', 'Tiger Black Tea Latte', 'Trà đen pha sữa tươi, vân hổ đặc trưng', 59000, NULL, '20000000-0000-0000-0000-000000000006'),
('30000000-0000-0000-0000-000000000014', 'Matcha Latte', 'Matcha Nhật Bản pha sữa tươi, ngọt nhẹ', 62000, NULL, '20000000-0000-0000-0000-000000000006');

-- === Zen Spa - Menu dịch vụ ===
INSERT INTO menus (id, name, shop_id) VALUES
('20000000-0000-0000-0000-000000000007', 'Dịch Vụ Spa', 'f0000000-0000-0000-0000-000000000004');

INSERT INTO menu_items (id, name, description, price, image_url, menu_id) VALUES
('30000000-0000-0000-0000-000000000015', 'Massage Body 60 phút', 'Massage toàn thân với tinh dầu thiên nhiên', 350000, NULL, '20000000-0000-0000-0000-000000000007'),
('30000000-0000-0000-0000-000000000016', 'Chăm Sóc Da Mặt', 'Làm sạch, tẩy tế bào chết, đắp mặt nạ collagen', 450000, NULL, '20000000-0000-0000-0000-000000000007'),
('30000000-0000-0000-0000-000000000017', 'Combo VIP', 'Massage body + chăm sóc da mặt + xông hơi', 750000, NULL, '20000000-0000-0000-0000-000000000007');

-- === Ăn Vặt Bà Huyện - Menu ===
INSERT INTO menus (id, name, shop_id) VALUES
('20000000-0000-0000-0000-000000000008', 'Ăn Vặt', 'f0000000-0000-0000-0000-000000000005');

INSERT INTO menu_items (id, name, description, price, image_url, menu_id) VALUES
('30000000-0000-0000-0000-000000000018', 'Bánh Tráng Trộn', 'Bánh tráng mắm ruốc, rau răm, đậu phộng', 25000, NULL, '20000000-0000-0000-0000-000000000008'),
('30000000-0000-0000-0000-000000000019', 'Nem Chua Rán', 'Nem chua rán giòn, chấm tương ớt', 30000, NULL, '20000000-0000-0000-0000-000000000008'),
('30000000-0000-0000-0000-000000000020', 'Xiên Que Nướng (5 que)', 'Hỗn hợp xiên thịt bò, tôm, rau củ', 45000, NULL, '20000000-0000-0000-0000-000000000008'),
('30000000-0000-0000-0000-000000000021', 'Bắp Xào Bơ', 'Bắp ngọt xào bơ tỏi, tôm khô', 30000, NULL, '20000000-0000-0000-0000-000000000008');

-- === California Fitness - Gói tập ===
INSERT INTO menus (id, name, shop_id) VALUES
('20000000-0000-0000-0000-000000000009', 'Gói Tập', 'f0000000-0000-0000-0000-000000000006');

INSERT INTO menu_items (id, name, description, price, image_url, menu_id) VALUES
('30000000-0000-0000-0000-000000000022', 'Gói 1 Tháng', 'Truy cập toàn bộ thiết bị + lớp group', 800000, NULL, '20000000-0000-0000-0000-000000000009'),
('30000000-0000-0000-0000-000000000023', 'Gói 6 Tháng', 'Tiết kiệm 20%, tặng 1 buổi PT', 3800000, NULL, '20000000-0000-0000-0000-000000000009'),
('30000000-0000-0000-0000-000000000024', 'PT Cá Nhân (1 buổi)', 'Huấn luyện viên cá nhân 60 phút', 500000, NULL, '20000000-0000-0000-0000-000000000009');

-- === 30Shine - Menu cắt tóc ===
INSERT INTO menus (id, name, shop_id) VALUES
('20000000-0000-0000-0000-000000000010', 'Dịch Vụ', 'f0000000-0000-0000-0000-000000000010');

INSERT INTO menu_items (id, name, description, price, image_url, menu_id) VALUES
('30000000-0000-0000-0000-000000000025', 'Combo Cắt Gội 10 Bước', 'Cắt tóc + gội đầu + massage 10 bước chuẩn', 80000, NULL, '20000000-0000-0000-0000-000000000010'),
('30000000-0000-0000-0000-000000000026', 'Uốn Tóc Hàn Quốc', 'Uốn setting kiểu Hàn, giữ nếp 3-6 tháng', 350000, NULL, '20000000-0000-0000-0000-000000000010'),
('30000000-0000-0000-0000-000000000027', 'Nhuộm Tóc', 'Nhuộm highlight hoặc full đầu, thuốc nhuộm cao cấp', 300000, NULL, '20000000-0000-0000-0000-000000000010');


-- ============================================================
-- 8. FRIENDSHIPS (Quan hệ bạn bè giữa các users)
-- ============================================================
INSERT INTO friendships (sender_id, receiver_id, status, created_at, updated_at) VALUES
-- An & Mai: Đã là bạn
('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'ACCEPTED', '2025-03-15 10:00:00', '2025-03-15 12:00:00'),
-- An & Khoa: Đã là bạn
('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'ACCEPTED', '2025-04-01 14:00:00', '2025-04-01 15:30:00'),
-- An & Seller Minh: Đã là bạn
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'ACCEPTED', '2025-04-10 09:00:00', '2025-04-10 09:30:00'),
-- Mai & Thảo: Đã là bạn
('c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 'ACCEPTED', '2025-04-20 16:00:00', '2025-04-20 17:00:00'),
-- Khoa → Nam: Đang chờ chấp nhận
('c0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000005', 'PENDING', '2025-06-10 11:00:00', '2025-06-10 11:00:00'),
-- Vy → An: Đang chờ chấp nhận
('c0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'PENDING', '2025-06-12 14:00:00', '2025-06-12 14:00:00'),
-- Nam & Premium Hùng: Đã là bạn
('c0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', 'ACCEPTED', '2025-05-05 10:00:00', '2025-05-05 10:30:00'),
-- Thảo → Seller Hoa: Đã block
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'BLOCKED', '2025-05-15 20:00:00', '2025-05-20 08:00:00'),
-- Premium Hùng & Seller Đức: Đã là bạn
('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'ACCEPTED', '2025-04-25 13:00:00', '2025-04-25 14:00:00'),
-- Seller Minh & Seller Hoa: Đã là bạn (seller community)
('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'ACCEPTED', '2025-03-01 10:00:00', '2025-03-01 11:00:00');


-- ============================================================
-- 9. SELLER_REQUESTS (Yêu cầu trở thành seller)
-- ============================================================
INSERT INTO seller_requests (id, user_id, citizen_id, status, reject_reason, reviewed_by, reviewed_at, created_at, updated_at) VALUES
-- User Nam xin làm seller → đang chờ duyệt
('40000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', '079200005005', 'PENDING', NULL, NULL, NULL, '2025-06-15 10:00:00', '2025-06-15 10:00:00'),

-- User Thảo đã được duyệt (nhưng chưa upgrade role trong data mẫu này)
('40000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', '079200004004', 'APPROVED', NULL, 'a0000000-0000-0000-0000-000000000001', '2025-06-01 15:00:00', '2025-05-28 14:00:00', '2025-06-01 15:00:00'),

-- User Vy bị từ chối
('40000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000006', '079200006006', 'REJECTED', 'Ảnh CCCD không rõ ràng, vui lòng gửi lại ảnh chất lượng cao hơn.', 'a0000000-0000-0000-0000-000000000002', '2025-06-05 09:00:00', '2025-06-02 11:00:00', '2025-06-05 09:00:00');


-- ============================================================
-- 10. SEARCH_HISTORY (Lịch sử tìm kiếm)
-- ============================================================
INSERT INTO search_history (user_id, query, type, data, created_at) VALUES
('c0000000-0000-0000-0000-000000000001', 'phở', 'shop', '{"shopId": "f0000000-0000-0000-0000-000000000002", "shopName": "Phở Hòa Pasteur"}', '2025-06-15 12:00:00'),
('c0000000-0000-0000-0000-000000000001', 'cà phê quận 1', 'shop', '{"shopId": "f0000000-0000-0000-0000-000000000001", "shopName": "The Coffee House - Nguyễn Huệ"}', '2025-06-15 14:30:00'),
('c0000000-0000-0000-0000-000000000002', 'trà sữa', 'shop', '{"shopId": "f0000000-0000-0000-0000-000000000003", "shopName": "Tiger Sugar Phú Mỹ Hưng"}', '2025-06-14 16:00:00'),
('c0000000-0000-0000-0000-000000000002', 'Nguyễn Văn Minh', 'user', '{"userId": "b0000000-0000-0000-0000-000000000001", "displayName": "Nguyễn Văn Minh"}', '2025-06-14 16:15:00'),
('c0000000-0000-0000-0000-000000000003', 'spa thủ đức', 'shop', '{"shopId": "f0000000-0000-0000-0000-000000000004", "shopName": "Zen Spa & Wellness"}', '2025-06-13 09:00:00'),
('c0000000-0000-0000-0000-000000000003', 'gym', 'shop', '{"shopId": "f0000000-0000-0000-0000-000000000006", "shopName": "California Fitness & Yoga"}', '2025-06-13 09:30:00'),
('d0000000-0000-0000-0000-000000000001', 'bánh ngọt', 'shop', '{"shopId": "f0000000-0000-0000-0000-000000000007", "shopName": "Paris Baguette Phan Xích Long"}', '2025-06-12 11:00:00'),
('c0000000-0000-0000-0000-000000000005', 'cắt tóc nam', 'shop', '{"shopId": "f0000000-0000-0000-0000-000000000010", "shopName": "30Shine - Cộng Hòa"}', '2025-06-11 15:00:00');


-- ============================================================
-- HOÀN TẤT! Tổng kết dữ liệu mẫu:
-- ============================================================
-- ✅ 15 Users (1 Super Admin, 1 Admin, 5 Sellers, 6 Users, 1 Premium)
-- ✅ 15 Tags (danh mục shop)
-- ✅ 10 Shops (khu vực TP.HCM, có PostGIS geography points)
-- ✅ 13 Shop-Tag mappings
-- ✅ 14 Shop images
-- ✅ 12 User-Shop relationships (owners, managers, staff)
-- ✅ 10 Menus với 27 Menu Items
-- ✅ 10 Friendships (accepted, pending, blocked)
-- ✅ 3 Seller Requests (pending, approved, rejected)
-- ✅ 8 Search History records
-- ============================================================

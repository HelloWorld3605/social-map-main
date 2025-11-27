-- Migration to create search_history table
CREATE TABLE search_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL, -- UUID as string
    query VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- user, shop, location, post, generic
    data JSON, -- JSON for additional data
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_type (type)
);


-- Migration to increase image_url column length from 255 to 1000
-- Run this SQL in your PostgreSQL database

ALTER TABLE shop_images
ALTER COLUMN image_url TYPE VARCHAR(1000);

-- Verify the change
-- SELECT column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_name = 'shop_images' AND column_name = 'image_url';


-- Migration: Add spatial indexes for shop bounding box queries with PostGIS
-- Author: GitHub Copilot
-- Date: 2025-11-06
-- Description: Optimize bounding box queries for millions of shops using PostGIS

-- =====================================================
-- ENABLE PostGIS EXTENSION
-- =====================================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================
-- ADD GEOGRAPHY COLUMN
-- =====================================================
-- Add geography column for spatial queries
ALTER TABLE shops ADD COLUMN IF NOT EXISTS location GEOGRAPHY(Point, 4326);

-- Update location from existing latitude/longitude
UPDATE shops
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE location IS NULL;

-- =====================================================
-- CREATE SPATIAL INDEX (GIST)
-- =====================================================
-- This is the MOST IMPORTANT index for spatial queries
CREATE INDEX IF NOT EXISTS idx_shops_location
ON shops USING GIST(location);

-- Also keep standard indexes for backward compatibility
CREATE INDEX IF NOT EXISTS idx_shops_status
ON shops(status);

-- =====================================================
-- AUTO-UPDATE TRIGGER
-- =====================================================
-- Automatically update location when latitude/longitude changes
CREATE OR REPLACE FUNCTION update_shop_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then recreate
DROP TRIGGER IF EXISTS trg_update_shop_location ON shops;

CREATE TRIGGER trg_update_shop_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON shops
FOR EACH ROW
EXECUTE FUNCTION update_shop_location();

-- =====================================================
-- ANALYZE for better query planning
-- =====================================================
ANALYZE shops;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check if PostGIS extension is enabled
SELECT PostGIS_Version();

-- Check if location column exists and has data
SELECT COUNT(*) as total_shops,
       COUNT(location) as shops_with_location
FROM shops;

-- Check index usage
SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    i.relname AS index_name,
    s.idx_scan,
    s.idx_tup_read,
    s.idx_tup_fetch
FROM pg_stat_user_indexes s
JOIN pg_class c ON c.oid = s.relid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_class i ON i.oid = s.indexrelid
WHERE c.relname = 'shops'
ORDER BY s.idx_scan DESC;

-- =====================================================
-- QUERY EXAMPLES (PostGIS)
-- =====================================================

-- 1. Bounding Box Query (Best Performance)
/*
SELECT id, name, latitude, longitude, status
FROM shops
WHERE location && ST_MakeEnvelope(:west, :south, :east, :north, 4326)
  AND status = 'OPEN'
LIMIT 500;
*/

-- 2. Radius Query (Find shops within X meters)
/*
SELECT id, name, latitude, longitude,
       ST_Distance(location, ST_SetSRID(ST_MakePoint(:centerLng, :centerLat), 4326)::geography) as distance_meters
FROM shops
WHERE ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(:centerLng, :centerLat), 4326)::geography,
    :radiusMeters
) AND status = 'OPEN'
ORDER BY distance_meters
LIMIT 100;
*/

-- 3. Combined Bounding Box + Status
/*
SELECT *
FROM shops
WHERE location && ST_MakeEnvelope(105.8, 21.0, 105.86, 21.03, 4326)
  AND status = 'OPEN'
  AND ST_Intersects(
    location::geometry,
    ST_MakeEnvelope(105.8, 21.0, 105.86, 21.03, 4326)
  )
LIMIT 500;
*/

-- =====================================================
-- PERFORMANCE COMPARISON
-- =====================================================
-- Test query performance
EXPLAIN ANALYZE
SELECT id, name, latitude, longitude
FROM shops
WHERE location && ST_MakeEnvelope(105.8, 21.0, 105.86, 21.03, 4326)
  AND status = 'OPEN'
LIMIT 500;

-- Should show: "Index Scan using idx_shops_location"
-- Execution time should be < 50ms even with millions of rows



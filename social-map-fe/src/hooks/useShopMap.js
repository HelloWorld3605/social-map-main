// hooks/useShopMap.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { getShopsInMapView, debounce } from '../services/shopMapService';

/**
 * Custom hook for managing shop markers on map
 * Handles bounding box queries, debouncing, and clustering
 *
 * @param {Object} map - Leaflet map instance
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 400ms)
 * @returns {Object} - { shops, loading, error, refreshShops }
 */
export const useShopMap = (map, debounceMs = 400) => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);

    /**
     * Load shops in current map view
     */
    const loadShopsInView = useCallback(async () => {
        if (!map) {
            console.warn('[useShopMap] Map instance not available');
            return;
        }

        // Cancel previous request if still pending
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        try {
            setLoading(true);
            setError(null);

            // Get current map bounds
            const bounds = map.getBounds();
            const zoom = map.getZoom();

            const boundingBox = {
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest(),
            };

            console.log(`[useShopMap] Loading shops in view (zoom: ${zoom})`, boundingBox);

            // Fetch shops/clusters
            const data = await getShopsInMapView(boundingBox, zoom);

            console.log(`[useShopMap] Loaded ${data.length} items (shops/clusters)`);
            setShops(data);

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('[useShopMap] Request aborted');
                return;
            }
            console.error('[useShopMap] Error loading shops:', err);
            setError(err.message || 'Failed to load shops');
        } finally {
            setLoading(false);
        }
    }, [map]);

    /**
     * Debounced version of loadShopsInView
     * Prevents excessive API calls when user pans/zooms rapidly
     */
    const debouncedLoadShops = useCallback(
        debounce(loadShopsInView, debounceMs),
        [loadShopsInView, debounceMs]
    );

    /**
     * Setup map event listeners
     */
    useEffect(() => {
        if (!map) return;

        // Load shops when map is ready
        loadShopsInView();

        // Listen to map move/zoom events
        const handleMoveEnd = () => {
            console.log('[useShopMap] Map moveend event');
            debouncedLoadShops();
        };

        const handleZoomEnd = () => {
            console.log('[useShopMap] Map zoomend event');
            debouncedLoadShops();
        };

        map.on('moveend', handleMoveEnd);
        map.on('zoomend', handleZoomEnd);

        // Cleanup
        return () => {
            map.off('moveend', handleMoveEnd);
            map.off('zoomend', handleZoomEnd);

            // Abort any pending requests
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [map, debouncedLoadShops, loadShopsInView]);

    /**
     * Manual refresh function
     */
    const refreshShops = useCallback(() => {
        console.log('[useShopMap] Manual refresh triggered');
        loadShopsInView();
    }, [loadShopsInView]);

    return {
        shops,          // Array of shops/clusters
        loading,        // Boolean: is loading
        error,          // Error message if any
        refreshShops,   // Function to manually refresh
    };
};

export default useShopMap;


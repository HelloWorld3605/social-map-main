import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

const MAPBOX_TOKEN = 'pk.eyJ1IjoidHVhbmhhaTM2MjAwNSIsImEiOiJjbWdicGFvbW8xMml5Mmpxd3N1NW83amQzIn0.gXamOjOWJNMeQl4eMkHnSg';

// Vietnam bounding box: [min_lng, min_lat, max_lng, max_lat]
const VIETNAM_BBOX = '102,8,110,23';

export default function SearchBar() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [userLocation, setUserLocation] = useState(null); // Store user's current location
    const [locationPermission, setLocationPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'
    const searchTimeoutRef = useRef(null);
    const dropdownRef = useRef(null);
    const tempMarkerRef = useRef(null); // Store temporary marker reference

    // Request user location on component mount
    useEffect(() => {
        // Try to get location from localStorage first (set by Sidebar)
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            try {
                const location = JSON.parse(savedLocation);
                setUserLocation(location);
                setLocationPermission('granted');
            } catch (e) {
                console.error('Error parsing saved location:', e);
                setUserLocation({ lng: 105.85, lat: 21.03 }); // Default to Hanoi
            }
        } else {
            // Fallback to Hanoi if no saved location
            setUserLocation({ lng: 105.85, lat: 21.03 });
        }

        // Listen for location updates from Sidebar
        const handleLocationUpdate = (event) => {
            if (event.detail) {
                setUserLocation(event.detail);
                setLocationPermission('granted');
            } else {
                // Location turned off
                setUserLocation({ lng: 105.85, lat: 21.03 }); // Fallback to Hanoi
                setLocationPermission('denied');
            }
        };

        window.addEventListener('locationUpdated', handleLocationUpdate);

        return () => {
            window.removeEventListener('locationUpdated', handleLocationUpdate);
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cleanup marker on component unmount
    useEffect(() => {
        return () => {
            if (tempMarkerRef.current) {
                tempMarkerRef.current.remove();
            }
        };
    }, []);

    // Search with Mapbox Geocoding API
    const searchLocation = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        setIsLoading(true);

        try {
            // Build proximity parameter based on user location
            const proximityParam = userLocation
                ? `&proximity=${userLocation.lng},${userLocation.lat}`
                : '';

            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
                `access_token=${MAPBOX_TOKEN}` +
                `&language=vi` +
                `&limit=5` +
                `&country=VN` +
                `&bbox=${VIETNAM_BBOX}` +
                `${proximityParam}` +
                `&autocomplete=true` +
                `&fuzzyMatch=true`
            );

            const data = await response.json();

            if (data.features) {
                setSearchResults(data.features);
                setShowDropdown(true);
            }
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle search input change with debounce
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set new timeout for search
        searchTimeoutRef.current = setTimeout(() => {
            searchLocation(query);
        }, 500);
    };

    // Handle location selection
    const handleLocationSelect = (location) => {
        const [lng, lat] = location.center;
        const name = location.place_name;

        // Remove previous temporary marker if exists
        if (tempMarkerRef.current) {
            tempMarkerRef.current.remove();
            tempMarkerRef.current = null;
        }

        // Focus map on selected location
        if (window.mapboxManager?.map) {
            window.mapboxManager.map.flyTo({
                center: [lng, lat],
                zoom: 15,
                duration: 1500
            });

            // Add new temporary marker
            const marker = new mapboxgl.Marker({ color: '#EC5E95' })
                .setLngLat([lng, lat])
                .setPopup(
                    new mapboxgl.Popup({ offset: 25 })
                        .setHTML(`<div style="padding: 10px;"><strong>${name}</strong></div>`)
                )
                .addTo(window.mapboxManager.map)
                .togglePopup();

            // Store marker reference
            tempMarkerRef.current = marker;
        }

        setSearchQuery(name);
        setShowDropdown(false);
    };

    // Handle search button click
    const handleSearchClick = () => {
        if (searchQuery.trim()) {
            searchLocation(searchQuery);
        }
    };

    // Handle Enter key
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            // If dropdown is showing and has results, select first result
            if (showDropdown && searchResults.length > 0) {
                handleLocationSelect(searchResults[0]);
            }
            // Otherwise, trigger search
            else if (searchQuery.trim()) {
                searchLocation(searchQuery);
            }
        }
    };

    return (
        <div className="search-wrapper" ref={dropdownRef}>
            <div className="search-container">
                <input
                    className="search-bar"
                    type="search"
                    placeholder="Bạn đang tìm kiếm gì?"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyPress={handleKeyPress}
                />

                <button className="search-button" onClick={handleSearchClick}>
                    {isLoading ? (
                        <div className="search-loading-spinner"></div>
                    ) : (
                        <img className="search-icon" src="/icons/search.svg" alt="Search" />
                    )}
                </button>
            </div>

            {/* Dropdown Results */}
            {showDropdown && searchResults.length > 0 && (
                <div className="search-dropdown">
                    {searchResults.map((result, index) => (
                        <div
                            key={result.id || index}
                            className="search-result-item"
                            onClick={() => handleLocationSelect(result)}
                        >
                            <div className="search-result-icon">📍</div>
                            <div className="search-result-content">
                                <div className="search-result-name">
                                    {result.text}
                                </div>
                                <div className="search-result-address">
                                    {result.place_name}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No Results */}
            {showDropdown && !isLoading && searchQuery && searchResults.length === 0 && (
                <div className="search-dropdown">
                    <div className="search-no-results">
                        <div className="no-results-icon">🔍</div>
                        <div className="no-results-text">Không tìm thấy kết quả</div>
                    </div>
                </div>
            )}
        </div>
    );
}

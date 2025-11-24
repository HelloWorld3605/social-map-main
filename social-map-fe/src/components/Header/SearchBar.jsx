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
    const [searchHistory, setSearchHistory] = useState([]);
    const [isShowingHistory, setIsShowingHistory] = useState(false); // Track if showing history
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
            } else {
                // Location turned off
                setUserLocation({ lng: 105.85, lat: 21.03 }); // Fallback to Hanoi
            }
        };

        window.addEventListener('locationUpdated', handleLocationUpdate);

        return () => {
            window.removeEventListener('locationUpdated', handleLocationUpdate);
        };
    }, []);

    // Load search history on component mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('searchHistory');
        if (savedHistory) {
            try {
                setSearchHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error('Error parsing search history:', e);
            }
        }
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
                setIsShowingHistory(false);
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
        setIsShowingHistory(false);

        // Add to search history, limit to 5, and save to localStorage
        const updatedHistory = [location, ...searchHistory.filter(h => h.place_name !== location.place_name)].slice(0, 5);
        setSearchHistory(updatedHistory);
        localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
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
                    onFocus={() => {
                        if (!searchQuery.trim() && searchHistory.length > 0) {
                            setSearchResults(searchHistory);
                            setShowDropdown(true);
                            setIsShowingHistory(true); // Show history
                        }
                    }}
                />

                <button className="search-button" onClick={handleSearchClick}>
                    {isLoading ? (
                        <div className="search-loading-spinner"></div>
                    ) : (
                        <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M20.87,20.17l-5.59-5.59C16.35,13.35,17,11.75,17,10c0-3.87-3.13-7-7-7s-7,3.13-7,7s3.13,7,7,7c1.75,0,3.35-0.65,4.58-1.71 l5.59,5.59L20.87,20.17z M10,16c-3.31,0-6-2.69-6-6s2.69-6,6-6s6,2.69,6,6S13.31,16,10,16z" />
                        </svg>
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
                            <div className="search-result-icon">{isShowingHistory ? '🕒' : '📍'}</div>
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

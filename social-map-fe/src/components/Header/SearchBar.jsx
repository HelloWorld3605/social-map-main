import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import { userService } from '../../services/userService';
import { searchHistoryService } from '../../services/searchHistoryService';
import { FaHistory, FaUser, FaStore, FaMapMarkerAlt, FaTrash, FaSearch, FaClock } from 'react-icons/fa';

const MAPBOX_TOKEN = 'pk.eyJ1IjoidHVhbmhhaTM2MjAwNSIsImEiOiJjbWdicGFvbW8xMml5Mmpxd3N1NW83amQzIn0.gXamOjOWJNMeQl4eMkHnSg';

// Vietnam bounding box: [min_lng, min_lat, max_lng, max_lat]
const VIETNAM_BBOX = '102,8,110,23';

// Hàm bỏ dấu tiếng Việt (chuẩn)
const removeVietnameseTone = (str) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

// Hàm tạo token mạnh / phrase / token phụ
const extractQueryParts = (query) => {
  if (!query) return { strong: "", phrase: "", tokens: [] };

  const clean = query.trim().toLowerCase();
  const tokens = clean.split(/\s+/).filter(Boolean);

  return {
    strong: tokens[0],                // từ mạnh nhất
    phrase: tokens.join(" "),         // toàn bộ cụm
    tokens                           // toàn bộ token
  };
};

// Hàm highlight PRO (Google Maps-style)
const highlightPro = (text, query) => {
  if (!query || !text) return text;

  const { strong, phrase, tokens } = extractQueryParts(query);

  const original = text;
  const normalizedText = removeVietnameseTone(text.toLowerCase());
  const normalizedStrong = removeVietnameseTone(strong.toLowerCase());
  const normalizedPhrase = removeVietnameseTone(phrase.toLowerCase());

  let result = original;

  // 1) Highlight phrase trước (ưu tiên cao)
  if (phrase.includes(" ") && normalizedText.includes(normalizedPhrase)) {
    const regex = new RegExp("(" + phrase + ")", "gi");
    result = result.replace(regex, `<mark class="hl-pro">$1</mark>`);
  }

  // 2) Highlight strong token
  if (normalizedStrong && normalizedText.includes(normalizedStrong)) {
    const strongRegex = new RegExp("(" + strong + ")", "gi");
    result = result.replace(strongRegex, `<mark class="hl-strong">$1</mark>`);
  }

  // 3) Highlight token khác (nhưng không quá yếu)
  tokens.forEach((tk, i) => {
    if (i === 0 || tk.length < 3) return; // bỏ token yếu
    if (!normalizedText.includes(removeVietnameseTone(tk))) return;

    const regex = new RegExp("(" + tk + ")", "gi");
    result = result.replace(regex, `<mark class="hl-sub">$1</mark>`);
  });

  return result;
};

export default function SearchBar() {
    const [searchQuery, setSearchQuery] = useState('');
    const [locationResults, setLocationResults] = useState([]);
    const [userResults, setUserResults] = useState([]);
    const [shopResults, setShopResults] = useState([]);
    const [combinedResults, setCombinedResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [userLocation, setUserLocation] = useState(null); // Store user's current location
    const [searchHistory, setSearchHistory] = useState([]);
    const [isShowingHistory, setIsShowingHistory] = useState(false); // Track if showing history
    const searchTimeoutRef = useRef(null);
    const dropdownRef = useRef(null);
    const tempMarkerRef = useRef(null); // Store temporary marker reference
    const navigate = useNavigate();

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
        const loadSearchHistory = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.log('No auth token, skipping load search history');
                return;
            }
            try {
                const response = await searchHistoryService.getSearchHistory();
                // Convert API response to frontend format
                const convertedHistory = response.map(item => ({
                    type: item.type,
                    data: item.type === 'query' ? { query: item.query } : JSON.parse(item.data || '{}'),
                    id: item.id  // Keep the SearchHistory id for deletion
                }));
                setSearchHistory(convertedHistory);
            } catch (error) {
                console.error('Error loading search history:', error);
            }
        };
        loadSearchHistory();
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

    // Search users
    const searchUsers = async (query) => {
        if (!query.trim()) {
            setUserResults([]);
            return;
        }

        try {
            const response = await userService.searchUsers(query, 0, 5);
            setUserResults(response.content || []);
        } catch (error) {
            console.error('User search error:', error);
            setUserResults([]);
        }
    };

    // Combine results
    useEffect(() => {
        const combined = [
            ...locationResults.map(result => ({ ...result, type: 'location' })),
            ...userResults.map(result => ({ ...result, type: 'user' })),
            ...shopResults.map(result => ({ ...result, type: 'shop' }))
        ];
        setCombinedResults(combined);
    }, [locationResults, userResults, shopResults]);

    // Perform search for both locations and users
    const performSearch = async (query) => {
        if (!query.trim()) {
            setLocationResults([]);
            setUserResults([]);
            setShopResults([]);
            setShowDropdown(false);
            return;
        }

        setIsLoading(true);

        try {
            // Search locations
            const proximityParam = userLocation
                ? `&proximity=${userLocation.lng},${userLocation.lat}`
                : '';

            const locationResponse = await fetch(
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

            let locationData;
            try {
                locationData = await locationResponse.json();
            } catch (jsonError) {
                console.error('Failed to parse location JSON:', jsonError);
                locationData = { features: [] };
            }
            setLocationResults(locationData.features || []);

            // Search users
            await searchUsers(query);

            // Search shops
            const shopResponse = await fetch(`http://localhost:8080/api/shops/search?query=${encodeURIComponent(query)}&lng=${userLocation.lng}&lat=${userLocation.lat}`);
            let shopData;
            try {
                shopData = await shopResponse.json();
            } catch (jsonError) {
                console.error('Failed to parse shop JSON:', jsonError);
                shopData = [];
            }
            setShopResults(shopData || []);

            setShowDropdown(true);
            setIsShowingHistory(false);
        } catch (error) {
            console.error('Search error:', error);
            setLocationResults([]);
            setUserResults([]);
            setShopResults([]);
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
            performSearch(query);
        }, 500);
    };

    // Handle user selection
    const handleUserSelect = (user) => {
        navigate(`/profile/${user.id}`);
        setShowDropdown(false);
        setSearchQuery(user.displayName);

        // Save to search history via API
        const saveHistory = async () => {
            try {
                await searchHistoryService.saveSearchHistory(user.displayName, 'user', JSON.stringify(user));
                // Reload history
                const response = await searchHistoryService.getSearchHistory();
                const convertedHistory = response.map(item => ({
                    type: item.type,
                    data: item.type === 'query' ? { query: item.query } : JSON.parse(item.data || '{}'),
                    id: item.id  // Keep the SearchHistory id for deletion
                }));
                setSearchHistory(convertedHistory);
            } catch (error) {
                console.error('Error saving search history:', error);
            }
        };
        saveHistory();
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

        // Save to search history via API
        const saveHistory = async () => {
            try {
                await searchHistoryService.saveSearchHistory(name, 'location', JSON.stringify(location));
                // Reload history
                const response = await searchHistoryService.getSearchHistory();
                const convertedHistory = response.map(item => ({
                    type: item.type,
                    data: item.type === 'query' ? { query: item.query } : JSON.parse(item.data || '{}'),
                    id: item.id  // Keep the SearchHistory id for deletion
                }));
                setSearchHistory(convertedHistory);
            } catch (error) {
                console.error('Error saving search history:', error);
            }
        };
        saveHistory();
    };

    // Handle shop selection
    const handleShopSelect = (shop) => {
        // Focus on existing shop marker instead of creating new one
        if (window.shopMarkersManager) {
            window.shopMarkersManager.focusShop(shop.id);
        } else {
            // Fallback: create temporary marker if shopMarkersManager not available
            if (window.mapboxManager?.map) {
                window.mapboxManager.map.flyTo({
                    center: [shop.longitude, shop.latitude],
                    zoom: 16,
                    duration: 1500
                });

                const marker = new mapboxgl.Marker({ color: '#EC5E95' })
                    .setLngLat([shop.longitude, shop.latitude])
                    .setPopup(
                        new mapboxgl.Popup({ offset: 25 })
                            .setHTML(`<div style="padding: 10px;"><strong>${shop.name}</strong><br/><span>${shop.address}</span></div>`)
                    )
                    .addTo(window.mapboxManager.map)
                    .togglePopup();

                tempMarkerRef.current = marker;
            }
        }

        setSearchQuery(shop.name);
        setShowDropdown(false);
        setIsShowingHistory(false);

        // Save to search history via API
        const saveHistory = async () => {
            try {
                console.log('Saving shop to history:', shop);
                console.log('Shop ID:', shop.id);
                console.log('Shop JSON:', JSON.stringify(shop));
                await searchHistoryService.saveSearchHistory(shop.name, 'shop', JSON.stringify(shop));
                // Reload history
                const response = await searchHistoryService.getSearchHistory();
                const convertedHistory = response.map(item => ({
                    type: item.type,
                    data: item.type === 'query' ? { query: item.query } : JSON.parse(item.data || '{}'),
                    id: item.id  // Keep the SearchHistory id for deletion
                }));
                setSearchHistory(convertedHistory);
            } catch (error) {
                console.error('Error saving search history:', error);
            }
        };
        saveHistory();
    };

    // Handle query selection from history
    const handleQuerySelect = (queryData) => {
        setSearchQuery(queryData.query);
        setShowDropdown(false);
        performSearch(queryData.query);
    };

    // Handle search button click
    const handleSearchClick = () => {
        if (searchQuery.trim()) {
            performSearch(searchQuery);
        }
    };

    // Handle Enter key
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            // If dropdown is showing and has results, select first result
            if (showDropdown && combinedResults.length > 0) {
                const firstResult = combinedResults[0];
                if (firstResult.type === 'user') {
                    handleUserSelect(firstResult);
                } else {
                    handleLocationSelect(firstResult);
                }
            }
            // Otherwise, add query to history if it's not empty
            else if (searchQuery.trim()) {
                // Save to search history via API
                const saveHistory = async () => {
                    try {
                        await searchHistoryService.saveSearchHistory(searchQuery.trim(), 'query', null);
                        // Reload history
                        const response = await searchHistoryService.getSearchHistory();
                        const convertedHistory = response.map(item => ({
                            type: item.type,
                            data: item.type === 'query' ? { query: item.query } : JSON.parse(item.data || '{}'),
                            id: item.id  // Keep the SearchHistory id for deletion
                        }));
                        setSearchHistory(convertedHistory);
                    } catch (error) {
                        console.error('Error saving search history:', error);
                    }
                };
                saveHistory();
                performSearch(searchQuery);
            }
        }
    };

    // Handle clear history
    const handleClearHistory = async () => {
        try {
            await searchHistoryService.deleteSearchHistory();
            setSearchHistory([]);
            setCombinedResults([]);
            setShowDropdown(false);
        } catch (error) {
            console.error('Error clearing search history:', error);
        }
    };

    // Handle delete history item
    const handleDeleteHistoryItem = async (id, e) => {
        e.stopPropagation(); // Prevent triggering the item click
        try {
            await searchHistoryService.deleteSearchHistoryItem(id);
            // Reload history
            const response = await searchHistoryService.getSearchHistory();
            const convertedHistory = response.map(item => ({
                type: item.type,
                data: item.type === 'query' ? { query: item.query } : JSON.parse(item.data || '{}'),
                id: item.id
            }));
            setSearchHistory(convertedHistory);
            // Update combinedResults if showing history
            if (isShowingHistory) {
                const historyResults = convertedHistory.filter(item => item && item.data).map((item) => {
                    const data = item.data;
                    return { ...data, type: item.type, id: item.id }; // Use item.id as the SearchHistory id
                });
                setCombinedResults(historyResults);
            }
        } catch (error) {
            console.error('Error deleting search history item:', error);
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
                            const historyResults = searchHistory.filter(item => item && item.data).map((item) => {
                                const data = item.data;
                                return { ...data, type: item.type, id: item.id }; // Use item.id as the SearchHistory id
                            });
                            setCombinedResults(historyResults);
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
            {showDropdown && combinedResults.length > 0 && (
                <div className="search-dropdown">
                    {combinedResults.map((result, index) => {
                        // Generate unique key - prefer SearchHistory id if available, otherwise fallback
                        const uniqueKey = result.id ||
                            (result.type === 'user' ? `user-${result.userId || index}` :
                             result.type === 'shop' ? `shop-${result.shopId || index}` :
                             result.type === 'query' ? `query-${result.query || index}` :
                             `location-${result.place_name || index}`);

                        return (
                            <div
                                key={uniqueKey}
                                className={`search-result-item type-${result.type}`}
                                onClick={() => {
                                    if (result.type === 'user') {
                                        handleUserSelect(result);
                                    } else if (result.type === 'shop') {
                                        handleShopSelect(result);
                                    } else if (result.type === 'query') {
                                        handleQuerySelect(result);
                                    } else {
                                        handleLocationSelect(result);
                                    }
                                }}
                            >
                                <div className="search-result-icon">
                                    {isShowingHistory ? (
                                        <FaClock className="result-icon-fa" style={{ color: '#64748b' }} />
                                    ) : result.type === 'user' ? (
                                        <FaUser className="result-icon-fa" style={{ color: '#BBD4E8' }} />
                                    ) : result.type === 'shop' ? (
                                        <FaStore className="result-icon-fa" style={{ color: '#C7CFA0' }} />
                                    ) : result.type === 'query' ? (
                                        <FaSearch className="result-icon-fa" style={{ color: '#64748b' }} />
                                    ) : (
                                        <FaMapMarkerAlt className="result-icon-fa" style={{ color: '#F3C6D9' }} />
                                    )}
                                </div>
                                <div className="search-result-content">
                                    <div
                                        className="search-result-name"
                                        dangerouslySetInnerHTML={{
                                            __html: highlightPro(
                                                result.type === 'user'
                                                    ? result.displayName
                                                    : result.type === 'shop'
                                                    ? result.name
                                                    : result.type === 'query'
                                                    ? result.query
                                                    : result.text,
                                                searchQuery
                                            ),
                                        }}
                                    ></div>
                                    <div
                                        className="search-result-address"
                                        dangerouslySetInnerHTML={{
                                            __html: highlightPro(
                                                result.type === 'user'
                                                    ? result.email
                                                    : result.type === 'shop'
                                                    ? result.address
                                                    : result.type === 'query'
                                                    ? 'Tìm kiếm'
                                                    : result.place_name,
                                                searchQuery
                                            ),
                                        }}
                                    ></div>
                                </div>
                                {isShowingHistory && (
                                    <div className="search-result-delete" onClick={(e) => handleDeleteHistoryItem(result.id, e)}
                                         onMouseEnter={(e) => e.currentTarget.parentElement.classList.add('no-hover')}
                                         onMouseLeave={(e) => e.currentTarget.parentElement.classList.remove('no-hover')}>
                                        <FaTrash className="delete-icon-fa" style={{ color: '#94a3b8' }} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {isShowingHistory && (
                        <div
                            style={{ textAlign: 'center', padding: '10px', borderTop: '1px solid #f0f0f0', cursor: 'pointer', color: '#666' }}
                            onClick={handleClearHistory}
                        >
                            Xóa tất cả
                        </div>
                    )}
                </div>
            )}

            {/* No Results */}
            {showDropdown && !isLoading && searchQuery && combinedResults.length === 0 && (
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

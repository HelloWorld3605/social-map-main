/**
 * Marker data constants
 * Shared across MapSection and location-sharing
 */

export const HANOI_MARKER = {
    name: 'Hà Nội',
    coordinates: [105.8542, 21.0285],
    image: '/image/hanoi.jpg',
    description: 'Thủ đô của Việt Nam, nơi giao thoa giữa lịch sử và hiện đại',
    stats: {
        population: '8.1M',
        area: '3,359 km²'
    }
};

// Popup HTML generator for consistency
export const generateMarkerPopupHTML = (marker) => {
    return `
        <div class="location-popup">
            <div class="popup-image-container">
                <img src="${marker.image}" alt="${marker.name}" class="popup-image" loading="lazy">
                <div class="popup-image-overlay">
                    <span class="popup-location-tag">${marker.name}</span>
                </div>
            </div>
            <div class="popup-content-body">
                <h3 class="popup-title">${marker.name}</h3>
                <p class="popup-description">${marker.description}</p>
                ${marker.stats ? `
                    <div class="popup-stats">
                        <div class="popup-stat">
                            <span class="stat-label">Dân số:</span>
                            <span class="stat-value">${marker.stats.population}</span>
                        </div>
                        <div class="popup-stat">
                            <span class="stat-label">Diện tích:</span>
                            <span class="stat-value">${marker.stats.area}</span>
                        </div>
                    </div>
                ` : ''}
                <button class="popup-explore-btn" onclick="window.exploreLocation('${marker.name.toLowerCase().replace(/\s+/g, '')}')">
                    🗺️ Khám phá
                </button>
            </div>
        </div>
    `;
};

// Add more markers here as needed
export const MARKERS = {
    HANOI: HANOI_MARKER,
    // Add more cities/locations here
    // SAIGON: { ... },
    // DANANG: { ... },
};

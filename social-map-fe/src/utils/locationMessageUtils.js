/**
 * Utility functions for handling location messages in chat
 * Centralizes location message parsing, formatting, and validation
 */

// Constant for location message prefix
export const LOCATION_PREFIX = 'LOCATION:';

/**
 * Check if a message content is a location message
 * @param {string|object} content - Message content to check
 * @returns {boolean} True if content is a location message
 */
export function isLocationMessage(content) {
    if (!content) return false;
    if (typeof content === 'string') {
        return content.startsWith(LOCATION_PREFIX);
    }
    // If content is already an object with location data
    return content.coordinates && Array.isArray(content.coordinates);
}

/**
 * Parse location message content from string format
 * @param {string} content - Message content with LOCATION: prefix
 * @returns {object|null} Parsed location data or null if parsing fails
 */
export function parseLocationMessage(content) {
    if (!content || typeof content !== 'string') {
        return null;
    }

    if (!content.startsWith(LOCATION_PREFIX)) {
        return null;
    }

    try {
        const locationData = JSON.parse(content.substring(LOCATION_PREFIX.length));
        return locationData;
    } catch (e) {
        console.error('Failed to parse location message:', e);
        return null;
    }
}

/**
 * Format location data to string format for sending
 * @param {object} locationData - Location data object
 * @returns {string} Formatted location message string
 */
export function formatLocationContent(locationData) {
    if (!locationData) {
        throw new Error('Location data is required');
    }
    return LOCATION_PREFIX + JSON.stringify(locationData);
}

/**
 * Process a message object to extract location data if present
 * @param {object} message - Message object
 * @returns {object} Message object with parsed location data (if applicable)
 */
export function processLocationMessage(message) {
    if (!message || !message.content) {
        return message;
    }

    // If already processed (content is object with coordinates)
    if (typeof message.content === 'object' && message.content.coordinates) {
        return { ...message, content: message.content, isLocation: true };
    }

    // If content is string with LOCATION: prefix
    if (typeof message.content === 'string' && isLocationMessage(message.content)) {
        const locationData = parseLocationMessage(message.content);
        if (locationData) {
            return {
                ...message,
                content: locationData,
                isLocation: true
            };
        }
    }

    return message;
}

/**
 * Process an array of messages to extract location data
 * @param {array} messages - Array of message objects
 * @returns {array} Array of processed message objects
 */
export function processLocationMessages(messages) {
    if (!Array.isArray(messages)) {
        return messages;
    }
    return messages.map(msg => processLocationMessage(msg));
}

/**
 * Get a display text for location message (for showing in conversation list)
 * @param {string} content - Message content with LOCATION: prefix
 * @returns {string} Display text for location message
 */
export function getLocationDisplayText(content) {
    if (!content) return 'Vị trí';

    const locationData = parseLocationMessage(content);
    if (locationData && locationData.name) {
        return `Địa điểm: ${locationData.name}`;
    }
    return 'Vị trí';
}


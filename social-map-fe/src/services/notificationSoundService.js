// src/services/notificationSoundService.js
/**
 * Notification Sound Service
 * Quản lý âm thanh thông báo tin nhắn mới
 */

class NotificationSoundService {
    constructor() {
        this.audio = null;
        this.isEnabled = true;
        this.lastPlayed = 0;
        this.minInterval = 2000; // Minimum 2 seconds between sounds
        this.hasUserInteracted = false; // Track if user has interacted with page
        this.pendingSounds = []; // Queue for sounds that couldn't play due to no interaction

        this.init();
        this.setupUserInteractionListener();
    }

    init() {
        // Create audio element
        this.audio = new Audio('/sound/notification-sound.mp3');
        this.audio.volume = 0.5; // 50% volume
        this.audio.preload = 'auto';

        // Handle audio loading errors
        this.audio.addEventListener('error', (e) => {
            console.warn('[NotificationSound] Audio loading error:', e);
        });

        // Reset audio when ended
        this.audio.addEventListener('ended', () => {
            this.audio.currentTime = 0;
        });
    }

    // Setup listener for user interaction to enable audio
    setupUserInteractionListener() {
        const enableAudio = () => {
            this.hasUserInteracted = true;
            console.log('[NotificationSound] User interaction detected, audio enabled');

            // Play any pending sounds
            if (this.pendingSounds.length > 0) {
                console.log(`[NotificationSound] Playing 1 pending sound (out of ${this.pendingSounds.length})`);
                // Only play one sound to avoid spam, clear the queue
                this.playSound();
                this.pendingSounds = [];
            }

            // Remove listeners after first interaction
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('keydown', enableAudio);
            document.removeEventListener('touchstart', enableAudio);
            document.removeEventListener('scroll', enableAudio);
        };

        // Listen for various user interactions
        document.addEventListener('click', enableAudio, { once: true });
        document.addEventListener('keydown', enableAudio, { once: true });
        document.addEventListener('touchstart', enableAudio, { once: true });
        document.addEventListener('scroll', enableAudio, { once: true });
    }

    /**
     * Play notification sound with conditions
     * @param {Object} options - Options for when to play sound
     */
    play(options = {}) {
        const {
            force = false, // Force play regardless of conditions
            checkVisibility = true, // Check if tab is visible
            checkFocus = true, // Check if window is focused
            checkMinimized = true, // Check if window is minimized
        } = options;

        // Don't play if disabled
        if (!this.isEnabled && !force) {
            return;
        }

        // Rate limiting - don't play too frequently
        const now = Date.now();
        if (now - this.lastPlayed < this.minInterval && !force) {
            return;
        }

        // If force is true, skip all condition checks
        if (force) {
            this.playSound();
            return;
        }

        // Check conditions
        let shouldPlay = true;

        if (checkVisibility && document.visibilityState === 'visible') {
            shouldPlay = false;
        }

        if (checkFocus && document.hasFocus()) {
            shouldPlay = false;
        }

        if (checkMinimized && !this.isWindowMinimized()) {
            shouldPlay = false;
        }

        // If all conditions are false (user is actively viewing), don't play
        if (!shouldPlay) {
            return;
        }

        // Play the sound
        this.playSound();
    }

    /**
     * Play sound immediately
     */
    playSound() {
        if (!this.audio) {
            console.warn('[NotificationSound] Audio not initialized');
            return;
        }

        // Check if user has interacted with the page (required for audio autoplay)
        if (!this.hasUserInteracted) {
            console.log('[NotificationSound] User has not interacted with page yet, queuing sound');
            // Add to pending sounds queue
            this.pendingSounds.push(Date.now());
            return;
        }

        try {
            // Reset to beginning in case it's already playing
            this.audio.currentTime = 0;
            this.audio.play().catch(error => {
                console.warn('[NotificationSound] Play failed:', error);
                // If autoplay fails, try to play on next user interaction
                if (error.name === 'NotAllowedError') {
                    console.log('[NotificationSound] Autoplay blocked, will try again on next interaction');
                    // Could set up a one-time listener here if needed
                }
            });
            this.lastPlayed = Date.now();
        } catch (error) {
            console.warn('[NotificationSound] Error playing sound:', error);
        }
    }

    /**
     * Check if window is minimized
     */
    isWindowMinimized() {
        // Check if window is minimized (outerHeight is very small)
        return window.outerHeight <= 100 || window.outerWidth <= 100;
    }

    /**
     * Check if chat window is open/active
     */
    isChatWindowActive() {
        // This would need to be integrated with chat component state
        // For now, assume chat is not active if document is not focused
        return document.hasFocus();
    }

    /**
     * Enable/disable notification sounds
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`[NotificationSound] Sounds ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Set volume (0.0 to 1.0)
     */
    setVolume(volume) {
        if (this.audio) {
            this.audio.volume = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * Test play sound (for debugging)
     */
    test() {
        this.play({ force: true });
    }
}

// Export singleton instance
export const notificationSoundService = new NotificationSoundService();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
    window.notificationSoundService = notificationSoundService;
}

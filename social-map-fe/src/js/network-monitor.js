// Network monitoring and offline handling
class NetworkMonitor {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.isOnline = navigator.onLine;
        this.setupEventListeners();
        this.showConnectionStatus();
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.handleConnectionChange();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.handleConnectionChange();
        });
    }

    handleConnectionChange() {
        if (this.isOnline) {
            console.log('Connection restored');
            this.hideOfflineMessage();

            // Retry loading map if it failed
            if (!this.mapManager.map && this.mapManager.retryCount < this.mapManager.maxRetries) {
                setTimeout(() => {
                    this.mapManager.retryLoad();
                }, 1000);
            }
        } else {
            console.log('Connection lost');
            this.showOfflineMessage();
        }
    }

    showConnectionStatus() {
        if (!this.isOnline) {
            this.showOfflineMessage();
        }
    }

    showOfflineMessage() {
        // Create offline indicator if it doesn't exist
        let offlineIndicator = document.getElementById('offline-indicator');
        if (!offlineIndicator) {
            offlineIndicator = document.createElement('div');
            offlineIndicator.id = 'offline-indicator';
            offlineIndicator.innerHTML = `
                <div style="
                    position: fixed;
                    top: 95px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #e74c3c;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    font-size: 14px;
                    font-weight: 500;
                    z-index: 10000;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                ">
                    📶 Không có kết nối mạng
                </div>
            `;
            document.body.appendChild(offlineIndicator);
        }
        offlineIndicator.style.display = 'block';
    }

    hideOfflineMessage() {
        const offlineIndicator = document.getElementById('offline-indicator');
        if (offlineIndicator) {
            offlineIndicator.style.display = 'none';
        }
    }
}

// Initialize network monitor when map manager is ready
window.addEventListener('DOMContentLoaded', () => {
    // Wait for mapboxManager to be created
    const initNetworkMonitor = () => {
        if (window.mapboxManager) {
            window.networkMonitor = new NetworkMonitor(window.mapboxManager);
        } else {
            setTimeout(initNetworkMonitor, 200);
        }
    };

    setTimeout(initNetworkMonitor, 300);
});
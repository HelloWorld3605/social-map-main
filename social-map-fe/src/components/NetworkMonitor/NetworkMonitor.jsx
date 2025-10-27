import React, { useEffect, useState } from 'react';
import { useNetworkMonitor } from '../../hooks/useNetworkMonitor';

export default function NetworkMonitor() {
    const isOnline = useNetworkMonitor();
    const [showOffline, setShowOffline] = useState(false);

    useEffect(() => {
        if (!isOnline) {
            setShowOffline(true);
        } else {
            // Hide after a delay when coming back online
            const timer = setTimeout(() => {
                setShowOffline(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isOnline]);

    if (!showOffline) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: '95px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: isOnline ? '#4ade80' : '#e74c3c',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '5px',
                fontSize: '14px',
                fontWeight: '500',
                zIndex: 10000,
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease'
            }}
        >
            {isOnline ? '✓ Đã kết nối lại' : '📶 Không có kết nối mạng'}
        </div>
    );
}

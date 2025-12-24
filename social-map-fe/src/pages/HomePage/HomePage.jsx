import React from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import MapSection from '../../components/Map/MapSection';
import NetworkMonitor from '../../components/NetworkMonitor/NetworkMonitor';

export default function HomePage() {
    return (
        <MainLayout isMapPage={true}>
            <MapSection />
            <NetworkMonitor />
        </MainLayout>
    );
}

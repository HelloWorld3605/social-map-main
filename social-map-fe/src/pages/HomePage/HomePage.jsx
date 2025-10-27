import React from 'react';
import { MapProvider } from '../../context/MapContext';
import MainLayout from '../../components/Layout/MainLayout';
import MapSection from '../../components/Map/MapSection';
import NetworkMonitor from '../../components/NetworkMonitor/NetworkMonitor';

export default function HomePage() {
    return (
        <MapProvider>
            <MainLayout isMapPage={true}>
                <MapSection />
                <NetworkMonitor />
            </MainLayout>
        </MapProvider>
    );
}

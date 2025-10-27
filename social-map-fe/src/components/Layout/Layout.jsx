import React from 'react';
import { MapProvider } from '../../context/MapContext';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import SideChat from '../Chat/SideChat';
import MapSection from '../Map/MapSection';
import NetworkMonitor from '../NetworkMonitor/NetworkMonitor';

export default function Layout() {
    return (
        <MapProvider>
            <Header />
            <Sidebar />
            <SideChat />
            <MapSection />
            <NetworkMonitor />
        </MapProvider>
    );
}

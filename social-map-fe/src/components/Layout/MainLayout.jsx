import React from 'react';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import SideChat from '../Chat/SideChat';
import './MainLayout.css';

export default function MainLayout({ children, isMapPage = false }) {
    return (
        <div className="main-layout">
            <Header />
            <Sidebar />
            <SideChat />

            <main className={`main-content ${isMapPage ? 'no-padding' : 'with-padding'}`}>
                {children}
            </main>
        </div>
    );
}

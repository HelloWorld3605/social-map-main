import React from 'react';
import './Header.css';
import SearchBar from './SearchBar';
import ProfileMenu from './ProfileMenu';
import { useHamburgerMenu } from '../../hooks/useHamburgerMenu';

export default function Header() {
    useHamburgerMenu();

    return (
        <header className="header">
            <div className="left-section">
                <button className="hamburger hamburger--boring" type="button">
                    <span className="hamburger-box">
                        <span className="hamburger-inner"></span>
                    </span>
                </button>
                <img className="socialmap-logo" src="/image/Social Map.svg" alt="Logo" />
            </div>

            <div className="middle-section">
                <SearchBar />
            </div>

            <div className="right-section">
                <ProfileMenu />
            </div>
        </header>
    );
}

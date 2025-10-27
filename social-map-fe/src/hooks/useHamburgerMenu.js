import { useEffect, useState } from 'react';

export function useHamburgerMenu() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const hamburger = document.querySelector('.hamburger');
        const sideMenu = document.querySelector('.side-menu');

        if (!hamburger || !sideMenu) return;

        const handleClick = () => {
            setIsMenuOpen(prev => !prev);
            hamburger.classList.toggle('is-active');
            sideMenu.classList.toggle('is-active');
        };

        hamburger.addEventListener('click', handleClick);

        return () => {
            hamburger.removeEventListener('click', handleClick);
        };
    }, []);

    return { isMenuOpen, setIsMenuOpen };
}

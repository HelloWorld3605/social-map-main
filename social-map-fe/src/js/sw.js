// Simple Service Worker for caching Mapbox resources
const CACHE_NAME = 'social-map-v1';
const MAPBOX_CACHE_NAME = 'mapbox-resources-v1';

// Resources to cache
const urlsToCache = [
    '/',
    '/styles/header.css',
    '/styles/general.css',
    '/js/hamburger-nav.js',
    '/js/side-chat.js',
    '/js/mapbox.js',
    '/js/network-monitor.js',
    'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css',
    'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Cache install failed:', error);
            })
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Handle Mapbox API requests
    if (event.request.url.includes('api.mapbox.com')) {
        event.respondWith(
            caches.open(MAPBOX_CACHE_NAME)
                .then(cache => {
                    return cache.match(event.request)
                        .then(response => {
                            if (response) {
                                // Return cached version
                                return response;
                            }

                            // Fetch from network and cache
                            return fetch(event.request)
                                .then(response => {
                                    // Only cache successful responses
                                    if (response.status === 200) {
                                        const responseToCache = response.clone();
                                        cache.put(event.request, responseToCache);
                                    }
                                    return response;
                                })
                                .catch(error => {
                                    console.error('Mapbox fetch failed:', error);
                                    throw error;
                                });
                        });
                })
        );
        return;
    }

    // Handle other requests
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version if available
                if (response) {
                    return response;
                }

                // Otherwise fetch from network
                return fetch(event.request)
                    .catch(error => {
                        console.error('Fetch failed:', error);
                        throw error;
                    });
            })
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== MAPBOX_CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
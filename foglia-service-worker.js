const CACHE_NAME = 'foglia-shell-2026-09-15-3';
// Cambiare CACHE_NAME a ogni pubblicazione per proporre l'aggiornamento agli utenti.
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './foglia-icon-192.svg', './foglia-icon-512.svg'];

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await Promise.allSettled(APP_SHELL.map(url => cache.add(new Request(url, { cache: 'reload' }))));
    })());
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames
            .filter(name => name.startsWith('foglia-shell-') && name !== CACHE_NAME)
            .map(name => caches.delete(name)));
        await self.clients.claim();
    })());
});

self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const requestUrl = new URL(request.url);
    if (requestUrl.origin !== self.location.origin) return;

    event.respondWith((async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
            const response = await fetch(request);
            if (response.ok) {
                const cache = await caches.open(CACHE_NAME);
                cache.put(request, response.clone());
            }
            return response;
        } catch (error) {
            if (request.mode === 'navigate') {
                const fallback = await caches.match('./index.html') || await caches.match('./');
                if (fallback) return fallback;
            }
            throw error;
        }
    })());
});

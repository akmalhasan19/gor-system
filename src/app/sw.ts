import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist } from "serwist";

/// <reference lib="webworker" />
/// <reference lib="esnext" />

// This declares the value of `self.__SW_MANIFEST`
declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: WorkerGlobalScope & typeof globalThis;

/**
 * Custom caching strategies for Supabase integration
 * - Storage assets: CacheFirst (images rarely change, reduce bandwidth)
 */
const supabaseStorageStrategy = new CacheFirst({
    cacheName: 'supabase-storage',
    plugins: [
        new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
    ],
});

/**
 * Offline fallback handler for navigation requests
 * Returns the offline page when network is unavailable
 */
const offlineFallbackHandler = new NetworkOnly({
    plugins: [
        {
            handlerDidError: async () => {
                // Return the offline page when network fails
                return Response.redirect('/offline', 302);
            },
        },
    ],
});

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
        ...defaultCache,
        // Cache Supabase Storage assets (images, files)
        {
            matcher: ({ url }) => url.hostname.includes('supabase.co') && url.pathname.includes('/storage/v1/object/public/'),
            handler: supabaseStorageStrategy,
        },
        // Offline fallback for navigation requests
        {
            matcher: ({ request }) => request.mode === 'navigate',
            handler: offlineFallbackHandler,
        },
    ],
    // Fallback for offline navigation
    fallbacks: {
        entries: [
            {
                url: '/offline',
                matcher: ({ request }) => request.destination === 'document',
            },
        ],
    },
});

serwist.addEventListeners();

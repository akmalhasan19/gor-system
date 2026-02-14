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

// Type assertion for service worker features
const sw = self as any;

/**
 * Security: Sensitive routes that should NEVER be cached
 * These routes handle payments, auth, and other sensitive data
 */
const SENSITIVE_ROUTES = [
    '/api/payments',
    '/api/subscriptions',
    '/api/auth',
    '/api/onboarding',
    '/api/webhooks',
    '/api/phone-verification',
    '/api/admin',
];

/**
 * NetworkOnly strategy for sensitive endpoints
 * Ensures sensitive data is always fetched fresh from network
 */
const sensitiveRoutesHandler = new NetworkOnly();

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
        // SECURITY: Never cache sensitive API endpoints (must be first!)
        {
            matcher: ({ url }) => SENSITIVE_ROUTES.some(route => url.pathname.startsWith(route)),
            handler: sensitiveRoutesHandler,
        },
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

/**
 * Background Sync for Failed Transactions
 * Automatically retries failed transactions when connectivity is restored
 */

const MAX_RETRY_COUNT = 3;

// Helper to open IndexedDB
async function openSyncDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('smash-sync-queue', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('transactions')) {
                const store = db.createObjectStore('transactions', { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('venueId', 'venueId', { unique: false });
                store.createIndex('retryCount', 'retryCount', { unique: false });
            }
        };
    });
}

// Sync pending transactions
async function syncPendingTransactions(): Promise<void> {
    console.log('[ServiceWorker] Starting background sync for transactions...');

    try {
        const db = await openSyncDB();
        const tx = db.transaction('transactions', 'readonly');
        const store = tx.objectStore('transactions');
        const transactions = await new Promise<any[]>((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        db.close();

        console.log(`[ServiceWorker] Found ${transactions.length} pending transactions`);

        for (const queuedTx of transactions) {
            try {
                // Attempt to sync transaction
                const response = await fetch('/api/transactions/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        venueId: queuedTx.venueId,
                        items: queuedTx.items,
                        paidAmount: queuedTx.paidAmount,
                        paymentMethod: queuedTx.paymentMethod,
                    }),
                });

                if (response.ok) {
                    // Success - remove from queue
                    console.log(`[ServiceWorker] Transaction ${queuedTx.id} synced successfully`);
                    const db2 = await openSyncDB();
                    const tx2 = db2.transaction('transactions', 'readwrite');
                    await new Promise<void>((resolve, reject) => {
                        const request = tx2.objectStore('transactions').delete(queuedTx.id);
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });
                    db2.close();

                    // Notify clients of successful sync
                    const clients = await sw.clients.matchAll();
                    clients.forEach((client: any) => {
                        client.postMessage({
                            type: 'SYNC_SUCCESS',
                            transactionId: queuedTx.id,
                        });
                    });
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } catch (error: any) {
                console.error(`[ServiceWorker] Failed to sync transaction ${queuedTx.id}:`, error);

                // Update retry count
                const newRetryCount = queuedTx.retryCount + 1;

                if (newRetryCount >= MAX_RETRY_COUNT) {
                    // Max retries reached - notify user
                    console.error(`[ServiceWorker] Transaction ${queuedTx.id} failed after ${MAX_RETRY_COUNT} retries`);

                    const clients = await sw.clients.matchAll();
                    clients.forEach((client: any) => {
                        client.postMessage({
                            type: 'SYNC_FAILED',
                            transactionId: queuedTx.id,
                            error: error.message,
                        });
                    });
                } else {
                    // Update retry count in DB
                    const db3 = await openSyncDB();
                    const tx3 = db3.transaction('transactions', 'readwrite');
                    const getRequest = tx3.objectStore('transactions').get(queuedTx.id);

                    await new Promise<void>((resolve, reject) => {
                        getRequest.onsuccess = () => {
                            const transaction = getRequest.result;
                            if (transaction) {
                                transaction.retryCount = newRetryCount;
                                transaction.lastError = error.message;
                                const updateRequest = tx3.objectStore('transactions').put(transaction);
                                updateRequest.onsuccess = () => resolve();
                                updateRequest.onerror = () => reject(updateRequest.error);
                            } else {
                                resolve();
                            }
                        };
                        getRequest.onerror = () => reject(getRequest.error);
                    });

                    db3.close();
                }
            }
        }

        console.log('[ServiceWorker] Background sync completed');
    } catch (error) {
        console.error('[ServiceWorker] Background sync error:', error);
        throw error;
    }
}

// Listen for sync events
self.addEventListener('sync', (event: any) => {
    console.log('[ServiceWorker] Sync event received:', event.tag);

    if (event.tag === 'sync-transactions') {
        event.waitUntil(syncPendingTransactions());
    }
});

// Listen for messages from clients (manual sync trigger)
self.addEventListener('message', (event: any) => {
    console.log('[ServiceWorker] Message received:', event.data);

    if (event.data.type === 'SYNC_NOW') {
        // Trigger manual sync
        syncPendingTransactions()
            .then(() => {
                event.ports[0]?.postMessage({ success: true });
            })
            .catch((error) => {
                event.ports[0]?.postMessage({ success: false, error: error.message });
            });
    }

    // SECURITY: Clear all caches on logout to prevent sensitive data persistence
    if (event.data.type === 'LOGOUT') {
        console.log('[ServiceWorker] Logout received - clearing all caches');
        caches.keys().then(cacheNames => {
            Promise.all(
                cacheNames.map(cacheName => {
                    console.log(`[ServiceWorker] Deleting cache: ${cacheName}`);
                    return caches.delete(cacheName);
                })
            ).then(() => {
                console.log('[ServiceWorker] All caches cleared');
                event.ports[0]?.postMessage({ success: true });
            });
        }).catch((error) => {
            console.error('[ServiceWorker] Failed to clear caches:', error);
            event.ports[0]?.postMessage({ success: false, error: error.message });
        });
    }
});


"use client";

import { useState, useEffect } from 'react';
import { getQueuedTransactions, getQueueCount, clearQueue, type QueuedTransaction } from '@/lib/sync-queue';

export function useSyncQueue() {
    const [pendingCount, setPendingCount] = useState(0);
    const [pendingTransactions, setPendingTransactions] = useState<QueuedTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load queue data
    const loadQueue = async () => {
        try {
            const [count, transactions] = await Promise.all([
                getQueueCount(),
                getQueuedTransactions()
            ]);
            setPendingCount(count);
            setPendingTransactions(transactions);
        } catch (error) {
            console.error('[useSyncQueue] Error loading queue:', error);
        }
    };

    // Initial load
    useEffect(() => {
        loadQueue();
    }, []);

    // Listen for service worker messages
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            const handleMessage = (event: MessageEvent) => {
                if (event.data.type === 'SYNC_SUCCESS' || event.data.type === 'SYNC_FAILED') {
                    // Reload queue when sync completes
                    loadQueue();
                }
            };

            navigator.serviceWorker.addEventListener('message', handleMessage);
            return () => {
                navigator.serviceWorker.removeEventListener('message', handleMessage);
            };
        }
    }, []);

    // Manual sync trigger
    const syncNow = async () => {
        setIsLoading(true);
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;

                // Try Background Sync API first
                if ('sync' in registration) {
                    await registration.sync.register('sync-transactions');
                } else {
                    // Fallback: send message to service worker for manual sync
                    const messageChannel = new MessageChannel();

                    const promise = new Promise((resolve, reject) => {
                        messageChannel.port1.onmessage = (event) => {
                            if (event.data.success) {
                                resolve(event.data);
                            } else {
                                reject(new Error(event.data.error));
                            }
                        };

                        setTimeout(() => reject(new Error('Sync timeout')), 30000);
                    });

                    // Type assertion to access active property
                    const sw = registration as any;
                    sw.active?.postMessage(
                        { type: 'SYNC_NOW' },
                        [messageChannel.port2]
                    );

                    await promise;
                }

                // Reload queue after sync
                await loadQueue();
            }
        } catch (error) {
            console.error('[useSyncQueue] Manual sync failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Clear all queued transactions
    const clearAllQueue = async () => {
        try {
            await clearQueue();
            await loadQueue();
        } catch (error) {
            console.error('[useSyncQueue] Error clearing queue:', error);
            throw error;
        }
    };

    return {
        pendingCount,
        pendingTransactions,
        isLoading,
        syncNow,
        clearQueue: clearAllQueue,
        refreshQueue: loadQueue,
    };
}

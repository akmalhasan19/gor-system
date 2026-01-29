import { CartItem } from './constants';

/**
 * Queued transaction structure for IndexedDB storage
 */
export interface QueuedTransaction {
    id: string;                    // UUID
    venueId: string;
    items: CartItem[];
    paidAmount: number;
    paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER';
    timestamp: number;             // When it was queued
    retryCount: number;            // Number of retry attempts
    lastError?: string;            // Last error message
}

const DB_NAME = 'smash-sync-queue';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';

/**
 * Initialize IndexedDB database
 */
export async function initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

                // Create indexes for efficient querying
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                objectStore.createIndex('venueId', 'venueId', { unique: false });
                objectStore.createIndex('retryCount', 'retryCount', { unique: false });
            }
        };
    });
}

/**
 * Add a failed transaction to the queue
 */
export async function addToQueue(transaction: QueuedTransaction): Promise<void> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.add(transaction);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            console.log('[SyncQueue] Transaction added to queue:', transaction.id);
            resolve();
        };

        tx.oncomplete = () => db.close();
    });
}

/**
 * Get all queued transactions
 */
export async function getQueuedTransactions(): Promise<QueuedTransaction[]> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const transactions = request.result as QueuedTransaction[];
            console.log('[SyncQueue] Retrieved queued transactions:', transactions.length);
            resolve(transactions);
        };

        tx.oncomplete = () => db.close();
    });
}

/**
 * Remove a transaction from the queue (after successful sync)
 */
export async function removeFromQueue(id: string): Promise<void> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            console.log('[SyncQueue] Transaction removed from queue:', id);
            resolve();
        };

        tx.oncomplete = () => db.close();
    });
}

/**
 * Update a transaction's retry count and error
 */
export async function updateRetryCount(id: string, retryCount: number, lastError?: string): Promise<void> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const transaction = getRequest.result as QueuedTransaction;
            if (transaction) {
                transaction.retryCount = retryCount;
                if (lastError) {
                    transaction.lastError = lastError;
                }

                const updateRequest = store.put(transaction);
                updateRequest.onerror = () => reject(updateRequest.error);
                updateRequest.onsuccess = () => {
                    console.log('[SyncQueue] Transaction retry count updated:', id, retryCount);
                    resolve();
                };
            } else {
                reject(new Error('Transaction not found'));
            }
        };

        getRequest.onerror = () => reject(getRequest.error);
        tx.oncomplete = () => db.close();
    });
}

/**
 * Get count of pending transactions
 */
export async function getQueueCount(): Promise<number> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.count();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        tx.oncomplete = () => db.close();
    });
}

/**
 * Clear all queued transactions (for testing/debugging)
 */
export async function clearQueue(): Promise<void> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            console.log('[SyncQueue] Queue cleared');
            resolve();
        };

        tx.oncomplete = () => db.close();
    });
}

/**
 * Check if Background Sync is supported
 */
export function isBackgroundSyncSupported(): boolean {
    return 'serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype;
}

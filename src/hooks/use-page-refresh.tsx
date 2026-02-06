'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { useVenue } from '@/lib/venue-context';

type PageType = 'dashboard' | 'scheduler' | 'pos' | 'members' | 'reports' | 'shift';

// Track last sync times globally across all hook instances
const lastSyncTimes: Record<string, number> = {};

// Cooldown period in milliseconds (10 seconds)
const COOLDOWN_MS = 10000;

/**
 * Custom hook to intelligently refresh data when navigating to a page
 * Uses focus detection and debouncing to avoid excessive API calls
 * 
 * @param pageType - Type of page (dashboard, scheduler, pos, etc.)
 */
export function usePageRefresh(pageType: PageType) {
    const { currentVenueId } = useVenue();
    const {
        syncBookings,
        syncProducts,
        syncCustomers,
        syncTransactions,
        selectedDate
    } = useAppStore();

    const hasMountedRef = useRef(false);

    useEffect(() => {
        // Skip on initial mount (DataSyncProvider handles that)
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }

        if (!currentVenueId) return;

        // Check cooldown - don't refetch if we just did
        const syncKey = `${pageType}-${currentVenueId}`;
        const now = Date.now();
        const lastSync = lastSyncTimes[syncKey] || 0;

        if (now - lastSync < COOLDOWN_MS) {
            // Too soon, skip refresh
            return;
        }

        // Update last sync time
        lastSyncTimes[syncKey] = now;

        // Selective refresh based on page type
        const refreshData = async () => {
            try {
                switch (pageType) {
                    case 'dashboard':
                        // Dashboard needs: bookings (for count), transactions (for revenue), products (for low stock)
                        await Promise.all([
                            syncBookings(currentVenueId, selectedDate),
                            syncTransactions(currentVenueId),
                            syncProducts(currentVenueId),
                        ]);
                        break;

                    case 'scheduler':
                        // Scheduler needs: bookings (main data)
                        await syncBookings(currentVenueId, selectedDate);
                        break;

                    case 'pos':
                        // POS needs: products (for selling), transactions (for pending)
                        await Promise.all([
                            syncProducts(currentVenueId),
                            syncTransactions(currentVenueId),
                        ]);
                        break;

                    case 'members':
                        // Members page needs: customers
                        await syncCustomers(currentVenueId);
                        break;

                    case 'reports':
                        // Reports need: transactions (main data)
                        await syncTransactions(currentVenueId);
                        break;

                    case 'shift':
                        // Shift/Kasir needs: transactions
                        await syncTransactions(currentVenueId);
                        break;
                }
            } catch (error) {
                console.error(`Failed to refresh data for ${pageType}:`, error);
                // Silently fail - user still has cached data
            }
        };

        refreshData();
    }, [pageType, currentVenueId, syncBookings, syncProducts, syncCustomers, syncTransactions, selectedDate]);
}

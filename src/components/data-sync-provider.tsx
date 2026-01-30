"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useVenue } from "@/lib/venue-context";

export const DataSyncProvider = ({ children }: { children: React.ReactNode }) => {
    const { syncBookings, syncProducts, syncCustomers, syncTransactions, syncCourts, selectedDate } = useAppStore();
    const { currentVenueId } = useVenue();

    useEffect(() => {
        if (!currentVenueId) return;

        // Sync all data from Supabase on mount and when date changes
        const syncData = async () => {
            // Only sync bookings when date changes, to avoid re-fetching everything
            await syncBookings(currentVenueId, selectedDate);
        };

        syncData();
    }, [syncBookings, currentVenueId, selectedDate]);

    // Separate effect for static data (products, customers, etc) that doesn't change with date
    useEffect(() => {
        if (!currentVenueId) return;

        const syncStaticData = async () => {
            await Promise.all([
                syncProducts(currentVenueId),
                syncCustomers(currentVenueId),
                syncTransactions(currentVenueId),
                syncCourts(currentVenueId),
            ]);
        };

        syncStaticData();
    }, [syncProducts, syncCustomers, syncTransactions, syncCourts, currentVenueId]);

    return <>{children}</>;
};

"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useVenue } from "@/lib/venue-context";

export const DataSyncProvider = ({ children }: { children: React.ReactNode }) => {
    const { syncBookings, syncProducts, syncCustomers, syncTransactions, syncCourts } = useAppStore();
    const { currentVenueId } = useVenue();

    useEffect(() => {
        if (!currentVenueId) return;

        // Sync all data from Supabase on mount
        const syncData = async () => {
            await Promise.all([
                syncBookings(currentVenueId),
                syncProducts(currentVenueId),
                syncCustomers(currentVenueId),
                syncTransactions(currentVenueId),
                syncCourts(currentVenueId),
            ]);
        };

        syncData();
    }, [syncBookings, syncProducts, syncCustomers, syncTransactions, syncCourts, currentVenueId]);

    return <>{children}</>;
};

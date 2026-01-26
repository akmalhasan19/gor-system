"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export const DataSyncProvider = ({ children }: { children: React.ReactNode }) => {
    const { syncBookings, syncProducts, syncCustomers, syncTransactions } = useAppStore();

    useEffect(() => {
        // Sync all data from Supabase on mount
        const syncData = async () => {
            await Promise.all([
                syncBookings(),
                syncProducts(),
                syncCustomers(),
                syncTransactions(),
            ]);
        };

        syncData();
    }, [syncBookings, syncProducts, syncCustomers, syncTransactions]);

    return <>{children}</>;
};

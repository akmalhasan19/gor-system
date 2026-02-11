'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { MobileNav } from '@/components/mobile-nav';
import { AuthGuard } from '@/components/auth-guard';
import { FloatingCart } from '@/components/floating-cart';
import { Receipt } from '@/components/pos/receipt';
import { useAppStore } from '@/lib/store';
import { DataSyncProvider } from '@/components/data-sync-provider';
import { AutoCancelTrigger } from '@/components/auto-cancel-trigger';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    // Need access to transactions for the global Receipt component (hidden print)
    const { transactions } = useAppStore();
    const latestTransaction = transactions.length > 0 ? transactions[0] : null;

    return (
        <AuthGuard>
            <DataSyncProvider>
                <AutoCancelTrigger />
                <div className="min-h-screen bg-white flex flex-col lg:flex-row">
                    {/* Sidebar for Desktop */}
                    <Sidebar />

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 relative">
                        {/* Hidden Receipt Component for Printing */}
                        <Receipt transaction={latestTransaction} />

                        {/* Mobile Navigation Top */}
                        <MobileNav />

                        {/* Page Content */}
                        <main className="flex-1 overflow-y-auto flex flex-col pb-20 md:pb-0">
                            {children}
                        </main>

                        {/* Global Floating Cart (Visible on non-POS pages) */}
                        <FloatingCart />


                        {/* Mobile Bottom Navigation */}
                        <MobileBottomNav />
                    </div>

                    {/* AI Assistant temporarily disabled until API quota is available */}
                </div>
            </DataSyncProvider>
        </AuthGuard>
    );
}

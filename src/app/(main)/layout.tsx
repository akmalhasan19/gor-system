'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { AuthGuard } from '@/components/auth-guard';
import { FloatingCart } from '@/components/floating-cart';
import { Receipt } from '@/components/pos/receipt';
import { useAppStore } from '@/lib/store';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    // Need access to transactions for the global Receipt component (hidden print)
    const { transactions } = useAppStore();
    const latestTransaction = transactions.length > 0 ? transactions[0] : null;

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
                {/* Sidebar for Desktop */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 relative">
                    {/* Hidden Receipt Component for Printing */}
                    <Receipt transaction={latestTransaction} />

                    {/* Mobile Navigation */}
                    <MobileNav />

                    {/* Page Content */}
                    <main className="flex-1 overflow-hidden flex flex-col">
                        {children}
                    </main>

                    {/* Global Floating Cart (Visible on non-POS pages) */}
                    <FloatingCart />
                </div>
            </div>
        </AuthGuard>
    );
}

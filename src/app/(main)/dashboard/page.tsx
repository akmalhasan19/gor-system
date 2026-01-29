'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Lazy load DashboardView dengan loading indicator
const DashboardView = dynamic(
    () => import('@/components/dashboard/dashboard-view').then(mod => ({ default: mod.DashboardView })),
    {
        loading: () => (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-black border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-2 font-bold text-sm">Loading Dashboard...</p>
                </div>
            </div>
        ),
        ssr: false
    }
);

export default function DashboardPage() {
    return (
        <div className="flex-1 p-4 overflow-y-auto">
            <h1 className="text-2xl font-display font-black uppercase italic mb-4">Dashboard</h1>
            <DashboardView />
        </div>
    );
}

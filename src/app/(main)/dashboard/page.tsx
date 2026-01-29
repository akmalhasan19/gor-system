'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Settings } from 'lucide-react';

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
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-display font-black uppercase italic">Dashboard</h1>
                <Link href="/settings" className="p-2 border-2 border-black bg-white rounded-lg shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                    <Settings size={20} />
                </Link>
            </div>
            <DashboardView />
        </div>
    );
}

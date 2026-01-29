'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Lazy load ReportsView (likely contains heavy charting library)
const ReportsView = dynamic(
    () => import('@/components/dashboard/reports-view').then(mod => ({ default: mod.ReportsView })),
    {
        loading: () => (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-black border-r-transparent"></div>
                    <p className="mt-2 font-bold text-sm">Loading Reports...</p>
                </div>
            </div>
        ),
        ssr: false
    }
);

export default function ReportsPage() {
    return <ReportsView />;
}

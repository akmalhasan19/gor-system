'use client';

import React from 'react';
import { ShiftManager } from "@/components/financial/shift-manager";
import { usePageRefresh } from '@/hooks/use-page-refresh';

export default function ShiftPage() {
    // Auto-refresh transactions when navigating to this page
    usePageRefresh('shift');
    return (
        <div className="flex-1 p-4 overflow-y-auto bg-grid-brown">
            <h1 className="text-2xl font-display font-black uppercase italic mb-4">Shift & Kasir</h1>
            <ShiftManager />
        </div>
    );
}

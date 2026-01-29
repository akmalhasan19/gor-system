'use client';

import React from 'react';
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default function DashboardPage() {
    return (
        <div className="flex-1 p-4 overflow-y-auto">
            <h1 className="text-2xl font-display font-black uppercase italic mb-4">Dashboard</h1>
            <DashboardView />
        </div>
    );
}

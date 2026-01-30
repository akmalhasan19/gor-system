'use client';

import React from 'react';
import { ShiftManager } from "@/components/financial/shift-manager";

export default function ShiftPage() {
    return (
        <div className="flex-1 p-4 overflow-y-auto bg-grid-brown">
            <h1 className="text-2xl font-display font-black uppercase italic mb-4">Shift & Kasir</h1>
            <ShiftManager />
        </div>
    );
}

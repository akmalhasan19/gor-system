"use client";

import { useSyncQueue } from '@/hooks/use-sync-queue';
import { CloudOff } from 'lucide-react';

interface PendingTransactionsBadgeProps {
    onClick: () => void;
}

export function PendingTransactionsBadge({ onClick }: PendingTransactionsBadgeProps) {
    const { pendingCount } = useSyncQueue();

    if (pendingCount === 0) return null;

    return (
        <button
            onClick={onClick}
            className="relative flex items-center gap-2 bg-brand-orange text-white px-3 py-2 border-2 border-black shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-xs uppercase animate-pulse"
            title={`${pendingCount} transaksi menunggu sinkronisasi`}
        >
            <CloudOff size={16} />
            <span>{pendingCount} Pending</span>
        </button>
    );
}

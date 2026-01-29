"use client";

import { useState } from 'react';
import { useSyncQueue } from '@/hooks/use-sync-queue';
import { X, RefreshCcw, Trash2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PendingTransactionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PendingTransactionsModal({ isOpen, onClose }: PendingTransactionsModalProps) {
    const { pendingTransactions, isLoading, syncNow, clearQueue } = useSyncQueue();
    const [isSyncing, setIsSyncing] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    if (!isOpen) return null;

    const handleSyncNow = async () => {
        setIsSyncing(true);
        try {
            await syncNow();
            toast.success('Sinkronisasi dimulai!');
        } catch (error: any) {
            toast.error(`Gagal sinkronisasi: ${error.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleClearAll = async () => {
        if (!confirm('Yakin ingin menghapus semua transaksi pending? Data akan hilang permanen!')) {
            return;
        }

        setIsClearing(true);
        try {
            await clearQueue();
            toast.success('Semua transaksi pending dihapus');
            onClose();
        } catch (error: any) {
            toast.error(`Gagal menghapus: ${error.message}`);
        } finally {
            setIsClearing(false);
        }
    };

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-4 border-black bg-brand-orange">
                    <h2 className="text-xl font-black uppercase">Transaksi Pending</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black hover:text-white transition-colors border-2 border-black"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {pendingTransactions.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 font-bold">Tidak ada transaksi pending</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingTransactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="bg-gray-50 border-2 border-black p-4 shadow-neo-sm"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-black text-lg">
                                                {formatCurrency(tx.paidAmount)}
                                            </p>
                                            <p className="text-xs text-gray-600 font-bold uppercase">
                                                {tx.paymentMethod}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-xs text-gray-600">
                                                <Clock size={12} />
                                                {formatTimestamp(tx.timestamp)}
                                            </div>
                                            {tx.retryCount > 0 && (
                                                <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                                                    <AlertCircle size={12} />
                                                    Retry: {tx.retryCount}/3
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="mt-2 pt-2 border-t border-gray-300">
                                        <p className="text-xs font-bold text-gray-500 mb-1">ITEMS:</p>
                                        <div className="space-y-1">
                                            {tx.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-xs">
                                                    <span>{item.name} x{item.quantity}</span>
                                                    <span className="font-bold">
                                                        {formatCurrency(item.price * item.quantity)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Error */}
                                    {tx.lastError && (
                                        <div className="mt-2 pt-2 border-t border-red-300 bg-red-50 p-2">
                                            <p className="text-xs text-red-600 font-bold">
                                                Error: {tx.lastError}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t-4 border-black bg-gray-100 flex gap-2">
                    <button
                        onClick={handleSyncNow}
                        disabled={isSyncing || isLoading || pendingTransactions.length === 0}
                        className="flex-1 flex items-center justify-center gap-2 bg-brand-lime text-black px-4 py-3 border-2 border-black font-black uppercase hover:shadow-none shadow-neo transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCcw size={18} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                        onClick={handleClearAll}
                        disabled={isClearing || pendingTransactions.length === 0}
                        className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-3 border-2 border-black font-black uppercase hover:shadow-none shadow-neo transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 size={18} />
                        {isClearing ? 'Clearing...' : 'Clear All'}
                    </button>
                </div>
            </div>
        </div>
    );
}

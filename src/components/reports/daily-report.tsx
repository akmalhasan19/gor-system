"use client";

import React, { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { exportTransactionsToCSV } from "@/lib/utils/csv-export";
import { toast } from "sonner";
import { Download, Calendar } from "lucide-react";

export const DailyReport = () => {
    const { transactions } = useAppStore();

    // Date range filter state
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [useRangeFilter, setUseRangeFilter] = useState(false);

    // Filter transactions by date range and deduplicate
    const filteredTransactions = useMemo(() => {
        let result = transactions;

        // Get today's date in YYYY-MM-DD format (local timezone)
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        if (useRangeFilter && startDate && endDate) {
            // User-specified date range filter
            result = transactions.filter(t => {
                const txDate = new Date(t.date);
                const txDateStr = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}-${String(txDate.getDate()).padStart(2, '0')}`;
                return txDateStr >= startDate && txDateStr <= endDate;
            });
        } else {
            // Default: filter to today's transactions only
            result = transactions.filter(t => {
                const txDate = new Date(t.date);
                const txDateStr = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}-${String(txDate.getDate()).padStart(2, '0')}`;
                return txDateStr === todayStr;
            });
        }

        // Deduplicate by ID to prevent "duplicate key" errors from potential race conditions in store
        const uniqueMap = new Map();
        result.forEach(item => {
            uniqueMap.set(item.id, item);
        });
        return Array.from(uniqueMap.values());
    }, [transactions, useRangeFilter, startDate, endDate]);

    const handleExportCSV = () => {
        if (filteredTransactions.length === 0) {
            toast.warning('Belum ada transaksi untuk di-export.');
            return;
        }

        try {
            let filename: string;
            if (useRangeFilter && startDate && endDate) {
                filename = `Transaksi_${startDate}_${endDate}.csv`;
            } else {
                const today = new Date().toISOString().split('T')[0];
                filename = `Transaksi_${today}.csv`;
            }

            exportTransactionsToCSV(filteredTransactions, filename);
            toast.success(`Berhasil export ${filteredTransactions.length} transaksi!`);
        } catch (error) {
            console.error('Export CSV error:', error);
            toast.error('Gagal export CSV. Silakan coba lagi.');
        }
    };

    const handleApplyRangeFilter = () => {
        if (startDate && endDate) {
            if (new Date(endDate) < new Date(startDate)) {
                toast.error('Tanggal akhir harus setelah tanggal mulai.');
                return;
            }
            setUseRangeFilter(true);
        } else {
            toast.warning('Harap isi tanggal mulai dan tanggal akhir.');
        }
    };

    const handleClearFilter = () => {
        setStartDate('');
        setEndDate('');
        setUseRangeFilter(false);
    };

    // Calculate Summary
    const totalTransactions = filteredTransactions.length;
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const cashTotal = filteredTransactions.filter(t => t.paymentMethod === 'CASH').reduce((sum, t) => sum + Math.min(t.paidAmount, t.totalAmount), 0);
    const qrisTotal = filteredTransactions.filter(t => t.paymentMethod === 'QRIS').reduce((sum, t) => sum + t.paidAmount, 0);
    const transferTotal = filteredTransactions.filter(t => t.paymentMethod === 'TRANSFER').reduce((sum, t) => sum + t.paidAmount, 0);

    return (
        <div className="flex flex-col gap-4 p-2 max-w-3xl mx-auto">
            {/* Date Range Filter */}
            <div className="bg-gray-50 p-3 border-2 border-black">
                <div className="text-[10px] font-bold uppercase text-gray-500 mb-2 flex items-center gap-1">
                    <Calendar size={12} />
                    Filter Rentang Tanggal (Export)
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="text-xs px-2 py-1.5 border-2 border-black font-medium bg-white"
                    />
                    <span className="text-xs font-bold">s/d</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="text-xs px-2 py-1.5 border-2 border-black font-medium bg-white"
                    />
                    <button
                        onClick={handleApplyRangeFilter}
                        className="text-xs bg-black text-white px-3 py-1.5 font-bold uppercase hover:bg-gray-800 transition-all"
                    >
                        Terapkan
                    </button>
                    {useRangeFilter && (
                        <button
                            onClick={handleClearFilter}
                            className="text-xs bg-gray-200 text-black px-3 py-1.5 font-bold uppercase hover:bg-gray-300 transition-all border border-gray-400"
                        >
                            Reset
                        </button>
                    )}
                </div>
                {useRangeFilter && (
                    <div className="mt-2 text-[10px] font-bold text-green-600">
                        ✓ Filter aktif: {startDate} s/d {endDate} ({filteredTransactions.length} transaksi)
                    </div>
                )}
            </div>

            {/* Header / Summary Cards */}
            <div className="flex flex-col gap-2">
                <div className="bg-black text-white p-2 border-2 border-black shadow-neo-sm">
                    <div className="text-xs font-bold opacity-80 uppercase">Total Revenue</div>
                    <div className="text-xl font-black text-brand-lime">Rp {totalRevenue.toLocaleString()}</div>
                </div>
                <div className="bg-white p-2 border-2 border-black shadow-neo-sm">
                    <div className="text-xs font-bold opacity-80 uppercase">Cash In Hand</div>
                    <div className="text-lg font-black">Rp {cashTotal.toLocaleString()}</div>
                </div>
                <div className="bg-white p-2 border-2 border-black shadow-neo-sm">
                    <div className="text-xs font-bold opacity-80 uppercase">QRIS / Digital</div>
                    <div className="text-lg font-black">Rp {qrisTotal.toLocaleString()}</div>
                </div>
                <div className="bg-white p-2 border-2 border-black shadow-neo-sm">
                    <div className="text-xs font-bold opacity-80 uppercase">Total Transaksi</div>
                    <div className="text-lg font-black">{totalTransactions} Orders</div>
                </div>
            </div>

            {/* Transaction List */}
            <div className="border-2 border-black bg-white shadow-neo-sm">
                <div className="bg-gray-100 p-2 border-b-2 border-black font-black uppercase text-xs flex justify-between">
                    <span>
                        {useRangeFilter
                            ? `Riwayat Transaksi (${startDate} - ${endDate})`
                            : 'Riwayat Transaksi Hari Ini'}
                    </span>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-1 text-[10px] bg-black text-white px-2 py-1 rounded hover:opacity-80 transition-all active:scale-95"
                    >
                        <Download size={12} />
                        Export CSV
                    </button>
                </div>

                <div className="max-h-[400px] overflow-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-[10px] text-gray-700 uppercase bg-white sticky top-0 border-b border-black">
                            <tr>
                                <th className="px-2 py-2 bg-gray-50">ID</th>
                                <th className="px-2 py-2 bg-gray-50">Waktu</th>
                                <th className="px-2 py-2 bg-gray-50">Items</th>
                                <th className="px-2 py-2 bg-gray-50">Metode</th>
                                <th className="px-2 py-2 bg-gray-50 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-6 text-gray-400 italic font-bold">
                                        {useRangeFilter
                                            ? 'Tidak ada transaksi dalam rentang tanggal ini.'
                                            : 'Belum ada transaksi hari ini.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((trx, index) => (
                                    <tr key={`${trx.id}-${index}`} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-2 py-2 font-mono font-bold text-[10px]">{trx.id.split('-')[1]}</td>
                                        <td className="px-2 py-2">
                                            {new Date(trx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex flex-col gap-0.5">
                                                {trx.items.map((item: any, idx: number) => (
                                                    <span key={idx} className="text-[10px]">
                                                        {item.quantity}x {item.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 border border-black ${trx.paymentMethod === 'CASH' ? 'bg-green-100' :
                                                trx.paymentMethod === 'QRIS' ? 'bg-blue-100' : 'bg-yellow-100'
                                                }`}>
                                                {trx.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="px-2 py-2 font-black text-right">
                                            Rp {trx.totalAmount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

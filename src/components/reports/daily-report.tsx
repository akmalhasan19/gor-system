"use client";

import React from "react";
import { useAppStore } from "@/lib/store";
import { NeoBadge } from "@/components/ui/neo-badge";

export const DailyReport = () => {
    const { transactions } = useAppStore();

    // Calculate Summary
    const totalTransactions = transactions.length;
    const totalRevenue = transactions.reduce((sum, t) => sum + t.paidAmount, 0);
    const cashTotal = transactions.filter(t => t.paymentMethod === 'CASH').reduce((sum, t) => sum + t.paidAmount, 0);
    const qrisTotal = transactions.filter(t => t.paymentMethod === 'QRIS').reduce((sum, t) => sum + t.paidAmount, 0);
    const transferTotal = transactions.filter(t => t.paymentMethod === 'TRANSFER').reduce((sum, t) => sum + t.paidAmount, 0);

    return (
        <div className="flex flex-col gap-4 p-2 max-w-3xl mx-auto">
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
                    <span>Riwayat Transaksi Hari Ini</span>
                    <button className="text-[10px] bg-black text-white px-2 py-1 rounded hover:opacity-80">
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
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-6 text-gray-400 italic font-bold">
                                        Belum ada transaksi hari ini.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((trx) => (
                                    <tr key={trx.id} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-2 py-2 font-mono font-bold text-[10px]">{trx.id.split('-')[1]}</td>
                                        <td className="px-2 py-2">
                                            {new Date(trx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex flex-col gap-0.5">
                                                {trx.items.map((item, idx) => (
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

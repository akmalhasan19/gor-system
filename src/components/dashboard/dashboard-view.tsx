"use client";

import React from "react";
import { useAppStore } from "@/lib/store";
import {
    TrendingUp,
    Users,
    CalendarCheck,
    AlertCircle
} from "lucide-react";


export const DashboardView = () => {
    const { bookings, products, transactions, selectedDate } = useAppStore();

    // Stats
    const todayBookings = bookings.length;
    const lowStockItems = products.filter(p => p.stock < 10);

    // Filter transactions for the selected date (or today)
    const activeDate = selectedDate || new Date().toLocaleDateString('en-CA');
    const todayTransactions = transactions.filter(t => {
        const tDate = new Date(t.date).toLocaleDateString('en-CA');
        return tDate === activeDate;
    });

    const totalRevenue = todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

    return (
        <div className="flex flex-col gap-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4">
                <div className="bg-white border-2 border-black p-4 shadow-neo flex items-center justify-between">
                    <div>
                        <div className="text-sm font-bold text-gray-500 uppercase">Total Booking</div>
                        <div className="text-3xl font-black">{todayBookings}</div>
                    </div>
                    <div className="bg-brand-lime p-3 border-2 border-black rounded-full">
                        <CalendarCheck size={24} />
                    </div>
                </div>

                <div className="bg-white border-2 border-black p-4 shadow-neo flex items-center justify-between">
                    <div>
                        <div className="text-sm font-bold text-gray-500 uppercase">Pendapatan Hari Ini</div>
                        <div className="text-3xl font-black">Rp {totalRevenue.toLocaleString()}</div>
                    </div>
                    <div className="bg-brand-green text-white p-3 border-2 border-black rounded-full">
                        <TrendingUp size={24} />
                    </div>
                </div>

                <div className="bg-white border-2 border-black p-4 shadow-neo flex items-center justify-between">
                    <div>
                        <div className="text-sm font-bold text-gray-500 uppercase">Stok Menipis</div>
                        <div className="text-3xl font-black text-red-500">{lowStockItems.length}</div>
                    </div>
                    <div className="bg-red-100 text-red-500 p-3 border-2 border-black rounded-full">
                        <AlertCircle size={24} />
                    </div>
                </div>
            </div>

            {/* Recent Activity or Welcome Message */}
            <div className="bg-brand-lilac/20 border-2 border-black p-6 rounded-lg text-center">
                <h2 className="text-2xl font-black italic uppercase mb-2">Selamat Datang di Smash Partner!</h2>
                <p className="font-bold text-gray-600 block lg:hidden">
                    Pilih menu di pojok kanan atas untuk navigasi ke Jadwal, POS, atau Laporan.
                </p>
                <p className="font-bold text-gray-600 hidden lg:block">
                    Pilih menu di samping kiri untuk navigasi ke Jadwal, POS, atau Laporan.
                </p>
            </div>
        </div>
    );
};

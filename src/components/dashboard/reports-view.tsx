'use client';

import { useAppStore } from "@/lib/store";
import { useVenue } from "@/lib/venue-context";
import { useMemo, useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { id } from "date-fns/locale";
import { getBookingsRange } from "@/lib/api/bookings";
import { getTransactionsRange } from "@/lib/api/transactions";
import { Booking, Transaction } from "@/lib/constants";
import { FileText, TrendingUp, BarChart3, LayoutGrid } from "lucide-react";
import { DailyReport } from "@/components/reports/daily-report";
import { BookingHistoryExport } from "@/components/reports/booking-history-export";

// Analytics Components
import { RevenueChart } from "@/components/analytics/revenue-chart";
import { OccupancyHeatmap } from "@/components/analytics/occupancy-heatmap";
import { CourtRevenueChart } from "@/components/analytics/court-revenue-chart";
import { MemberRatioChart } from "@/components/analytics/member-ratio-chart";
import { TopCustomersTable } from "@/components/analytics/top-customers-table";

type TabType = 'ringkasan' | 'analytics' | 'export';

export function ReportsView() {
    const { currentVenueId, currentVenue } = useVenue();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('ringkasan');
    const [analyticsDays, setAnalyticsDays] = useState<7 | 30 | 90>(30);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch last 30 days data for reports
    useEffect(() => {
        async function fetchData() {
            if (!currentVenueId) return;

            try {
                const today = new Date();
                const startDate = format(subDays(today, 30), 'yyyy-MM-dd');
                const endDate = format(today, 'yyyy-MM-dd');
                const data = await getBookingsRange(currentVenueId, startDate, endDate);
                const txData = await getTransactionsRange(currentVenueId, startDate, endDate);

                setBookings(data);
                setTransactions(txData);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [currentVenueId]);

    // 1. Calculate Revenue per Day (Last 7 Days)
    const revenueData = useMemo(() => {
        const today = new Date();
        const last7Days = eachDayOfInterval({
            start: subDays(today, 6),
            end: today,
        });

        return last7Days.map((date) => {
            const dateStr = format(date, "yyyy-MM-dd");
            // Use transactions for accurate revenue (Sales Value)
            const dayTransactions = transactions.filter(t => {
                const tDate = new Date(t.date).toLocaleDateString('en-CA'); // Extract YYYY-MM-DD
                return tDate === dateStr && t.status === 'PAID';
            });

            const totalRevenue = dayTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

            return {
                name: format(date, "EEE", { locale: id }), // e.g. Sen, Sel
                total: totalRevenue,
            };
        });
    }, [bookings, transactions]);

    // 2. Calculate Peak Hours (Heatmap logic, simplified to bar chart of hours)
    const peakHoursData = useMemo(() => {
        const startHour = currentVenue?.operatingHoursStart || 8;
        const endHour = currentVenue?.operatingHoursEnd || 23;
        const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);

        return hours.map(hour => {
            // Count bookings that cover this hour
            const count = bookings.filter(b => {
                if (b.status === 'cancelled') return false;
                // Check if this booking includes this hour
                // Booking startTime is "HH:mm:ss" string, e.g. "10:00:00"
                const startH = parseInt(b.startTime.split(':')[0]);
                const endH = startH + b.duration;
                return hour >= startH && hour < endH;
            }).length;

            return {
                name: `${hour}:00`,
                bookings: count,
            };
        });
    }, [bookings, currentVenue]);

    // KPIs
    // Total Revenue from Transactions (Sales Value)
    const totalRevenue = transactions.filter(t => t.status === 'PAID').reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const totalBookingsCount = bookings.filter(b => b.status !== 'cancelled').length;

    if (loading) return <div className="p-8">Loading reports...</div>;

    const tabs = [
        { id: 'ringkasan' as TabType, label: 'Ringkasan', icon: LayoutGrid },
        { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
        { id: 'export' as TabType, label: 'Export', icon: FileText },
    ];

    return (
        <div className="h-full overflow-y-auto bg-gray-100 p-4 space-y-6 pb-24">
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Laporan & Analitik</h2>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-white p-1 border-2 border-black shadow-neo-sm overflow-hidden">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 font-bold text-xs uppercase transition-all min-w-0 ${activeTab === tab.id
                            ? 'bg-black text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <tab.icon size={14} className="flex-shrink-0" />
                        <span className="truncate">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content: Ringkasan */}
            {activeTab === 'ringkasan' && (
                <>
                    <p className="text-sm text-gray-500 font-bold">Ringkasan performa 30 Hari Terakhir</p>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 border-2 border-black shadow-neo">
                            <p className="text-xs uppercase font-bold text-gray-500">Total Pendapatan</p>
                            <p className="text-xl font-black text-brand-lime-dark">
                                Rp {totalRevenue.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div className="bg-white p-4 border-2 border-black shadow-neo">
                            <p className="text-xs uppercase font-bold text-gray-500">Total Booking (Aktif)</p>
                            <p className="text-xl font-black text-brand-orange">
                                {totalBookingsCount}
                            </p>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="space-y-6">
                        {/* Revenue Chart */}
                        <div className="bg-white p-4 border-2 border-black shadow-neo rounded-sm">
                            <h3 className="text-sm font-bold uppercase mb-4">Tren Pendapatan (7 Hari Terakhir)</h3>
                            <div className="w-full" style={{ height: 200 }}>
                                {mounted && (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                                        <BarChart data={revenueData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                            <YAxis
                                                tick={{ fontSize: 10 }}
                                                width={80}
                                                tickFormatter={(value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0, notation: 'compact', compactDisplay: 'short' }).format(value)}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#f3f4f6' }}
                                                contentStyle={{ border: '2px solid black', borderRadius: '0px', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
                                                formatter={(value: number | undefined) => (value !== undefined) ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value) : ''}
                                            />
                                            <Bar dataKey="total" fill="#BEF264" stroke="#000" strokeWidth={2} radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Peak Hours Chart */}
                        <div className="bg-white p-4 border-2 border-black shadow-neo rounded-sm">
                            <h3 className="text-sm font-bold uppercase mb-4">Jam Tersibuk (Sepanjang Waktu)</h3>
                            <div className="w-full" style={{ height: 200 }}>
                                {mounted && (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                                        <LineChart data={peakHoursData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={2} />
                                            <YAxis tick={{ fontSize: 10 }} width={30} allowDecimals={false} />
                                            <Tooltip
                                                contentStyle={{ border: '2px solid black', borderRadius: '0px', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
                                            />
                                            <Line type="monotone" dataKey="bookings" stroke="#F97316" strokeWidth={3} dot={{ r: 4, fill: '#000' }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Tab Content: Analytics */}
            {activeTab === 'analytics' && currentVenueId && (
                <div className="space-y-6">
                    {/* Date Range Filter */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={20} className="text-gray-500" />
                            <span className="text-sm font-bold text-gray-600">Analisis Detail</span>
                        </div>
                        <div className="flex gap-2">
                            {([7, 30, 90] as const).map((days) => (
                                <button
                                    key={days}
                                    onClick={() => setAnalyticsDays(days)}
                                    className={`px-3 py-1.5 text-xs font-bold uppercase border-2 border-black transition-all ${analyticsDays === days
                                        ? 'bg-black text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {days} Hari
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Revenue Trend Chart */}
                    <RevenueChart venueId={currentVenueId} days={analyticsDays} />

                    {/* Occupancy Heatmap */}
                    <OccupancyHeatmap venueId={currentVenueId} days={analyticsDays} />

                    {/* Court Revenue & Member Ratio - Stacked Vertically */}
                    <div className="space-y-6">
                        <CourtRevenueChart venueId={currentVenueId} days={analyticsDays} />
                        <MemberRatioChart venueId={currentVenueId} days={analyticsDays} />
                    </div>

                    {/* Top Customers Table */}
                    <TopCustomersTable venueId={currentVenueId} days={analyticsDays} />
                </div>
            )}

            {/* Tab Content: Export */}
            {activeTab === 'export' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText size={24} />
                        <h2 className="text-xl font-black italic uppercase">Export Data Detail</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Check: Daily Report (Transactions) */}
                        <div>
                            <h3 className="font-bold uppercase text-lg mb-2">Laporan Transaksi</h3>
                            <DailyReport />
                        </div>

                        {/* Right Check: Booking History */}
                        <div>
                            <h3 className="font-bold uppercase text-lg mb-2">Laporan Booking</h3>
                            <BookingHistoryExport />
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}

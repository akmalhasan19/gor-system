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
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import { getBookingsRange } from "@/lib/api/bookings";
import { Booking } from "@/lib/constants";

export function ReportsView() {
    const { currentVenueId } = useVenue();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch last 30 days data for reports
    useEffect(() => {
        async function fetchData() {
            if (!currentVenueId) return;

            try {
                const today = new Date();
                const startDate = format(subDays(today, 30), 'yyyy-MM-dd');
                const endDate = format(today, 'yyyy-MM-dd');
                const data = await getBookingsRange(currentVenueId, startDate, endDate);
                setBookings(data);
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
            const dayBookings = bookings.filter(b => b.bookingDate === dateStr && b.status !== 'cancelled');
            const totalRevenue = dayBookings.reduce((sum, b) => sum + (b.price || 0), 0);

            return {
                name: format(date, "EEE", { locale: id }), // e.g. Sen, Sel
                total: totalRevenue,
            };
        });
    }, [bookings]);

    // 2. Calculate Peak Hours (Heatmap logic, simplified to bar chart of hours)
    const peakHoursData = useMemo(() => {
        const hours = Array.from({ length: 16 }, (_, i) => i + 8); // 08:00 to 23:00

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
    }, [bookings]);

    // KPIs
    const totalRevenue = bookings.filter(b => b.status !== 'cancelled').reduce((acc, curr) => acc + (curr.price || 0), 0);
    const totalBookingsCount = bookings.filter(b => b.status !== 'cancelled').length;

    if (loading) return <div className="p-8">Loading reports...</div>;

    return (
        <div className="h-full overflow-y-auto bg-gray-100 p-4 space-y-6 pb-24">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Laporan & Analitik</h2>
                <p className="text-sm text-gray-500 font-bold">Ringkasan performa 30 Hari Terakhir</p>
            </div>

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
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 10 }} width={60} tickFormatter={(value) => `Rp${value / 1000}k`} />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{ border: '2px solid black', borderRadius: '0px', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
                                />
                                <Bar dataKey="total" fill="#BEF264" stroke="#000" strokeWidth={2} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Peak Hours Chart */}
                <div className="bg-white p-4 border-2 border-black shadow-neo rounded-sm">
                    <h3 className="text-sm font-bold uppercase mb-4">Jam Tersibuk (Sepanjang Waktu)</h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
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
                    </div>
                </div>
            </div>
        </div>
    );
}

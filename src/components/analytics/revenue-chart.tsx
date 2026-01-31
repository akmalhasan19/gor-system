'use client';

import { useState, useEffect } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { getRevenueData, RevenueDataPoint } from '@/lib/api/analytics';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface RevenueChartProps {
    venueId: string;
    days: number;
}

export function RevenueChart({ venueId, days }: RevenueChartProps) {
    const [data, setData] = useState<RevenueDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);
                const result = await getRevenueData(venueId, days);
                setData(result);
            } catch (err) {
                setError('Gagal memuat data revenue');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        if (venueId) {
            fetchData();
        }
    }, [venueId, days]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        try {
            return format(parseISO(dateStr), 'd MMM', { locale: id });
        } catch {
            return dateStr;
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg border p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-64 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg border p-6">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalTransactions = data.reduce((sum, d) => sum + d.transactionCount, 0);

    return (
        <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Revenue Trend</h3>
                <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                    <p className="text-sm text-gray-500">{totalTransactions} transaksi</p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300} minWidth={100} minHeight={100}>
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorTransfer" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                    />
                    <YAxis
                        tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`}
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                    />
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Tooltip
                        formatter={(value: any, name: any) => [
                            formatCurrency(value ?? 0),
                            name === 'revenue' ? 'Total' : name === 'cash' ? 'Cash' : 'Transfer',
                        ]}
                        labelFormatter={(label) => format(parseISO(label), 'EEEE, d MMMM yyyy', { locale: id })}
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                    />
                    <Legend />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="Total Revenue"
                    />
                    <Area
                        type="monotone"
                        dataKey="cash"
                        stroke="#3b82f6"
                        fillOpacity={0.5}
                        fill="url(#colorCash)"
                        name="Cash"
                    />
                    <Area
                        type="monotone"
                        dataKey="transfer"
                        stroke="#8b5cf6"
                        fillOpacity={0.5}
                        fill="url(#colorTransfer)"
                        name="Transfer"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

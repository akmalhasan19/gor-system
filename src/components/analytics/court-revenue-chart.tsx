'use client';

import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { getRevenueByCourtData, CourtRevenueData } from '@/lib/api/analytics';

interface CourtRevenueChartProps {
    venueId: string;
    days: number;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export function CourtRevenueChart({ venueId, days }: CourtRevenueChartProps) {
    const [data, setData] = useState<CourtRevenueData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);
                const result = await getRevenueByCourtData(venueId, days);
                setData(result);
            } catch (err) {
                setError('Gagal memuat data revenue per lapangan');
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

    if (loading) {
        return (
            <div className="bg-white rounded-lg border p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-48 bg-gray-100 rounded"></div>
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

    return (
        <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Revenue per Lapangan</h3>
                <span className="text-sm text-gray-500">{days} hari terakhir</span>
            </div>

            <ResponsiveContainer width="100%" height={200} minWidth={100} minHeight={100}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        type="number"
                        tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`}
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                    />
                    <YAxis
                        type="category"
                        dataKey="courtName"
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                        width={80}
                    />
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Tooltip
                        formatter={(value: any) => [formatCurrency(value ?? 0), 'Revenue']}
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                        }}
                    />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Revenue</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(totalRevenue)}</span>
                </div>
            </div>
        </div>
    );
}

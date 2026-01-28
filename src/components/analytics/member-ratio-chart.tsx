'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getMemberVsWalkInData, MemberVsWalkInData } from '@/lib/api/analytics';

interface MemberRatioChartProps {
    venueId: string;
    days: number;
}

const COLORS = {
    member: '#10b981',
    walkIn: '#3b82f6',
};

export function MemberRatioChart({ venueId, days }: MemberRatioChartProps) {
    const [data, setData] = useState<MemberVsWalkInData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);
                const result = await getMemberVsWalkInData(venueId, days);
                setData(result);
            } catch (err) {
                setError('Gagal memuat data rasio member');
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

    if (!data) return null;

    const totalBookings = data.member.count + data.walkIn.count;
    const memberPercentage = totalBookings > 0
        ? Math.round((data.member.count / totalBookings) * 100)
        : 0;

    // Filter out segments with 0 value to avoid gap in donut chart
    const pieData = [
        { name: 'Member', value: data.member.count, revenue: data.member.revenue, color: COLORS.member },
        { name: 'Walk-in', value: data.walkIn.count, revenue: data.walkIn.revenue, color: COLORS.walkIn },
    ].filter(item => item.value > 0);

    // Only show padding when both segments have data
    const hasBothSegments = data.member.count > 0 && data.walkIn.count > 0;

    return (
        <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Member vs Walk-in</h3>
                <span className="text-sm text-gray-500">{days} hari terakhir</span>
            </div>

            <div className="flex items-center">
                <div className="w-1/2">
                    <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={60}
                                paddingAngle={hasBothSegments ? 5 : 0}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <Tooltip
                                formatter={(value: any, name: any, entry: any) => [
                                    `${value ?? 0} booking (${formatCurrency(entry?.payload?.revenue ?? 0)})`,
                                    name,
                                ]}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="w-1/2 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">Member</p>
                            <p className="text-xs text-gray-500">
                                {data.member.count} booking ({memberPercentage}%)
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">Walk-in</p>
                            <p className="text-xs text-gray-500">
                                {data.walkIn.count} booking ({100 - memberPercentage}%)
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-center">
                <div>
                    <p className="text-xs text-gray-500">Member Revenue</p>
                    <p className="font-semibold text-green-600">{formatCurrency(data.member.revenue)}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Walk-in Revenue</p>
                    <p className="font-semibold text-blue-600">{formatCurrency(data.walkIn.revenue)}</p>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { getOccupancyData, OccupancyDataPoint } from '@/lib/api/analytics';

interface OccupancyHeatmapProps {
    venueId: string;
    days: number;
}

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00 - 22:00

function getColorClass(occupancy: number): string {
    if (occupancy === 0) return 'bg-gray-100';
    if (occupancy < 20) return 'bg-green-100';
    if (occupancy < 40) return 'bg-green-200';
    if (occupancy < 60) return 'bg-yellow-200';
    if (occupancy < 80) return 'bg-orange-300';
    return 'bg-red-400';
}

function getTextColor(occupancy: number): string {
    if (occupancy >= 60) return 'text-white';
    return 'text-gray-700';
}

export function OccupancyHeatmap({ venueId, days }: OccupancyHeatmapProps) {
    const [data, setData] = useState<OccupancyDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);
                const result = await getOccupancyData(venueId, days);
                setData(result);
            } catch (err) {
                setError('Gagal memuat data occupancy');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        if (venueId) {
            fetchData();
        }
    }, [venueId, days]);

    const getOccupancy = (dayOfWeek: number, hour: number): OccupancyDataPoint | undefined => {
        return data.find((d) => d.dayOfWeek === dayOfWeek && d.hour === hour);
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

    return (
        <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Occupancy Heatmap</h3>
            <p className="text-sm text-gray-500 mb-4">
                Tingkat kepadatan booking berdasarkan hari dan jam ({days} hari terakhir)
            </p>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="w-12 p-1 text-xs text-gray-500"></th>
                            {HOURS.map((hour) => (
                                <th key={hour} className="p-1 text-xs text-gray-500 font-normal">
                                    {hour}:00
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {DAYS.map((dayName, dayIndex) => (
                            <tr key={dayIndex}>
                                <td className="p-1 text-xs text-gray-500 font-medium">{dayName}</td>
                                {HOURS.map((hour) => {
                                    const cellData = getOccupancy(dayIndex, hour);
                                    const occupancy = cellData?.occupancyRate || 0;
                                    return (
                                        <td
                                            key={`${dayIndex}-${hour}`}
                                            className={`p-1 text-center ${getColorClass(occupancy)} ${getTextColor(occupancy)} transition-colors cursor-pointer hover:ring-2 hover:ring-blue-400`}
                                            title={`${dayName} ${hour}:00 - ${occupancy}% (${cellData?.bookingCount || 0} booking)`}
                                        >
                                            <span className="text-xs font-medium">
                                                {occupancy > 0 ? `${occupancy}%` : '-'}
                                            </span>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <span>Rendah</span>
                <div className="flex gap-1">
                    <div className="w-4 h-4 bg-gray-100 rounded"></div>
                    <div className="w-4 h-4 bg-green-100 rounded"></div>
                    <div className="w-4 h-4 bg-green-200 rounded"></div>
                    <div className="w-4 h-4 bg-yellow-200 rounded"></div>
                    <div className="w-4 h-4 bg-orange-300 rounded"></div>
                    <div className="w-4 h-4 bg-red-400 rounded"></div>
                </div>
                <span>Tinggi</span>
            </div>
        </div>
    );
}

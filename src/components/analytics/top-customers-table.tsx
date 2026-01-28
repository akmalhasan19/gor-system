'use client';

import { useState, useEffect } from 'react';
import { getTopCustomers, TopCustomer } from '@/lib/api/analytics';
import { UserCircle, Crown, Trophy } from 'lucide-react';

interface TopCustomersTableProps {
    venueId: string;
    days: number;
}

export function TopCustomersTable({ venueId, days }: TopCustomersTableProps) {
    const [data, setData] = useState<TopCustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);
                const result = await getTopCustomers(venueId, days, 10);
                setData(result);
            } catch (err) {
                setError('Gagal memuat data pelanggan');
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

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="w-5 h-5 text-yellow-500" />;
            case 2:
                return <Trophy className="w-5 h-5 text-gray-400" />;
            case 3:
                return <Trophy className="w-5 h-5 text-amber-600" />;
            default:
                return <span className="w-5 h-5 flex items-center justify-center text-sm text-gray-500">{rank}</span>;
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg border p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-10 bg-gray-100 rounded"></div>
                        ))}
                    </div>
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
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Top 10 Pelanggan</h3>
                <span className="text-sm text-gray-500">{days} hari terakhir</span>
            </div>

            {data.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <UserCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Belum ada data pelanggan</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase">#</th>
                                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase">Nama</th>
                                <th className="text-center py-2 px-2 text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 uppercase">Booking</th>
                                <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 uppercase">Total Spending</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((customer, index) => (
                                <tr key={customer.phone} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="py-3 px-2">
                                        {getRankIcon(index + 1)}
                                    </td>
                                    <td className="py-3 px-2">
                                        <div>
                                            <p className="font-medium text-gray-800">{customer.customerName}</p>
                                            <p className="text-xs text-gray-500">{customer.phone}</p>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                        {customer.isMember ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                Member
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                Walk-in
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-2 text-right text-sm text-gray-600">
                                        {customer.bookingCount}x
                                    </td>
                                    <td className="py-3 px-2 text-right">
                                        <span className="font-semibold text-gray-800">
                                            {formatCurrency(customer.totalSpending)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

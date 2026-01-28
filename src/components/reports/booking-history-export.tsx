"use client";

import React, { useState } from "react";
import { useVenue } from "@/lib/venue-context";
import { getBookingsRange } from "@/lib/api/bookings";
import { exportBookingsToCSV } from "@/lib/utils/csv-export";
import { Booking } from "@/lib/constants";
import { toast } from "sonner";
import { Download, Loader2, Calendar, Filter } from "lucide-react";

const STATUS_OPTIONS = [
    { value: 'LUNAS', label: 'Lunas', color: 'bg-green-100 border-green-600 text-green-800' },
    { value: 'DP', label: 'DP', color: 'bg-yellow-100 border-yellow-600 text-yellow-800' },
    { value: 'BELUM_BAYAR', label: 'Belum Bayar', color: 'bg-red-100 border-red-600 text-red-800' },
    { value: 'BELUM', label: 'Belum', color: 'bg-gray-100 border-gray-600 text-gray-800' },
    { value: 'pending', label: 'Pending', color: 'bg-blue-100 border-blue-600 text-blue-800' },
    { value: 'cancelled', label: 'Dibatalkan', color: 'bg-gray-100 border-gray-500 text-gray-600' },
];

export const BookingHistoryExport = () => {
    const { currentVenueId } = useVenue();
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const handleStatusToggle = (status: string) => {
        setSelectedStatuses(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    const handleSearch = async () => {
        if (!startDate || !endDate) {
            toast.warning('Harap isi tanggal mulai dan tanggal akhir.');
            return;
        }

        if (new Date(endDate) < new Date(startDate)) {
            toast.error('Tanggal akhir harus setelah tanggal mulai.');
            return;
        }

        if (!currentVenueId) {
            toast.error('Venue tidak ditemukan.');
            return;
        }

        setIsLoading(true);
        try {
            const data = await getBookingsRange(currentVenueId, startDate, endDate);

            // Apply status filter if any selected
            let filteredData = data;
            if (selectedStatuses.length > 0) {
                filteredData = data.filter(b => selectedStatuses.includes(b.status));
            }

            setBookings(filteredData);
            setHasSearched(true);

            if (filteredData.length === 0) {
                toast.info('Tidak ada booking ditemukan untuk filter yang dipilih.');
            } else {
                toast.success(`Ditemukan ${filteredData.length} booking.`);
            }
        } catch (error) {
            console.error('Failed to load bookings:', error);
            toast.error('Gagal memuat data booking.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (bookings.length === 0) {
            toast.warning('Tidak ada data booking untuk di-export.');
            return;
        }

        try {
            const filename = `Riwayat_Booking_${startDate}_${endDate}.csv`;
            exportBookingsToCSV(bookings, filename);
            toast.success(`Berhasil export ${bookings.length} booking!`);
        } catch (error) {
            console.error('Export CSV error:', error);
            toast.error('Gagal export CSV. Silakan coba lagi.');
        }
    };

    const handleSelectAllStatuses = () => {
        if (selectedStatuses.length === STATUS_OPTIONS.length) {
            setSelectedStatuses([]);
        } else {
            setSelectedStatuses(STATUS_OPTIONS.map(s => s.value));
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="font-black text-lg uppercase italic flex items-center gap-2">
                <Calendar size={20} />
                Export Riwayat Booking
            </h3>

            {/* Date Range Filter */}
            <div className="bg-white p-4 border-2 border-black shadow-neo">
                <div className="text-[10px] font-bold uppercase text-gray-500 mb-3">Rentang Tanggal</div>
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="text-sm px-3 py-2 border-2 border-black font-medium"
                    />
                    <span className="font-bold text-sm">s/d</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="text-sm px-3 py-2 border-2 border-black font-medium"
                    />
                </div>
            </div>

            {/* Status Filter */}
            <div className="bg-white p-4 border-2 border-black shadow-neo">
                <div className="flex justify-between items-center mb-3">
                    <div className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1">
                        <Filter size={12} />
                        Filter Status
                    </div>
                    <button
                        onClick={handleSelectAllStatuses}
                        className="text-[10px] font-bold underline text-blue-600 hover:text-blue-800"
                    >
                        {selectedStatuses.length === STATUS_OPTIONS.length ? 'Hapus Semua' : 'Pilih Semua'}
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((status) => (
                        <button
                            key={status.value}
                            onClick={() => handleStatusToggle(status.value)}
                            className={`px-3 py-1.5 text-xs font-bold border-2 transition-all ${selectedStatuses.includes(status.value)
                                    ? status.color
                                    : 'bg-white border-gray-300 text-gray-500'
                                }`}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>
                {selectedStatuses.length > 0 && (
                    <div className="mt-2 text-[10px] font-medium text-gray-500">
                        {selectedStatuses.length} status dipilih
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-black text-white px-4 py-3 font-bold uppercase hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Mencari...
                        </>
                    ) : (
                        'Cari Data'
                    )}
                </button>
                {hasSearched && bookings.length > 0 && (
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 font-bold uppercase hover:bg-green-700 transition-all"
                    >
                        <Download size={16} />
                        Export ({bookings.length})
                    </button>
                )}
            </div>

            {/* Preview Results */}
            {hasSearched && (
                <div className="bg-gray-50 p-4 border-2 border-dashed border-gray-300">
                    {bookings.length === 0 ? (
                        <p className="text-gray-500 text-center text-sm font-medium">
                            Tidak ada data ditemukan.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            <div className="text-[10px] font-bold uppercase text-gray-500">
                                Preview ({bookings.length} booking)
                            </div>
                            <div className="max-h-60 overflow-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-white sticky top-0">
                                        <tr className="border-b-2 border-black">
                                            <th className="text-left py-2 px-1 font-black">Tanggal</th>
                                            <th className="text-left py-2 px-1 font-black">Pelanggan</th>
                                            <th className="text-left py-2 px-1 font-black">Status</th>
                                            <th className="text-right py-2 px-1 font-black">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.slice(0, 10).map((booking) => (
                                            <tr key={booking.id} className="border-b border-gray-200">
                                                <td className="py-2 px-1">{booking.bookingDate}</td>
                                                <td className="py-2 px-1 font-bold">{booking.customerName}</td>
                                                <td className="py-2 px-1">
                                                    <span className={`px-1.5 py-0.5 text-[10px] font-bold border ${STATUS_OPTIONS.find(s => s.value === booking.status)?.color || 'bg-gray-100'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-1 text-right font-bold">
                                                    Rp {booking.price.toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {bookings.length > 10 && (
                                    <div className="text-center mt-2 text-[10px] text-gray-500 font-medium">
                                        ... dan {bookings.length - 10} lainnya
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

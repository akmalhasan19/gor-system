"use client";

import { useEffect, useState } from 'react';
import { Shift } from '@/lib/types/financial';
import { getShiftHistory, getShiftHistoryRange } from '@/lib/api/shifts';
import { useVenue } from '@/lib/venue-context';
import { Loader2, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { exportShiftHistoryToCSV } from '@/lib/utils/csv-export';
import { toast } from 'sonner';
import { ShiftDetailModal } from './shift-detail-modal';


interface ShiftHistoryProps {
    selectedDate?: string;
}

export function ShiftHistory({ selectedDate }: ShiftHistoryProps) {
    const { currentVenueId } = useVenue();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

    // Date range filter state
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [useRangeFilter, setUseRangeFilter] = useState(false);

    useEffect(() => {
        async function loadHistory() {
            if (!currentVenueId) return;
            setIsLoading(true);
            try {
                let history: Shift[];

                if (useRangeFilter && startDate && endDate) {
                    // Use date range filter
                    history = await getShiftHistoryRange(currentVenueId, startDate, endDate);
                } else {
                    // Pass selectedDate if provided, otherwise it fetches all (or default limit)
                    history = await getShiftHistory(currentVenueId, selectedDate);
                }

                setShifts(history);
            } catch (error) {
                console.error('Failed to load shift history:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadHistory();
    }, [currentVenueId, selectedDate, useRangeFilter, startDate, endDate]);

    const handleExportCSV = () => {
        if (shifts.length === 0) {
            toast.warning('Belum ada shift untuk di-export.');
            return;
        }

        try {
            let filename: string;
            if (useRangeFilter && startDate && endDate) {
                filename = `Riwayat_Shift_${startDate}_${endDate}.csv`;
            } else {
                const today = new Date().toISOString().split('T')[0];
                filename = `Riwayat_Shift_${today}.csv`;
            }

            exportShiftHistoryToCSV(shifts, filename);
            toast.success(`Berhasil export ${shifts.length} shift!`);
        } catch (error) {
            console.error('Export CSV error:', error);
            toast.error('Gagal export CSV. Silakan coba lagi.');
        }
    };

    const handleApplyRangeFilter = () => {
        if (startDate && endDate) {
            if (new Date(endDate) < new Date(startDate)) {
                toast.error('Tanggal akhir harus setelah tanggal mulai.');
                return;
            }
            setUseRangeFilter(true);
        } else {
            toast.warning('Harap isi tanggal mulai dan tanggal akhir.');
        }
    };

    const handleClearFilter = () => {
        setStartDate('');
        setEndDate('');
        setUseRangeFilter(false);
    };

    if (isLoading) {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-4">
            {/* Header with Export Button */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-black text-lg uppercase italic">Riwayat Shift</h3>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-1.5 text-xs bg-black text-white px-3 py-1.5 font-bold uppercase hover:bg-gray-800 transition-all active:scale-95 border-2 border-black"
                    >
                        <Download size={14} />
                        Export CSV
                    </button>
                </div>

                {/* Date Range Filter */}
                <div className="bg-gray-50 p-3 border-2 border-black">
                    <div className="text-[10px] font-bold uppercase text-gray-500 mb-2">Filter Rentang Tanggal</div>
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-xs px-2 py-1.5 border-2 border-black font-medium bg-white"
                        />
                        <span className="text-xs font-bold">s/d</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-xs px-2 py-1.5 border-2 border-black font-medium bg-white"
                        />
                        <button
                            onClick={handleApplyRangeFilter}
                            className="text-xs bg-black text-white px-3 py-1.5 font-bold uppercase hover:bg-gray-800 transition-all"
                        >
                            Terapkan
                        </button>
                        {useRangeFilter && (
                            <button
                                onClick={handleClearFilter}
                                className="text-xs bg-gray-200 text-black px-3 py-1.5 font-bold uppercase hover:bg-gray-300 transition-all border border-gray-400"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                    {useRangeFilter && (
                        <div className="mt-2 text-[10px] font-bold text-green-600">
                            ✓ Filter aktif: {startDate} s/d {endDate}
                        </div>
                    )}
                </div>
            </div>

            {/* Shift List */}
            {shifts.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 font-medium text-sm">Tidak ada shift ditemukan.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {shifts.map((shift) => {
                        const startCash = shift.start_cash;
                        const endCash = shift.end_cash || 0;
                        const expected = shift.expected_cash || 0;
                        const discrepancy = endCash - expected;
                        const isDiscrepancyZero = Math.abs(discrepancy) < 1; // Float tolerance
                        const hasDiscrepancy = !isDiscrepancyZero;

                        return (
                            <div
                                key={shift.id}
                                className="bg-white border-2 border-black p-4 shadow-[2px_2px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
                                onClick={() => setSelectedShift(shift)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded-full border border-gray-300">
                                            {new Date(shift.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-2 font-medium">
                                            {new Date(shift.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} -
                                            {shift.end_time ? new Date(shift.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                                        </span>
                                    </div>
                                    <div className={`px-2 py-1 text-xs font-black uppercase flex items-center gap-1 border-2 ${hasDiscrepancy ? (discrepancy > 0 ? 'bg-green-100 border-green-600 text-green-800' : 'bg-red-100 border-red-600 text-red-800') : 'bg-gray-100 border-gray-400 text-gray-600'}`}>
                                        {hasDiscrepancy ? (
                                            <>
                                                <AlertCircle size={12} />
                                                {discrepancy > 0 ? '+' : ''}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(discrepancy)}
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={12} />
                                                Balanced
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase text-gray-500">Start Cash</span>
                                        <span className="font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(startCash)}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[10px] font-bold uppercase text-gray-500">End Cash</span>
                                        <span className="font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(endCash)}</span>
                                    </div>
                                </div>

                                {shift.notes && (
                                    <div className="mt-3 bg-yellow-50 p-2 border border-yellow-200 text-xs italic text-yellow-800">
                                        "{shift.notes}"
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            <ShiftDetailModal
                isOpen={!!selectedShift}
                onClose={() => setSelectedShift(null)}
                shift={selectedShift}
            />
        </div>
    );
}

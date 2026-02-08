import { Shift } from '@/lib/types/financial';
import { Loader2, DollarSign, Clock, User, Download, X } from 'lucide-react';
import { exportShiftHistoryToCSV } from '@/lib/utils/csv-export';

interface ShiftDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    shift: Shift | null;
}

export function ShiftDetailModal({ isOpen, onClose, shift }: ShiftDetailModalProps) {
    if (!isOpen || !shift) return null;

    // Calculations
    const startCash = shift.start_cash;
    const endCash = shift.end_cash || 0;
    const expected = shift.expected_cash || 0;
    const discrepancy = endCash - expected;
    const isDiscrepancyZero = Math.abs(discrepancy) < 1;

    // Duration
    const startTime = new Date(shift.start_time);
    const endTime = shift.end_time ? new Date(shift.end_time) : new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    const handleExport = () => {
        exportShiftHistoryToCSV([shift], `Shift_Detail_${shift.id.substring(0, 8)}.csv`);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black shadow-neo w-full max-w-md flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden">
                {/* Header */}
                <div className="bg-black text-white p-4 flex justify-between items-center border-b-2 border-black">
                    <div className="flex flex-col">
                        <h2 className="font-black text-lg uppercase tracking-wider">Detail Shift</h2>
                        <span className="text-xs text-gray-400 font-mono">{shift.id.substring(0, 8)}...</span>
                    </div>
                    <button onClick={onClose} className="hover:text-brand-orange font-bold text-sm bg-white/10 p-1 rounded-full"><X size={16} /></button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[80vh]">

                    {/* Opener Info */}
                    <div className="flex items-center gap-3 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="bg-brand-lilac p-2 rounded-full border-2 border-black">
                            <User size={20} className="text-black" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Shift Opener (Kasir)</p>
                            <p className="font-black text-lg capitalize">{shift.opener_name || 'Unknown'}</p>
                            {shift.opener?.email && <p className="text-xs text-gray-400">{shift.opener.email}</p>}
                        </div>
                    </div>

                    {/* Time & Duration */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="border-l-4 border-brand-green pl-3">
                            <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Clock size={10} /> Start Time</p>
                            <p className="font-bold text-sm">{startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-[10px] text-gray-400">{startTime.toLocaleDateString('id-ID')}</p>
                        </div>
                        <div className="border-l-4 border-brand-orange pl-3">
                            <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Clock size={10} /> End Time</p>
                            <p className="font-bold text-sm">{shift.end_time ? endTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Active'}</p>
                            <p className="text-[10px] text-gray-400">{shift.end_time ? endTime.toLocaleDateString('id-ID') : '-'}</p>
                        </div>
                    </div>

                    <div className="text-center mb-6">
                        <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full border border-gray-600">
                            Duration: {durationHours}h {durationMinutes}m
                        </span>
                    </div>

                    <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

                    {/* Financials */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Starting Cash</span>
                            <span className="font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(startCash)}</span>
                        </div>
                        {/* We assume expected_cash = start_cash + cash_transactions - expenses. 
                             So (expected_cash - start_cash) is approx net transaction movement including expenses?
                             Actually expected_cash calculation is hidden in backend usually. 
                             But we know Expected = Start + Cash Sales - Expenses.
                             So Cash Sales - Expenses = Expected - Start. 
                         */}
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Expected End</span>
                            <span className="font-bold text-blue-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(expected)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Actual End</span>
                            <span className="font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(endCash)}</span>
                        </div>
                        <div className={`flex justify-between items-center p-2 rounded ${isDiscrepancyZero ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            <span className="text-sm font-bold uppercase">Variance/Selisih</span>
                            <span className="font-black text-lg">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(discrepancy)}</span>
                        </div>
                    </div>

                    {shift.notes && (
                        <div className="mt-6 bg-yellow-50 p-3 border border-yellow-200 rounded text-sm italic text-yellow-800">
                            <span className="font-bold block not-italic mb-1 opacity-75 text-xs uppercase">Notes</span>
                            "{shift.notes}"
                        </div>
                    )}
                </div>

                <div className="p-4 border-t-2 border-black bg-gray-50">
                    <button
                        onClick={handleExport}
                        className="w-full bg-white text-black font-bold py-3 text-sm uppercase hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                        <Download size={16} />
                        Download Report
                    </button>
                </div>
            </div>
        </div>
    );
}

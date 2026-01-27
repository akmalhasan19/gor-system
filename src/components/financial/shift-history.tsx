import { useEffect, useState } from 'react';
import { Shift } from '@/lib/types/financial';
import { getShiftHistory } from '@/lib/api/shifts';
import { useVenue } from '@/lib/venue-context';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';


interface ShiftHistoryProps {
    selectedDate?: string;
}

export function ShiftHistory({ selectedDate }: ShiftHistoryProps) {
    const { currentVenueId } = useVenue();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadHistory() {
            if (!currentVenueId) return;
            setIsLoading(true);
            try {
                // Pass selectedDate if provided, otherwise it fetches all (or default limit)
                // But wait, if selectedDate is provided, we want to filter by that date.
                const history = await getShiftHistory(currentVenueId, selectedDate);
                setShifts(history);
            } catch (error) {
                console.error('Failed to load shift history:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadHistory();
    }, [currentVenueId, selectedDate]);

    if (isLoading) {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (shifts.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 font-medium text-sm">No closed shifts found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="font-black text-lg uppercase italic">Recent Shift History</h3>
            <div className="flex flex-col gap-3">
                {shifts.map((shift) => {
                    const startCash = shift.start_cash;
                    const endCash = shift.end_cash || 0;
                    const expected = shift.expected_cash || 0;
                    const discrepancy = endCash - expected;
                    const isDiscrepancyZero = Math.abs(discrepancy) < 1; // Float tolerance
                    const hasDiscrepancy = !isDiscrepancyZero;

                    return (
                        <div key={shift.id} className="bg-white border-2 border-black p-4 shadow-[2px_2px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
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
        </div>
    );
}

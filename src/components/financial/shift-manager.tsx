import { useState, useEffect, useCallback } from 'react';
import { useVenue } from '@/lib/venue-context';
import { Shift } from '@/lib/types/financial';
import { getOpenShift, startShift, endShift, getShiftExpectations } from '@/lib/api/shifts';
import { OpenShiftModal } from './open-shift-modal';
import { CloseShiftModal } from './close-shift-modal';
import { ShiftHistory } from './shift-history';
import { Loader2, DollarSign, Clock, User } from 'lucide-react';
import { toast } from 'sonner';


interface ShiftManagerProps {
    selectedDate?: string;
}

export function ShiftManager({ selectedDate }: ShiftManagerProps) {
    const { currentVenueId } = useVenue();
    const [shift, setShift] = useState<Shift | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isStartModalOpen, setIsStartModalOpen] = useState(false);
    const [isEndModalOpen, setIsEndModalOpen] = useState(false);
    const [shiftStats, setShiftStats] = useState<{
        expectedCash: number;
        totalCash: number;
        totalTransfer: number;
        bookingRevenue: number;
        productRevenue: number;
    } | null>(null);

    const loadShift = useCallback(async () => {
        if (!currentVenueId) return;
        setIsLoading(true);
        try {
            const activeShift = await getOpenShift(currentVenueId);
            setShift(activeShift);

            if (activeShift) {
                const stats = await getShiftExpectations(currentVenueId, activeShift.start_time);
                // Calculate expected cash: Start Cash + Total Cash Transactions
                const calculatedExpectedCash = activeShift.start_cash + stats.totalCash;
                setShiftStats({
                    ...stats,
                    expectedCash: calculatedExpectedCash
                });
            } else {
                setShiftStats(null);
            }
        } catch (error) {
            console.error('Failed to load shift:', error);
            toast.error('Failed to load shift status');
        } finally {
            setIsLoading(false);
        }
    }, [currentVenueId]);

    useEffect(() => {
        loadShift();
    }, [loadShift]);

    const handleStartShift = async (startCash: number) => {
        if (!currentVenueId) return;
        try {
            const newShift = await startShift(currentVenueId, startCash);
            setShift(newShift);
            toast.success('Shift opened successfully');
        } catch (error: any) {
            console.error('Failed to start shift:', error);
            toast.error(error.message || 'Failed to start shift');
        }
    };

    const handleEndShift = async (endCash: number, expectedCash: number, notes?: string) => {
        if (!shift) return;
        try {
            await endShift(shift.id, endCash, expectedCash, notes);
            setShift(null);
            toast.success('Shift closed successfully');
        } catch (error: any) {
            console.error('Failed to end shift:', error);
            toast.error(error.message || 'Failed to end shift');
        }
    };



    if (isLoading) {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!shift) {
        return (
            <>
                <div className="bg-white border-2 border-black p-6 shadow-neo">
                    <div className="flex flex-col items-center justify-center gap-4 text-center py-8">
                        <div className="bg-gray-100 p-4 rounded-full border-2 border-black">
                            <DollarSign className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase">No Active Shift</h3>
                            <p className="text-gray-500 font-medium">To start processing transactions, please open a register.</p>
                        </div>
                        <button
                            onClick={() => setIsStartModalOpen(true)}
                            className="bg-black text-white font-black py-3 px-6 text-sm uppercase hover:bg-brand-orange hover:text-black border-2 border-transparent hover:border-black transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] hover:translate-x-0 hover:translate-y-0"
                        >
                            Open Register / Shift
                        </button>
                    </div>
                    <OpenShiftModal
                        isOpen={isStartModalOpen}
                        onClose={() => setIsStartModalOpen(false)}
                        onOpenShift={handleStartShift}
                    />
                </div>
                <div className="mt-8">
                    <ShiftHistory selectedDate={selectedDate} />
                </div>
            </>
        );
    }

    return (
        <div className='flex flex-col'>
            <div className="bg-white border-2 border-black shadow-neo overflow-hidden">
                <div className="bg-green-100 p-4 border-b-2 border-black flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-500 text-white p-2 border-2 border-black shadow-[2px_2px_0px_black]">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-lg uppercase text-green-900 leading-tight">Shift Active</h3>
                            <p className="text-xs font-bold text-green-700">Started: {new Date(shift.start_time).toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <span className="text-xs font-bold text-green-700 uppercase block">Opener</span>
                        {/* Opener info is not explicitly in Shift type detail yet (just ID), so skipping or need to fetch/expand */}
                        <span className="font-black text-sm">Staff ID: {shift.opener_id?.substring(0, 8)}...</span>
                    </div>
                </div>

                <div className="p-6 grid gap-6 md:grid-cols-3">
                    <div className="bg-gray-50 p-4 border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                        <span className="text-xs font-bold uppercase text-gray-500">Starting Cash</span>
                        <div className="text-2xl font-black">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(shift.start_cash)}
                        </div>
                    </div>
                    <div className="bg-blue-50 p-4 border-2 border-blue-900 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                        <span className="text-xs font-bold uppercase text-blue-800">Current Expected</span>
                        <div className="text-2xl font-black text-blue-900">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(shiftStats?.expectedCash || 0)}
                        </div>
                        <p className="text-[10px] text-blue-600 mt-1 font-bold">* Includes starting cash + transactions</p>
                    </div>
                    <div className="flex items-center justify-end">
                        <button
                            onClick={() => setIsEndModalOpen(true)}
                            className="w-full bg-red-600 text-white font-black py-4 px-6 text-sm uppercase hover:bg-red-700 border-2 border-transparent hover:border-black transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] hover:translate-x-0 hover:translate-y-0"
                        >
                            Close Register
                        </button>
                    </div>
                </div>

                <CloseShiftModal
                    isOpen={isEndModalOpen}
                    onClose={() => setIsEndModalOpen(false)}
                    onCloseShift={handleEndShift}
                    expectedCash={shiftStats?.expectedCash || 0}
                    stats={shiftStats}
                />
            </div>
            <div className="mt-8">
                <ShiftHistory selectedDate={selectedDate} />
            </div>
        </div >
    );
}

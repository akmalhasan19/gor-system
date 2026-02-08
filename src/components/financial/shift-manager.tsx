import { useState, useEffect, useCallback } from 'react';
import { useVenue } from '@/lib/venue-context';
import { Shift } from '@/lib/types/financial';
import { getOpenShift, startShift, endShift, getShiftExpectations } from '@/lib/api/shifts';
import { createExpense, getShiftExpenses, ShiftExpense } from '@/lib/api/expenses';
import { OpenShiftModal } from './open-shift-modal';
import { CloseShiftModal } from './close-shift-modal';
import { ExpenseModal } from './expense-modal';
import { ShiftHistory } from './shift-history';
import { Loader2, DollarSign, Clock } from 'lucide-react';
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

    // Expense State
    const [expenses, setExpenses] = useState<ShiftExpense[]>([]);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

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

                // Load expenses
                getShiftExpenses(activeShift.id)
                    .then(setExpenses)
                    .catch(e => console.error('Failed to load expenses', e));
            } else {
                setShiftStats(null);
                setExpenses([]);
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
            loadShift(); // Reload to get everything fresh
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
            setExpenses([]);
            toast.success('Shift closed successfully');
        } catch (error: any) {
            console.error('Failed to end shift:', error);
            toast.error(error.message || 'Failed to end shift');
        }
    };

    const handleAddExpense = async (amount: number, category: string, description: string) => {
        if (!shift || !currentVenueId) return;
        try {
            const newExpense = await createExpense(currentVenueId, shift.id, { amount, category, description });
            setExpenses(prev => [newExpense, ...prev]);
            toast.success('Pengeluaran berhasil dicatat');
        } catch (error) {
            console.error('Failed to add expense:', error);
            toast.error('Gagal mencatat pengeluaran');
        }
    };

    // Calculate Total Expenses
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

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

    // Expected Cash after expenses
    const expectedCashAfterExpenses = (shiftStats?.expectedCash || 0) - totalExpenses;

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
                        {/* Opener info fallback */}
                        <span className="font-black text-sm">Staff ID: {shift.opener_id?.substring(0, 8)}...</span>
                    </div>
                </div>

                <div className="p-6 grid gap-6 md:grid-cols-3">
                    {/* Starting Cash */}
                    <div className="bg-gray-50 p-4 border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                        <span className="text-xs font-bold uppercase text-gray-500">Starting Cash</span>
                        <div className="text-2xl font-black">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(shift.start_cash)}
                        </div>
                    </div>

                    {/* Total Expenses (Clickable) */}
                    <div
                        className="bg-red-50 p-4 border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.1)] cursor-pointer hover:bg-red-100 transition-colors group"
                        onClick={() => setIsExpenseModalOpen(true)}
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-bold uppercase text-red-800">Total Pengeluaran</span>
                            <div className="bg-red-200 group-hover:bg-red-300 p-1 rounded border border-red-800 transition-colors">
                                <span className="text-[10px] font-bold text-red-900 uppercase flex items-center gap-1">
                                    Input <DollarSign size={10} />
                                </span>
                            </div>
                        </div>
                        <div className="text-2xl font-black text-red-900">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalExpenses)}
                        </div>
                        <p className="text-[10px] text-red-600 mt-1 font-bold">* Klik untuk tambah</p>
                    </div>

                    {/* Current Expected Cash */}
                    <div className="bg-blue-50 p-4 border-2 border-blue-900 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                        <span className="text-xs font-bold uppercase text-blue-800">Current Expected</span>
                        <div className="text-2xl font-black text-blue-900">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(expectedCashAfterExpenses)}
                        </div>
                        <p className="text-[10px] text-blue-600 mt-1 font-bold">* Cash in Drawer (After Expenses)</p>
                    </div>
                </div>

                <div className="px-6 pb-6 flex items-center justify-end">
                    <button
                        onClick={() => setIsEndModalOpen(true)}
                        className="w-full md:w-auto bg-red-600 text-white font-black py-4 px-12 text-sm uppercase hover:bg-red-700 border-2 border-transparent hover:border-black transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] hover:translate-x-0 hover:translate-y-0"
                    >
                        Close Register
                    </button>
                </div>

                <CloseShiftModal
                    isOpen={isEndModalOpen}
                    onClose={() => setIsEndModalOpen(false)}
                    onCloseShift={handleEndShift}
                    expectedCash={expectedCashAfterExpenses} // Pass the adjusted expected cash
                    stats={shiftStats}
                />

                <ExpenseModal
                    isOpen={isExpenseModalOpen}
                    onClose={() => setIsExpenseModalOpen(false)}
                    onAddExpense={handleAddExpense}
                />
            </div>
            <div className="mt-8">
                <ShiftHistory selectedDate={selectedDate} />
            </div>
        </div >
    );
}

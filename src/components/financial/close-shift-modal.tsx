import { useState } from 'react';
import { NeoInput } from '@/components/ui/neo-input';
import { Loader2 } from 'lucide-react';

interface CloseShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCloseShift: (endCash: number, expectedCash: number, notes?: string) => Promise<void>;
    expectedCash: number;
    stats: {
        expectedCash: number;
        totalCash: number;
        totalTransfer: number;
        bookingRevenue: number;
        productRevenue: number;
    } | null;
}

export function CloseShiftModal({ isOpen, onClose, onCloseShift, expectedCash, stats }: CloseShiftModalProps) {
    const [endCash, setEndCash] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!endCash) return;
        setIsLoading(true);
        try {
            await onCloseShift(parseFloat(endCash), expectedCash, notes);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const actualCash = parseFloat(endCash || '0');
    const discrepancy = actualCash - expectedCash;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black shadow-neo w-full max-w-sm flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="bg-black text-white p-3 flex justify-between items-center border-b-2 border-black">
                    <h2 className="font-black text-sm uppercase">Close Register / Shift</h2>
                    <button onClick={onClose} className="hover:text-brand-orange font-bold text-sm">X</button>
                </div>

                <div className="p-6 flex flex-col gap-4">
                    <div className="bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-bold uppercase text-blue-800 mb-1">System Expected Cash</p>
                        <p className="text-2xl font-black text-blue-900">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(expectedCash)}
                        </p>
                        {stats && (
                            <div className="mt-2 text-xs text-blue-700 space-y-1 border-t border-blue-200 pt-2">
                                <div className="flex justify-between">
                                    <span>Cash Sales:</span>
                                    <span className="font-bold">{new Intl.NumberFormat('id-ID').format(stats.totalCash)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Non-Cash:</span>
                                    <span className="font-bold">{new Intl.NumberFormat('id-ID').format(stats.totalTransfer)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase">Actual Cash Counted</label>
                        <NeoInput
                            type="number"
                            min="0"
                            step="1000"
                            value={endCash}
                            onChange={(e) => setEndCash(e.target.value)}
                            placeholder="0"
                            className="p-2 text-sm"
                            autoFocus
                        />
                    </div>

                    {endCash && (
                        <div className={`p-2 border-2 ${discrepancy >= 0 ? 'bg-green-100 border-green-600 text-green-800' : 'bg-red-100 border-red-600 text-red-800'}`}>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold uppercase">Discrepancy</span>
                                <span className="font-black">
                                    {discrepancy > 0 ? '+' : ''}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(discrepancy)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase">Notes (Optional)</label>
                        <textarea
                            className="border-2 border-black p-2 font-medium text-sm w-full outline-none focus:shadow-[2px_2px_0px_black] transition-all resize-none h-20"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any issues or reasons for discrepancy..."
                        />
                    </div>
                </div>

                <div className="p-3 border-t-2 border-black bg-gray-50 flex gap-2">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 bg-white text-black font-bold py-3 text-sm uppercase hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !endCash}
                        className="flex-1 bg-black text-white font-bold py-3 text-sm uppercase hover:bg-brand-orange hover:text-black border-2 border-transparent hover:border-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Close Shift
                    </button>
                </div>
            </div>
        </div>
    );
}

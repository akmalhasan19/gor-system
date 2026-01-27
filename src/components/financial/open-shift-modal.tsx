import { useState } from 'react';
import { NeoInput } from '@/components/ui/neo-input';
import { Loader2 } from 'lucide-react';

interface OpenShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenShift: (startCash: number) => Promise<void>;
}

export function OpenShiftModal({ isOpen, onClose, onOpenShift }: OpenShiftModalProps) {
    const [startCash, setStartCash] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!startCash) return;
        setIsLoading(true);
        try {
            await onOpenShift(parseFloat(startCash));
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black shadow-neo w-full max-w-sm flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="bg-black text-white p-3 flex justify-between items-center border-b-2 border-black">
                    <h2 className="font-black text-sm uppercase">Open Register / Shift</h2>
                    <button onClick={onClose} className="hover:text-brand-orange font-bold text-sm">X</button>
                </div>

                <div className="p-6 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase">Starting Cash (Float)</label>
                        <NeoInput
                            type="number"
                            min="0"
                            step="1000"
                            value={startCash}
                            onChange={(e) => setStartCash(e.target.value)}
                            placeholder="0"
                            className="p-2 text-sm"
                            autoFocus
                        />
                        <p className="text-[10px] text-gray-500 font-medium">
                            Enter the amount of cash currently in the drawer to start the shift.
                        </p>
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
                        disabled={isLoading || !startCash}
                        className="flex-1 bg-black text-white font-bold py-3 text-sm uppercase hover:bg-brand-orange hover:text-black border-2 border-transparent hover:border-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Open Shift
                    </button>
                </div>
            </div>
        </div>
    );
}

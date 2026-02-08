'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, DollarSign, FileText, Tag } from 'lucide-react';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddExpense: (amount: number, category: string, description: string) => Promise<void>;
}

const expenseSchema = z.object({
    amount: z.string().min(1, 'Amount is required'),
    category: z.string().min(1, 'Category is required'),
    description: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export function ExpenseModal({ isOpen, onClose, onAddExpense }: ExpenseModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            category: 'OPERATIONAL'
        }
    });

    const onSubmit = async (data: ExpenseFormValues) => {
        setIsLoading(true);
        try {
            // Remove non-numeric characters for amount processing
            const cleanAmount = parseInt(data.amount.replace(/\D/g, ''));
            await onAddExpense(cleanAmount, data.category, data.description || '');
            reset();
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md border-2 border-black shadow-neo">
                <div className="bg-red-100 p-4 border-b-2 border-black flex justify-between items-center">
                    <h3 className="font-black text-lg uppercase text-red-900">Catat Pengeluaran</h3>
                    <button
                        onClick={onClose}
                        className="text-red-900 hover:text-red-700 font-bold"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    {/* Amount Input */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-500">Nominal Pengeluaran</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                {...register('amount')}
                                type="text"
                                className="w-full pl-9 p-3 font-mono font-bold border-2 border-black focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="0"
                                onChange={(e) => {
                                    // Auto format as IDR currency visually
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val) {
                                        e.target.value = new Intl.NumberFormat('id-ID').format(parseInt(val));
                                    }
                                }}
                            />
                        </div>
                        {errors.amount && <p className="text-xs text-red-500 font-bold">{errors.amount.message}</p>}
                    </div>

                    {/* Category Input */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-500">Kategori</label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                {...register('category')}
                                className="w-full pl-9 p-3 font-bold border-2 border-black focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                            >
                                <option value="OPERATIONAL">Operasional (Bensin, Makan, dll)</option>
                                <option value="URGENT">Mendesak / Perbaikan Kecil</option>
                                <option value="STOCK">Pembelian Stok Dadakan</option>
                                <option value="OTHER">Lainnya</option>
                            </select>
                        </div>
                        {errors.category && <p className="text-xs text-red-500 font-bold">{errors.category.message}</p>}
                    </div>

                    {/* Description Input */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-500">Keterangan</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <textarea
                                {...register('description')}
                                className="w-full pl-9 p-3 font-medium border-2 border-black focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[80px]"
                                placeholder="Contoh: Beli bensin genset 5 liter"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 font-bold uppercase border-2 border-transparent hover:bg-gray-100 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 bg-red-600 text-white font-black py-3 uppercase hover:bg-red-700 border-2 border-transparent hover:border-black transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] hover:translate-x-0 hover:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

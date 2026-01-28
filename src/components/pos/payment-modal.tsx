"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Transaction } from "@/lib/constants";
import { NeoInput } from "@/components/ui/neo-input";
import { useVenue } from "@/lib/venue-context";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    totalAmount: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, totalAmount }) => {
    const { cart, processTransaction } = useAppStore();
    const { currentVenueId } = useVenue();
    const [paidAmount, setPaidAmount] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS" | "TRANSFER">("CASH");
    const [change, setChange] = useState(0);

    const [isTipEnabled, setIsTipEnabled] = useState(false);

    useEffect(() => {
        const numPaid = Number(paidAmount);
        setChange(numPaid - totalAmount);

        // Reset tip toggle if paid amount changes
        setIsTipEnabled(false);
    }, [paidAmount, totalAmount]);

    // Calculate effective total that will be recorded
    // If Tip is enabled, Total = Paid Amount (because change becomes tip)
    const effectiveTotal = isTipEnabled && change > 0 ? Number(paidAmount) : totalAmount;

    if (!isOpen) return null;

    const handleProcess = async () => {
        const numPaid = Number(paidAmount);

        if (!currentVenueId) {
            alert('Tidak ada venue yang dipilih');
            return;
        }

        try {
            // Include Tip Item if enabled
            let finalCart = [...cart];
            if (isTipEnabled && change > 0) {
                finalCart.push({
                    id: `tip-${Date.now()}`,
                    type: 'TIP',
                    name: 'Tip / Uang Pas',
                    price: change,
                    quantity: 1,
                    referenceId: 'tip'
                });
            }

            await processTransaction(currentVenueId, finalCart, numPaid, paymentMethod);
            onClose();

            // Trigger window print for receipt
            setTimeout(() => {
                window.print();
            }, 500);
        } catch (error) {
            console.error('Failed to process transaction:', error);
            alert('Gagal memproses transaksi. Silakan coba lagi.');
        }
    };

    const quickMoney = [5000, 10000, 20000, 50000, 100000];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center md:items-center p-0 md:p-4">
            <div className="bg-white border-t-2 border-x-2 md:border-2 border-black shadow-neo w-full max-w-sm flex flex-col max-h-[85dvh] md:max-h-[90vh]">
                <div className="bg-black text-white p-3 flex justify-between items-center border-b-2 border-black">
                    <h2 className="font-black text-sm uppercase">Pembayaran</h2>
                    <button onClick={onClose} className="hover:text-brand-orange font-bold text-sm">X</button>
                </div>

                <div className="p-4 flex flex-col gap-4 overflow-y-auto min-h-0 flex-1">
                    {/* Total Display */}
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Total Tagihan</div>
                        <div className="text-3xl font-black">Rp {totalAmount.toLocaleString()}</div>
                    </div>

                    {/* Payment Method */}
                    <div className="grid grid-cols-3 gap-2">
                        {(["CASH", "QRIS", "TRANSFER"] as const).map((method) => (
                            <button
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className={`border border-black p-1.5 font-bold text-[10px] uppercase transition-all ${paymentMethod === method
                                    ? "bg-black text-white"
                                    : "bg-white hover:bg-gray-100"
                                    }`}
                            >
                                {method}
                            </button>
                        ))}
                    </div>

                    {/* Amount Input */}
                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-[10px] uppercase">Jumlah Bayar</label>
                        <NeoInput
                            type="number"
                            placeholder="0"
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(e.target.value)}
                            className="text-right text-lg p-2 h-10"
                        />
                        <div className="flex gap-1.5 flex-wrap">
                            {quickMoney.map((amount) => (
                                <button
                                    key={amount}
                                    onClick={() => setPaidAmount(amount.toString())}
                                    className="border border-black px-2 py-1 text-[10px] font-bold bg-gray-50 hover:bg-white"
                                >
                                    {amount / 1000}k
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Change Display */}
                    <div className={`p-3 border-2 border-black ${change >= 0 ? 'bg-brand-lime' : 'bg-red-100'} transition-colors`}>
                        <div className="flex justify-between items-center">
                            <span className="font-bold uppercase text-[10px]">
                                {isTipEnabled ? 'Tip (Masuk ke Omzet)' : 'Kembalian'}
                            </span>
                            <span className={`font-black text-lg ${isTipEnabled ? 'text-brand-orange' : 'text-black'}`}>
                                Rp {change > 0 ? change.toLocaleString() : 0}
                            </span>
                        </div>

                        {/* Tip Toggle */}
                        {change > 0 && paymentMethod === 'CASH' && (
                            <div className="mt-2 pt-2 border-t border-black/20">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <div className={`w-4 h-4 border-2 border-black flex items-center justify-center transition-colors ${isTipEnabled ? 'bg-black' : 'bg-white'}`}>
                                        {isTipEnabled && <div className="w-2 h-2 bg-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={isTipEnabled}
                                        onChange={() => setIsTipEnabled(!isTipEnabled)}
                                    />
                                    <span className="text-[10px] font-bold uppercase hover:underline">
                                        Pelanggan tidak minta kembalian? (Jadikan Tip)
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-3 border-t-2 border-black bg-gray-50">
                    <button
                        onClick={handleProcess}
                        className="w-full bg-black text-white font-black py-3 text-sm uppercase hover:bg-brand-orange hover:text-black border-2 border-transparent hover:border-black transition-all"
                    >
                        Proses & Cetak
                    </button>
                </div>
            </div>
        </div>
    );
};

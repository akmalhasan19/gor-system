"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Transaction } from "@/lib/constants";
import { NeoInput } from "@/components/ui/neo-input";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    totalAmount: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, totalAmount }) => {
    const { cart, processTransaction } = useAppStore();
    const [paidAmount, setPaidAmount] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS" | "TRANSFER">("CASH");
    const [change, setChange] = useState(0);

    useEffect(() => {
        const numPaid = parseInt(paidAmount) || 0;
        setChange(numPaid - totalAmount);
    }, [paidAmount, totalAmount]);

    if (!isOpen) return null;

    const handleProcess = () => {
        const numPaid = parseInt(paidAmount) || 0;

        let status: Transaction['status'] = 'PENDING';
        if (numPaid >= totalAmount) {
            status = 'PAID';
        } else if (numPaid > 0) {
            status = 'PARTIAL';
        } else {
            status = 'UNPAID';
        }

        const transaction: Transaction = {
            id: `TRX-${Date.now()}`,
            date: new Date().toISOString(),
            items: [...cart],
            totalAmount,
            paidAmount: numPaid,
            changeAmount: numPaid >= totalAmount ? numPaid - totalAmount : 0,
            paymentMethod,
            status,
            cashierName: 'Admin' // Hardcoded for now
        };

        processTransaction(transaction);
        onClose();

        // Trigger window print for receipt
        setTimeout(() => {
            window.print();
        }, 500);
    };

    const quickMoney = [5000, 10000, 20000, 50000, 100000];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white border-4 border-black shadow-neo-lg w-full max-w-md flex flex-col max-h-[90vh]">
                <div className="bg-black text-white p-4 flex justify-between items-center border-b-4 border-black">
                    <h2 className="font-black text-xl uppercase">Pembayaran</h2>
                    <button onClick={onClose} className="hover:text-brand-orange font-bold">X</button>
                </div>

                <div className="p-6 flex flex-col gap-6 overflow-y-auto">
                    {/* Total Display */}
                    <div className="text-center">
                        <div className="text-sm font-bold text-gray-500 uppercase">Total Tagihan</div>
                        <div className="text-4xl font-black">Rp {totalAmount.toLocaleString()}</div>
                    </div>

                    {/* Payment Method */}
                    <div className="grid grid-cols-3 gap-2">
                        {(["CASH", "QRIS", "TRANSFER"] as const).map((method) => (
                            <button
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className={`border-2 border-black p-2 font-black text-sm uppercase transition-all ${paymentMethod === method
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
                        <label className="font-bold text-sm">Jumlah Bayar</label>
                        <NeoInput
                            type="number"
                            placeholder="0"
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(e.target.value)}
                            className="text-right text-xl"
                        />
                        <div className="flex gap-2 flex-wrap">
                            {quickMoney.map((amount) => (
                                <button
                                    key={amount}
                                    onClick={() => setPaidAmount(amount.toString())}
                                    className="border border-black px-2 py-1 text-xs font-bold bg-gray-100 hover:bg-white"
                                >
                                    {amount / 1000}k
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Change Display */}
                    <div className={`p-4 border-2 border-black ${change >= 0 ? 'bg-brand-lime' : 'bg-red-100'}`}>
                        <div className="flex justify-between items-center">
                            <span className="font-bold uppercase text-sm">Kembalian</span>
                            <span className="font-black text-xl">Rp {change > 0 ? change.toLocaleString() : 0}</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t-4 border-black bg-gray-50">
                    <button
                        onClick={handleProcess}
                        className="w-full bg-black text-white font-black py-4 text-xl uppercase hover:bg-brand-orange hover:text-black border-2 border-transparent hover:border-black transition-all"
                    >
                        Proses & Cetak
                    </button>
                </div>
            </div>
        </div>
    );
};

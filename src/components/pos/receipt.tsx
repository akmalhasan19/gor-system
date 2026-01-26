"use client";

import React from "react";
import { Transaction } from "@/lib/constants";

interface ReceiptProps {
    transaction: Transaction | null;
}

export const Receipt: React.FC<ReceiptProps> = ({ transaction }) => {
    if (!transaction) return null;

    return (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-0 m-0">
            {/* 58mm Width Container (approx 48mm printable area) */}
            <div className="w-[58mm] mx-auto font-mono text-[10px] leading-tight text-black">

                {/* Header */}
                <div className="text-center mb-2 border-b border-black pb-2 border-dashed">
                    <h1 className="font-bold text-sm uppercase">GOR JUARA</h1>
                    <div>Jl. Merdeka No. 45</div>
                    <div>Telp: 0812-3456-7890</div>
                </div>

                {/* Meta */}
                <div className="mb-2 flex flex-col gap-0.5">
                    <div className="flex justify-between">
                        <span>No:</span>
                        <span>{transaction.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tgl:</span>
                        <span>{new Date(transaction.date).toLocaleDateString()} {new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Kasir:</span>
                        <span>{transaction.cashierName}</span>
                    </div>
                </div>

                {/* Items */}
                <div className="mb-2 border-y border-black py-2 border-dashed">
                    {transaction.items.map((item, idx) => (
                        <div key={idx} className="mb-1 last:mb-0">
                            <div className="font-bold truncate">{item.name}</div>
                            <div className="flex justify-between">
                                <span>{item.quantity} x {item.price.toLocaleString()}</span>
                                <span>{(item.quantity * item.price).toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="flex flex-col gap-0.5 mb-2 font-bold">
                    <div className="flex justify-between text-xs">
                        <span>TOTAL</span>
                        <span>{transaction.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>BAYAR ({transaction.paymentMethod})</span>
                        <span>{transaction.paidAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>KEMBALI</span>
                        <span>{transaction.changeAmount.toLocaleString()}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center border-t border-black border-dashed pt-2 mt-4 text-[9px]">
                    <div>Terima Kasih</div>
                    <div>Selamat Berolahraga!</div>
                    <div className="mt-2">www.gor-juara.com</div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: 58mm auto; /* continuous roll */
                    }
                    body * {
                        visibility: hidden;
                    }
                    .print\\:block, .print\\:block * {
                        visibility: visible;
                    }
                    .print\\:block {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

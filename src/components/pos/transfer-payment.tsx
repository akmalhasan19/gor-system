"use client";

import React, { useState } from "react";

interface TransferPaymentProps {
    amount: number;
    onConfirm: () => void;
    onCancel: () => void;
}

export const TransferPayment: React.FC<TransferPaymentProps> = ({ amount, onConfirm, onCancel }) => {
    const [copied, setCopied] = useState(false);

    // Bank account details - can be configured per venue or in env
    const bankDetails = {
        bankName: "BCA",
        accountNumber: "1234567890",
        accountHolder: "SMASH PARTNER SYSTEM"
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-4 p-4">
            {/* Instructions */}
            <div className="text-center">
                <div className="text-xs font-bold text-gray-500 uppercase mb-1">Transfer ke rekening</div>
                <div className="text-lg font-black">{bankDetails.bankName}</div>
            </div>

            {/* Bank Account Details */}
            <div className="border-2 border-black bg-white p-4 space-y-3">
                {/* Bank Name */}
                <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Nama Bank</div>
                    <div className="text-lg font-black">{bankDetails.bankName}</div>
                </div>

                {/* Account Number */}
                <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Nomor Rekening</div>
                    <div className="flex items-center gap-2">
                        <div className="text-xl font-black tracking-wider">{bankDetails.accountNumber}</div>
                        <button
                            onClick={() => copyToClipboard(bankDetails.accountNumber)}
                            className="border border-black px-2 py-1 text-xs font-bold bg-gray-50 hover:bg-black hover:text-white transition-all"
                            title="Copy nomor rekening"
                        >
                            {copied ? "✓" : "📋"}
                        </button>
                    </div>
                </div>

                {/* Account Holder */}
                <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Atas Nama</div>
                    <div className="text-base font-bold">{bankDetails.accountHolder}</div>
                </div>
            </div>

            {/* Amount to Transfer */}
            <div className="border-2 border-black bg-brand-lime p-4">
                <div className="text-center">
                    <div className="text-xs font-bold text-gray-700 uppercase">Jumlah Transfer</div>
                    <div className="text-3xl font-black">Rp {amount.toLocaleString()}</div>
                    <button
                        onClick={() => copyToClipboard(amount.toString())}
                        className="mt-2 border border-black px-3 py-1 text-xs font-bold bg-white hover:bg-black hover:text-white transition-all"
                    >
                        {copied ? "✓ Tersalin" : "📋 Copy Nominal"}
                    </button>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                <p className="text-xs text-blue-800 font-semibold">
                    🏦 Lakukan transfer ke rekening di atas
                    <br />
                    💰 Pastikan nominal transfer sesuai
                    <br />
                    ✅ Setelah transfer berhasil, klik &quot;Konfirmasi&quot;
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={onCancel}
                    className="flex-1 border-2 border-black bg-white text-black font-bold py-3 text-sm uppercase hover:bg-gray-100 transition-all"
                >
                    Batal
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 bg-black text-white font-black py-3 text-sm uppercase hover:bg-brand-orange hover:text-black border-2 border-transparent hover:border-black transition-all"
                >
                    ✓ Konfirmasi Sudah Transfer
                </button>
            </div>
        </div>
    );
};

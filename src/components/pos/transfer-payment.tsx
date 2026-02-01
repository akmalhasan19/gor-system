"use client";

import React, { useState } from "react";

interface TransferPaymentProps {
    amount: number;
    onConfirm: () => void;
    onCancel: () => void;
}

export const TransferPayment: React.FC<TransferPaymentProps> = ({ amount, onConfirm, onCancel }) => {
    return (
        <div className="flex flex-col gap-4 p-4">
            {/* Amount to Transfer */}
            <div className="border-2 border-black bg-brand-lime p-4 text-center">
                <div className="text-xs font-bold text-gray-700 uppercase">Jumlah yang harus ditransfer</div>
                <div className="text-3xl font-black">Rp {amount.toLocaleString()}</div>
            </div>

            {/* Manual Transfer Instructions */}
            <div className="bg-gray-50 border-2 border-black p-6 text-center w-full shadow-neo flex flex-col items-center justify-center min-h-[200px] gap-2">
                <div className="bg-black text-white p-2 w-12 h-12 flex items-center justify-center font-black text-xl mb-2">TF</div>
                <h3 className="font-black uppercase text-lg">Pembayaran Transfer</h3>
                <p className="text-sm font-medium text-gray-600">
                    Silakan arahkan pelanggan untuk transfer ke <br />
                    <strong className="text-black">Rekening Operasional GOR</strong><br />
                    yang berlaku.
                </p>
            </div>

            {/* Instructions */}
            {/* Instructions - NEO-BRUTALIST STYLE */}
            <div className="bg-yellow-300 border-2 border-black p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative mt-2">
                <div className="absolute -top-3 -left-2 bg-black text-white px-2 py-0.5 text-xs font-black transform -rotate-2">
                    IMPORTANT
                </div>
                <p className="text-sm text-black font-bold uppercase leading-tight">
                    ⚠️ Pastikan notifikasi uang masuk sudah diterima (cek mutasi) sebelum konfirmasi.
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

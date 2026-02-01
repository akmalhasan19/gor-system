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
            <div className="bg-blue-50 border border-blue-200 p-3 rounded text-center">
                <p className="text-xs text-blue-800 font-semibold">
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

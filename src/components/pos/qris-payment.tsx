"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRISPaymentProps {
    amount: number;
    onConfirm: () => void;
    onCancel: () => void;
}

export const QRISPayment: React.FC<QRISPaymentProps> = ({ amount, onConfirm, onCancel }) => {
    // Generate QR code data - this could be a payment URL or encoded payment data
    // Format: Company.{amount}.{timestamp} - customize based on your QRIS provider
    const qrData = `QRIS.SMASH.${amount}.${Date.now()}`;

    return (
        <div className="flex flex-col gap-4 p-4 items-center">
            {/* Instructions */}
            <div className="text-center">
                <div className="text-xs font-bold text-gray-500 uppercase mb-1">Scan QR Code dengan aplikasi</div>
                <div className="text-lg font-black">QRIS / E-Wallet</div>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 border-4 border-black shadow-neo">
                <QRCodeSVG
                    value={qrData}
                    size={220}
                    level="H"
                    includeMargin={true}
                />
            </div>

            {/* Amount Display */}
            <div className="w-full border-2 border-black bg-brand-lime p-3 text-center">
                <div className="text-xs font-bold text-gray-700 uppercase">Total Pembayaran</div>
                <div className="text-2xl font-black">Rp {amount.toLocaleString()}</div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 p-3 rounded w-full">
                <p className="text-xs text-blue-800 font-semibold">
                    📱 Buka aplikasi e-wallet (GoPay, OVO, Dana, LinkAja, ShopeePay, dll)
                    <br />
                    📸 Scan QR code di atas
                    <br />
                    ✅ Setelah pembayaran berhasil, klik &quot;Konfirmasi&quot;
                </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex gap-2">
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
                    ✓ Konfirmasi Sudah Bayar
                </button>
            </div>
        </div>
    );
};

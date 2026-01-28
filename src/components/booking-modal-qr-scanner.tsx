"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, Loader2 } from "lucide-react";
import { validateMemberQRData, isSmashPartnerQR } from "@/lib/utils/qr-generator";
import { toast } from "sonner";

interface BookingModalQRScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (memberId: string) => void;
}

export const BookingModalQRScanner: React.FC<BookingModalQRScannerProps> = ({
    isOpen,
    onClose,
    onScan
}) => {
    const [isInitializing, setIsInitializing] = useState(true);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isScanning = useRef(false);

    useEffect(() => {
        if (isOpen) {
            initializeScanner();
        }

        return () => {
            stopScanner();
        };
    }, [isOpen]);

    const initializeScanner = async () => {
        setIsInitializing(true);
        setError(null);
        setHasPermission(null);

        try {
            // Create scanner instance
            const html5QrCode = new Html5Qrcode("qr-reader");
            scannerRef.current = html5QrCode;

            // Start scanning
            await html5QrCode.start(
                { facingMode: "environment" }, // Prefer back camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                async (decodedText) => {
                    // Prevent multiple triggers during validation
                    if (isScanning.current) return;

                    // Quick check if it's our QR format
                    if (!isSmashPartnerQR(decodedText)) {
                        toast.error("QR tidak valid");
                        return;
                    }

                    isScanning.current = true;

                    // Validate the QR data
                    const result = await validateMemberQRData(decodedText);

                    if (result.valid && result.memberId) {
                        toast.success("Member ditemukan!");
                        await stopScanner();
                        onScan(result.memberId);
                        onClose();
                    } else {
                        toast.error(result.error || "QR tidak valid");
                        isScanning.current = false;
                    }
                },
                (errorMessage) => {
                    // Ignore scan errors (expected when no QR in view)
                }
            );

            setHasPermission(true);
            setIsInitializing(false);
        } catch (err: any) {
            console.error("Scanner init error:", err);
            setIsInitializing(false);

            if (err.message?.includes("Permission")) {
                setHasPermission(false);
                setError("Akses kamera ditolak. Mohon izinkan akses kamera.");
            } else {
                setError("Gagal memulai kamera: " + (err.message || "Unknown error"));
            }
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (err) {
                // Ignore stop errors
            }
            scannerRef.current = null;
        }
        isScanning.current = false;
    };

    const handleClose = async () => {
        await stopScanner();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4">
            <div className="bg-white border-4 border-black w-full max-w-md flex flex-col shadow-[8px_8px_0px_black]">
                {/* Header */}
                <div className="bg-black text-white p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Camera size={20} />
                        <span className="font-black text-sm uppercase">Scan QR Member</span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="hover:text-brand-orange font-bold transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="p-4 flex flex-col items-center gap-4">
                    {isInitializing ? (
                        <div className="w-full aspect-square bg-gray-100 border-2 border-black flex flex-col items-center justify-center gap-2">
                            <Loader2 className="animate-spin" size={48} />
                            <span className="font-bold text-sm">Memulai kamera...</span>
                        </div>
                    ) : error ? (
                        <div className="w-full aspect-square bg-gray-100 border-2 border-black flex flex-col items-center justify-center gap-4 p-4">
                            <div className="text-center">
                                <span className="text-red-600 font-bold text-sm block">{error}</span>
                            </div>
                            <button
                                onClick={initializeScanner}
                                className="bg-black text-white px-4 py-2 font-bold text-sm uppercase hover:bg-brand-orange hover:text-black transition-all"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    ) : (
                        <>
                            <div
                                id="qr-reader"
                                className="w-full border-2 border-black overflow-hidden"
                                style={{ minHeight: '300px' }}
                            />
                            <div className="text-center">
                                <p className="font-bold text-sm uppercase">Arahkan kamera ke QR Member</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    QR akan otomatis terdeteksi
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t-2 border-black bg-gray-50">
                    <button
                        onClick={handleClose}
                        className="w-full bg-gray-200 text-black font-black py-3 text-sm uppercase hover:bg-gray-300 border-2 border-black transition-all"
                    >
                        Batal
                    </button>
                </div>
            </div>
        </div>
    );
};

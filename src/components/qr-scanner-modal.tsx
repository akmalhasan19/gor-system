"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { X, Camera, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { isSmashPartnerQR, validateMemberQRData } from "@/lib/utils/qr-generator";

interface QrScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose }) => {
    const router = useRouter();
    const [scanError, setScanError] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (!isOpen) {
            // Cleanup if closed
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
            return;
        }

        // Initialize scanner
        // Use a small timeout to ensure DOM is ready
        const timeoutId = setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true,
                    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
                },
                /* verbose= */ false
            );

            scanner.render(onScanSuccess, onScanFailure);
            scannerRef.current = scanner;
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
        };
    }, [isOpen]);

    const onScanSuccess = (decodedText: string, decodedResult: any) => {
        // Stop scanning
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
        }

        console.log("Scan result:", decodedText);

        // Check format
        // 1. Check if it's a URL like verify/{id}
        // 2. Check if it's a verification URL parameter

        let bookingId: string | null = null;

        try {
            if (decodedText.includes('/verify/')) {
                // Format: https://smashpartner.online/verify/{booking_id}
                const parts = decodedText.split('/verify/');
                if (parts.length > 1) {
                    bookingId = parts[1];
                }
            } else if (decodedText.includes('data=')) {
                // Legacy verify?data=... format
                // We might need to handle this if we support the old format too, 
                // but for this task we are focusing on the new booking verification.
                // If the user sets the new format to be URL based, we support that.
                // If it's the old format, we redirect to legacy verify page or handle it?
                // The new requirement says: "QR Code dari E-Ticket... bisa terbaca... diarahkan ke project ini"
                // My implementation plan created /verify/[id]
                // So I expect the QR to contain the URL or ID.
                // Let's assume the QR contains the full URL or just the ID.
            } else {
                // Assume it might be just the ID
                // Or legacy JSON format which we don't want unless it's for member checkin
            }

            // Fallback for simple ID if it looks like a UUID
            if (!bookingId && /^[0-9a-fA-F-]{36}$/.test(decodedText)) {
                bookingId = decodedText;
            }

            if (bookingId) {
                onClose(); // Close modal first
                toast.success("QR Code ditemukan!");
                router.push(`/verify/${bookingId}`);
            } else {
                // Try legacy/member check
                if (isSmashPartnerQR(decodedText)) {
                    // It's a member QR, maybe redirect to legacy verify page? 
                    // Or just show error "This is a member QR, not a booking ticket"
                    // For now, let's treat everything else as invalid for THIS ticket scanner?
                    // Or better: Redirect to generic verify handler?
                    // New requirement: "scan QR Code E-Ticket"
                    setScanError("Format QR Code tidak dikenali sebagai E-Ticket.");
                    // Resume scanning?
                    // Ideally yes, but for simplicity we pause.
                } else {
                    setScanError("QR Code tidak valid.");
                }
            }

        } catch (e) {
            setScanError("Gagal memproses QR Code.");
        }
    };

    const onScanFailure = (error: any) => {
        // Handle scan failure, usually better to ignore frame errors
        // console.warn(`Code scan error = ${error}`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-black text-white p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Camera size={20} />
                        <span className="font-bold uppercase tracking-wider">Scan Ticket</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="p-4 bg-neutral-900 relative min-h-[300px] flex flex-col items-center justify-center">
                    <div id="reader" className="w-full h-full overflow-hidden rounded-xl border-2 border-white/20"></div>

                    {/* Overlay Helper */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-64 h-64 border-2 border-brand-lime rounded-lg opacity-50 relative">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-brand-lime -mt-1 -ml-1"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-brand-lime -mt-1 -mr-1"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-brand-lime -mb-1 -ml-1"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-brand-lime -mb-1 -mr-1"></div>
                        </div>
                    </div>
                </div>

                {/* Footer / Status */}
                <div className="p-4 bg-white text-center">
                    {scanError ? (
                        <div className="flex items-center justify-center gap-2 text-red-500 font-bold text-sm animate-pulse">
                            <AlertCircle size={16} />
                            {scanError}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm font-medium">Arahkan kamera ke QR Code E-Ticket</p>
                    )}
                </div>
            </div>
        </div>
    );
};

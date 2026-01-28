"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Customer } from "@/lib/constants";
import { generateMemberQRCode, getTodayDate } from "@/lib/utils/qr-generator";
import { X, QrCode, Loader2, CheckCircle2, Sparkles } from "lucide-react";

interface QRDisplayProps {
    isOpen: boolean;
    onClose: () => void;
    member: Customer;
}

interface CheckInData {
    scanned_at: string;
    member_name: string;
}

export const QRDisplay: React.FC<QRDisplayProps> = ({ isOpen, onClose, member }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [checkInStatus, setCheckInStatus] = useState<'waiting' | 'confirmed'>('waiting');
    const [checkInData, setCheckInData] = useState<CheckInData | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const generateQR = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const qrUrl = await generateMemberQRCode(member.id, member.name);
            setQrCodeUrl(qrUrl);
        } catch (err) {
            console.error("Failed to generate QR:", err);
            setError("Gagal membuat QR code");
        } finally {
            setIsLoading(false);
        }
    }, [member.id, member.name]);

    const checkForScan = useCallback(async () => {
        try {
            const today = getTodayDate();
            const response = await fetch(`/api/public/qr-checkin?memberId=${member.id}&date=${today}`);
            const data = await response.json();

            if (data.found && data.checkIn) {
                setCheckInStatus('confirmed');
                setCheckInData(data.checkIn);
                // Stop polling once confirmed
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                }
            }
        } catch (err) {
            // Silent fail, continue polling
        }
    }, [member.id]);

    useEffect(() => {
        if (isOpen && member) {
            setCheckInStatus('waiting');
            setCheckInData(null);
            generateQR();

            // Start polling for check-in confirmation
            pollingRef.current = setInterval(checkForScan, 2000); // Poll every 2 seconds

            // Initial check
            checkForScan();
        }

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [isOpen, member, generateQR, checkForScan]);

    if (!isOpen) return null;

    const today = getTodayDate();
    const formattedDate = new Date(today).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // CONFIRMED STATE - Member has scanned
    if (checkInStatus === 'confirmed') {
        return (
            <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 border-4 border-black w-full max-w-xs flex flex-col shadow-[8px_8px_0px_black] max-h-[90vh] my-auto animate-in zoom-in duration-300">
                    {/* Header */}
                    <div className="bg-black text-white p-2 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={18} />
                            <span className="font-black text-sm uppercase">Check-In Berhasil!</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="hover:text-brand-orange font-bold transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Success Content */}
                    <div className="p-6 flex flex-col items-center gap-4 text-white text-center">
                        {/* Success Icon */}
                        <div className="relative">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border-4 border-white/50">
                                <CheckCircle2 size={48} className="text-white" />
                            </div>
                            <Sparkles className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" size={24} />
                        </div>

                        {/* Member Info */}
                        <div>
                            <h3 className="font-black text-2xl uppercase">{member.name}</h3>
                            <p className="text-white/80 text-sm mt-1">telah bermain pada</p>
                        </div>

                        {/* Date & Time */}
                        <div className="bg-white/20 backdrop-blur rounded-xl p-4 w-full">
                            <p className="font-black text-lg">{formattedDate}</p>
                            {checkInData?.scanned_at && (
                                <p className="text-white/80 text-sm mt-1">
                                    Pukul {formatTime(checkInData.scanned_at)}
                                </p>
                            )}
                        </div>

                        {/* Confirmation Message */}
                        <p className="text-sm text-white/70">
                            Member telah melakukan verifikasi QR
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // WAITING STATE - Show QR code
    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border-4 border-black w-full max-w-xs flex flex-col shadow-[8px_8px_0px_black] max-h-[90vh] my-auto">
                {/* Header */}
                <div className="bg-black text-white p-2 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <QrCode size={18} />
                        <span className="font-black text-sm uppercase">QR Member</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="hover:text-brand-orange font-bold transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-4 flex flex-col items-center gap-3 overflow-y-auto">
                    {/* Member Photo & Name */}
                    <div className="flex flex-col items-center gap-1">
                        {member.photo_url ? (
                            <div className="w-12 h-12 rounded-full border-2 border-black overflow-hidden">
                                <img
                                    src={member.photo_url}
                                    alt={member.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-full border-2 border-black bg-gray-100 flex items-center justify-center">
                                <span className="text-xl font-black text-gray-400">
                                    {member.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <h3 className="font-black text-base uppercase text-center">{member.name}</h3>
                    </div>

                    {/* QR Code - Responsive size */}
                    <div className="bg-white p-2 border-2 border-black">
                        {isLoading ? (
                            <div className="w-[200px] h-[200px] flex items-center justify-center">
                                <Loader2 className="animate-spin" size={40} />
                            </div>
                        ) : error ? (
                            <div className="w-[200px] h-[200px] flex flex-col items-center justify-center gap-2">
                                <span className="text-red-600 font-bold text-sm">{error}</span>
                                <button
                                    onClick={generateQR}
                                    className="bg-black text-white px-4 py-2 font-bold text-sm uppercase hover:bg-brand-orange hover:text-black transition-all"
                                >
                                    Coba Lagi
                                </button>
                            </div>
                        ) : qrCodeUrl ? (
                            <img
                                src={qrCodeUrl}
                                alt="Member QR Code"
                                className="w-[200px] h-[200px]"
                            />
                        ) : null}
                    </div>

                    {/* Validity Info */}
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Berlaku untuk</p>
                        <p className="font-black text-sm">{formattedDate}</p>
                        <p className="text-[10px] text-gray-500">(Hingga pukul 23:59)</p>
                    </div>

                    {/* Instruction */}
                    <div className="bg-brand-lime/20 border-2 border-brand-lime p-2 w-full text-center">
                        <p className="font-black text-xs uppercase text-brand-lime">
                            📱 Tampilkan QR ini ke Kasir
                        </p>
                        <p className="text-[10px] text-gray-600 mt-0.5">
                            Kasir akan scan QR saat check-in booking
                        </p>
                    </div>

                    {/* Waiting indicator */}
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <Loader2 className="animate-spin" size={12} />
                        <span>Menunggu member scan QR...</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


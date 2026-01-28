"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Customer } from "@/lib/constants";
import { generateMemberQRCode, getTodayDate } from "@/lib/utils/qr-generator";
import { X, QrCode, Loader2, Check, Sparkles, Clock, Calendar } from "lucide-react";
import { Space_Grotesk, Syne } from 'next/font/google';

// Load fonts
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });
const syne = Syne({ subsets: ['latin'], variable: '--font-syne' });

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
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                }
            }
        } catch (err) {
            // Silent fail
        }
    }, [member.id]);

    useEffect(() => {
        if (isOpen && member) {
            setCheckInStatus('waiting');
            setCheckInData(null);
            generateQR();
            pollingRef.current = setInterval(checkForScan, 2000);
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

    return (
        <div className={`fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 overflow-y-auto font-sans ${spaceGrotesk.variable} ${syne.variable}`} style={{ fontFamily: 'var(--font-space)' }}>

            {/* CONFIRMED STATE */}
            {checkInStatus === 'confirmed' ? (
                <div className="bg-white border-2 border-black w-full max-w-sm flex flex-col shadow-[8px_8px_0px_0px_#D1F26D] rounded-[2rem] overflow-hidden animate-in zoom-in duration-300">

                    {/* Header Banner */}
                    <div className="bg-black p-6 pb-8 relative overflow-hidden text-center">
                        <div className="absolute inset-0 opacity-20"
                            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #D1F26D 0, #D1F26D 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-16 h-16 bg-[#D1F26D] rounded-full border-2 border-white flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(209,242,109,0.4)]">
                                <Check className="w-8 h-8 text-black stroke-[4]" />
                            </div>
                            <h2 className="text-3xl font-black uppercase text-white leading-none tracking-tight" style={{ fontFamily: 'var(--font-syne)' }}>
                                Check-In<br />Berhasil!
                            </h2>
                        </div>

                        {/* Jagged Divider */}
                        <div className="absolute -bottom-1 left-0 w-full h-4 bg-white" style={{ clipPath: 'polygon(0 100%, 5% 0, 10% 100%, 15% 0, 20% 100%, 25% 0, 30% 100%, 35% 0, 40% 100%, 45% 0, 50% 100%, 55% 0, 60% 100%, 65% 0, 70% 100%, 75% 0, 80% 100%, 85% 0, 90% 100%, 95% 0, 100% 100%)' }}></div>
                    </div>

                    {/* Member Info */}
                    <div className="p-6 pt-4 text-center">
                        <div className="mb-6">
                            <p className="font-mono text-[10px] uppercase text-gray-500 mb-1">Authenticated Member</p>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-neutral-900" style={{ fontFamily: 'var(--font-syne)' }}>
                                {member.name}
                            </h3>
                        </div>

                        {/* Ticket Info */}
                        <div className="bg-[#f0f0f0] border-2 border-black rounded-xl p-3 flex justify-between items-center shadow-[2px_2px_0px_0px_#000000] relative">
                            {/* Punch holes */}
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-r-2 border-black rounded-full"></div>
                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-l-2 border-black rounded-full"></div>

                            <div className="flex flex-col text-left">
                                <span className="text-[10px] font-bold uppercase text-gray-500">Tanggal</span>
                                <span className="font-bold text-xs uppercase text-black">{formattedDate}</span>
                            </div>

                            <div className="h-6 w-[2px] bg-gray-300"></div>

                            <div className="flex flex-col text-right">
                                <span className="text-[10px] font-bold uppercase text-gray-500">Pukul</span>
                                <span className="font-bold text-xs uppercase text-black">
                                    {checkInData?.scanned_at ? formatTime(checkInData.scanned_at) : '--:--'}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="mt-6 w-full py-3 bg-black text-white font-bold uppercase text-sm rounded-xl hover:bg-neutral-800 transition-colors shadow-[4px_4px_0px_0px_#D1F26D]"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            ) : (
                /* WAITING STATE */
                <div className="bg-white border-2 border-black w-full max-w-sm flex flex-col shadow-[8px_8px_0px_0px_#000000] rounded-[2rem] overflow-hidden">

                    {/* Header */}
                    <div className="bg-[#FCD34D] p-4 flex justify-between items-center border-b-2 border-black">
                        <div className="flex items-center gap-2">
                            <div className="bg-black p-1.5 rounded-md">
                                <QrCode size={16} className="text-white" />
                            </div>
                            <span className="font-black text-sm uppercase tracking-wide">Scan Member QR</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black rounded-full hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_#000000]"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="p-6 flex flex-col items-center bg-[#fafafa]">

                        {/* Member Badge */}
                        <div className="flex items-center gap-3 mb-6 bg-white pl-2 pr-4 py-2 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_#000000]">
                            {member.photo_url ? (
                                <img src={member.photo_url} alt={member.name} className="w-8 h-8 rounded-full border border-black object-cover" />
                            ) : (
                                <div className="w-8 h-8 rounded-full border border-black bg-neutral-200 flex items-center justify-center font-black text-xs">
                                    {member.name.charAt(0)}
                                </div>
                            )}
                            <span className="font-bold text-sm uppercase truncate max-w-[150px]">{member.name}</span>
                        </div>

                        {/* QR Code Box */}
                        <div className="relative bg-white p-4 border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000000] mb-6">
                            {/* Corner Decors */}
                            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-4 border-l-4 border-black"></div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-4 border-r-4 border-black"></div>
                            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-4 border-l-4 border-black"></div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-4 border-r-4 border-black"></div>

                            {isLoading ? (
                                <div className="w-[180px] h-[180px] flex items-center justify-center">
                                    <Loader2 className="animate-spin text-black" size={40} />
                                </div>
                            ) : error ? (
                                <div className="w-[180px] h-[180px] flex flex-col items-center justify-center gap-2">
                                    <span className="text-red-600 font-bold text-xs text-center">{error}</span>
                                    <button onClick={generateQR} className="text-xs underline font-bold">Try Again</button>
                                </div>
                            ) : qrCodeUrl ? (
                                <img src={qrCodeUrl} alt="QR Code" className="w-[180px] h-[180px]" />
                            ) : null}
                        </div>

                        {/* Status Indicator */}
                        <div className="w-full bg-black/5 rounded-xl p-3 flex items-center justify-center gap-2 mb-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                            </span>
                            <span className="text-xs font-bold text-black/60 uppercase tracking-wide">Menunggu Scan...</span>
                        </div>

                        <p className="text-[10px] text-gray-400 text-center max-w-[200px]">
                            Arahkan member untuk scan QR Code di atas menggunakan kamera HP mereka.
                        </p>
                    </div>

                    {/* Footer decoration */}
                    <div className="h-2 bg-black w-full flex">
                        <div className="h-full w-1/4 bg-[#C084FC]"></div>
                        <div className="h-full w-1/4 bg-[#D1F26D]"></div>
                        <div className="h-full w-1/4 bg-[#FCD34D]"></div>
                        <div className="h-full w-1/4 bg-[#F87171]"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

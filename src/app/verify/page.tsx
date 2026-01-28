"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { validateMemberQRData, getTodayDate } from "@/lib/utils/qr-generator";
import { Check, X, AlertTriangle, Loader2, Calendar, Clock, Zap } from "lucide-react";
import { GridBackground } from "@/components/ui/grid-background";
import { Space_Grotesk, Syne } from 'next/font/google';

// Load fonts
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });
const syne = Syne({ subsets: ['latin'], variable: '--font-syne' });

// Wrap in Suspense boundary for useSearchParams
export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-neutral-50"><Loader2 className="animate-spin" size={48} /></div>}>
            <div className={`${spaceGrotesk.variable} ${syne.variable}`} style={{ fontFamily: 'var(--font-space)' }}>
                <VerifyContent />
            </div>
        </Suspense>
    );
}

function VerifyContent() {
    const searchParams = useSearchParams();
    const dataToken = searchParams.get('data');

    const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired'>('loading');
    const [memberData, setMemberData] = useState<{ name: string; memberId: string } | null>(null);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!dataToken) {
            setStatus('invalid');
            setErrorMsg("QR Code tidak ditemukan.");
            return;
        }

        const verify = async () => {
            setStatus('loading');
            try {
                const result = await validateMemberQRData(dataToken);

                if (result.valid && result.payload) {
                    setStatus('valid');
                    setMemberData({
                        name: result.payload.name || "Member",
                        memberId: result.payload.memberId
                    });

                    // Record check-in event for operator notification
                    try {
                        await fetch('/api/public/qr-checkin', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                memberId: result.payload.memberId,
                                memberName: result.payload.name,
                                date: getTodayDate()
                            })
                        });
                    } catch (e) {
                        // Non-blocking, just for operator notification
                        console.log('Check-in recording skipped');
                    }
                } else {
                    if (result.error && result.error.includes("kadaluarsa")) {
                        setStatus('expired');
                        if (result.payload) {
                            setMemberData({
                                name: result.payload.name || "Member",
                                memberId: result.payload.memberId
                            });
                        }
                    } else {
                        setStatus('invalid');
                    }
                    setErrorMsg(result.error || "Verification failed");
                }
            } catch (err) {
                setStatus('invalid');
                setErrorMsg("Terjadi kesalahan sistem");
            }
        };

        verify();
    }, [dataToken]);

    const getTodayFormatted = () => {
        return new Date().toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).toUpperCase();
    };

    const getTimeFormatted = () => {
        return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="relative w-full min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-slate-50 font-sans">
            <GridBackground />

            {/* Decorative Floating Shapes */}
            <div className="absolute top-10 left-10 w-24 h-24 bg-[#D1F26D] rounded-full border-2 border-black mix-blend-multiply animate-bounce hidden md:block opacity-60 duration-[3000ms]"></div>
            <div className="absolute bottom-20 right-10 w-32 h-32 bg-[#C084FC] rounded-full border-2 border-black mix-blend-multiply animate-pulse hidden md:block opacity-60 duration-[4000ms]"></div>

            {/* Main Card Container */}
            <div className="relative z-10 w-full max-w-md perspective-1000">

                {/* Loading State */}
                {status === 'loading' && (
                    <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] rounded-3xl p-12 text-center animate-pulse">
                        <Loader2 className="w-16 h-16 mx-auto mb-6 text-black animate-spin" />
                        <h2 className="text-2xl font-black uppercase tracking-tighter" style={{ fontFamily: 'var(--font-syne)' }}>Verifying...</h2>
                        <p className="font-mono text-sm mt-2 text-gray-500">Scanning mainframe</p>
                    </div>
                )}

                {/* Valid State */}
                {status === 'valid' && memberData && (
                    <div className="transform transition-all duration-500 hover:-translate-y-1">
                        {/* Success Header Badge */}
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                            <div className="bg-[#D1F26D] px-6 py-2 border-2 border-black shadow-[2px_2px_0px_0px_#000000] rounded-full flex items-center gap-2">
                                <Check className="w-5 h-5 stroke-[3]" />
                                <span className="font-black uppercase tracking-widest text-sm">Access Granted</span>
                            </div>
                        </div>

                        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000000] rounded-[2.5rem] overflow-hidden flex flex-col">

                            {/* Top Section - Visual */}
                            <div className="bg-black text-[#D1F26D] p-8 pb-12 relative overflow-hidden text-center">
                                {/* Abstract BG Lines */}
                                <div className="absolute inset-0 opacity-20"
                                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, #D1F26D 0, #D1F26D 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}>
                                </div>

                                <div className="relative z-10">
                                    <div className="w-24 h-24 mx-auto bg-[#D1F26D] rounded-full border-2 border-[#D1F26D] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(209,242,109,0.5)]">
                                        <Check className="w-14 h-14 text-black stroke-[4]" />
                                    </div>
                                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white" style={{ fontFamily: 'var(--font-syne)' }}>
                                        You&apos;re In!
                                    </h1>
                                </div>

                                {/* Jagged Divider */}
                                <div className="absolute -bottom-1 left-0 w-full h-6 bg-white" style={{ clipPath: 'polygon(0 100%, 5% 0, 10% 100%, 15% 0, 20% 100%, 25% 0, 30% 100%, 35% 0, 40% 100%, 45% 0, 50% 100%, 55% 0, 60% 100%, 65% 0, 70% 100%, 75% 0, 80% 100%, 85% 0, 90% 100%, 95% 0, 100% 100%)' }}></div>
                            </div>

                            {/* Bottom Section - Details */}
                            <div className="p-8 pt-6 bg-white">
                                <div className="text-center mb-8">
                                    <p className="font-mono text-xs uppercase text-gray-500 mb-1">Player Name</p>
                                    <h2 className="text-3xl font-black uppercase tracking-tight text-neutral-900 break-words" style={{ fontFamily: 'var(--font-syne)' }}>
                                        {memberData.name}
                                    </h2>
                                </div>

                                {/* Ticket Details Box */}
                                <div className="bg-[#f0f0f0] border-2 border-black rounded-xl p-4 flex justify-between items-center shadow-[2px_2px_0px_0px_#000000] mb-6 relative">
                                    {/* Punch holes */}
                                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-r-2 border-black rounded-full"></div>
                                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-l-2 border-black rounded-full"></div>

                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1">
                                            <Calendar size={10} /> Date
                                        </span>
                                        <span className="font-bold text-sm uppercase">{getTodayFormatted()}</span>
                                    </div>
                                    <div className="h-8 w-[2px] bg-gray-300"></div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1 justify-end">
                                            Time <Clock size={10} />
                                        </span>
                                        <span className="font-bold text-sm uppercase">{getTimeFormatted()}</span>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <p className="text-xs font-bold font-mono text-black/40 uppercase tracking-widest">
                                        Smash Partner System Verified
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Expired State */}
                {status === 'expired' && (
                    <div className="transform transition-all duration-500">
                        {/* Warning Header Badge */}
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                            <div className="bg-[#FCD34D] px-6 py-2 border-2 border-black shadow-[2px_2px_0px_0px_#000000] rounded-full flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 stroke-[3]" />
                                <span className="font-black uppercase tracking-widest text-sm">Expired</span>
                            </div>
                        </div>

                        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000000] rounded-[2.5rem] overflow-hidden">
                            <div className="bg-neutral-100 p-8 pb-10 text-center border-b-2 border-black border-dashed relative">
                                <div className="w-20 h-20 mx-auto bg-[#FCD34D] rounded-full border-2 border-black flex items-center justify-center mb-4">
                                    <Clock className="w-10 h-10 text-black stroke-[3]" />
                                </div>
                                <h1 className="text-3xl font-black uppercase text-neutral-800" style={{ fontFamily: 'var(--font-syne)' }}>
                                    Session Ended
                                </h1>
                                <p className="font-medium text-neutral-500 mt-2 max-w-[200px] mx-auto leading-tight">
                                    This QR Code was for a previous session.
                                </p>
                            </div>

                            <div className="p-8 bg-white relative">
                                {/* Sticker Effect */}
                                {memberData && (
                                    <div className="absolute top-[-20px] right-6 rotate-6 bg-white border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_#000000] z-10">
                                        <span className="font-black text-xs uppercase">{memberData.name}</span>
                                    </div>
                                )}

                                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
                                    <p className="text-red-600 font-bold text-sm">Please request a new code from the front desk.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Invalid State */}
                {status === 'invalid' && (
                    <div className="transform transition-all duration-500">
                        {/* Error Header Badge */}
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                            <div className="bg-[#F87171] px-6 py-2 border-2 border-black shadow-[2px_2px_0px_0px_#000000] rounded-full flex items-center gap-2">
                                <X className="w-5 h-5 stroke-[3] text-white" />
                                <span className="font-black uppercase tracking-widest text-sm text-white">Invalid</span>
                            </div>
                        </div>

                        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000000] rounded-[2.5rem] overflow-hidden">
                            <div className="bg-black p-10 text-center relative overflow-hidden">
                                {/* Glitch Effect simulated with CSS gradients */}
                                <div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,0,0,0.5) 50%, transparent 100%)' }}></div>

                                <div className="w-24 h-24 mx-auto bg-[#F87171] rounded-full border-2 border-white flex items-center justify-center mb-6 relative z-10">
                                    <X className="w-14 h-14 text-white stroke-[4]" />
                                </div>
                                <h1 className="text-4xl font-black uppercase text-white tracking-widest relative z-10" style={{ fontFamily: 'var(--font-syne)' }}>
                                    ERROR
                                </h1>
                            </div>

                            <div className="p-8 bg-white text-center">
                                <p className="font-bold text-lg text-neutral-800 mb-2">QR Code Not Recognized</p>
                                <p className="text-sm text-gray-500 mb-6">{errorMsg || "The data provided is invalid or corrupted."}</p>

                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full py-3 bg-neutral-200 border-2 border-black rounded-xl font-bold uppercase hover:bg-neutral-300 transition-colors shadow-[2px_2px_0px_0px_#000000]"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Brand Footer */}
            <div className="mt-12 opacity-50 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-xs" style={{ fontFamily: 'var(--font-syne)' }}>
                    <Zap size={14} className="fill-black" />
                    <span>Smash Partner</span>
                </div>
            </div>
        </div>
    );
}

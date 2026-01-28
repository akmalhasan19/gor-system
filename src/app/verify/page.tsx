"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { validateMemberQRData, getTodayDate } from "@/lib/utils/qr-generator";
import { CheckCircle2, XCircle, Loader2, AlertCircle, Sparkles } from "lucide-react";

// Wrap in Suspense boundary for useSearchParams
export default function VerifyPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <VerifyContent />
        </Suspense>
    );
}

function LoadingScreen() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600">
            <div className="text-center text-white">
                <Loader2 className="animate-spin mx-auto mb-4" size={48} />
                <p className="font-bold animate-pulse">Memverifikasi...</p>
            </div>
        </div>
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

    const getTodayDateFormatted = () => {
        return new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // VALID - Success screen with friendly message
    if (status === 'valid' && memberData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 flex flex-col items-center justify-center p-6 font-sans">
                <div className="w-full max-w-sm text-center text-white animate-in fade-in zoom-in duration-500">
                    {/* Success Icon */}
                    <div className="relative inline-block mb-6">
                        <div className="w-28 h-28 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto border-4 border-white/50">
                            <CheckCircle2 size={64} className="text-white" />
                        </div>
                        <Sparkles className="absolute -top-2 -right-2 text-yellow-300 animate-pulse" size={28} />
                    </div>

                    {/* Greeting */}
                    <p className="text-lg font-medium text-white/80 mb-1">Hai,</p>
                    <h1 className="text-4xl font-black uppercase tracking-tight mb-4">{memberData.name}!</h1>

                    {/* Main Message - Customizable per venue in future */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/30">
                        <p className="text-2xl font-bold leading-relaxed">
                            🏸 Selamat Bermain Hari Ini!
                        </p>
                        <p className="text-white/90 text-sm mt-3">
                            Senang bertemu kamu lagi di lapangan
                        </p>
                    </div>

                    {/* Date Info */}
                    <div className="bg-white/10 rounded-xl py-3 px-4 inline-block">
                        <p className="text-xs font-medium text-white/70 uppercase tracking-wider">Valid Hari Ini</p>
                        <p className="font-bold text-sm">{getTodayDateFormatted()}</p>
                    </div>

                    {/* Footer */}
                    <p className="text-xs text-white/50 mt-8">
                        Powered by Smash Partner System
                    </p>
                </div>
            </div>
        );
    }

    // EXPIRED - QR has expired
    if (status === 'expired') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 flex flex-col items-center justify-center p-6 font-sans">
                <div className="w-full max-w-sm text-center text-white animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white/50">
                        <AlertCircle size={56} />
                    </div>

                    <h1 className="text-3xl font-black uppercase mb-2">QR Kadaluarsa</h1>
                    {memberData && <p className="text-xl font-medium mb-4">{memberData.name}</p>}

                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-6">
                        <p className="text-sm">
                            QR code ini hanya berlaku untuk satu hari.<br />
                            Silakan minta QR code baru dari petugas.
                        </p>
                    </div>

                    <p className="text-xs text-white/60">Smash Partner System</p>
                </div>
            </div>
        );
    }

    // INVALID - QR is not valid
    if (status === 'invalid') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 flex flex-col items-center justify-center p-6 font-sans">
                <div className="w-full max-w-sm text-center text-white animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white/50">
                        <XCircle size={56} />
                    </div>

                    <h1 className="text-3xl font-black uppercase mb-4">QR Tidak Valid</h1>

                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-6">
                        <p className="text-sm">
                            {errorMsg || "QR code tidak dapat diverifikasi."}
                        </p>
                    </div>

                    <p className="text-xs text-white/60">Smash Partner System</p>
                </div>
            </div>
        );
    }

    // LOADING
    return <LoadingScreen />;
}

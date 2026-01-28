"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { validateMemberQRData } from "@/lib/utils/qr-generator";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

// Wrap in Suspense boundary for useSearchParams
export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#FDFBF7]"><Loader2 className="animate-spin" size={48} /></div>}>
            <VerifyContent />
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
            setErrorMsg("No QR data found.");
            return;
        }

        const verify = async () => {
            try {
                // validateMemberQRData handles base64 tokens directly too (logic added in recent update)
                const result = await validateMemberQRData(dataToken);

                if (result.valid && result.payload) {
                    setStatus('valid');
                    setMemberData({
                        name: result.payload.name || "Member",
                        memberId: result.payload.memberId
                    });
                } else {
                    if (result.error && result.error.includes("kadaluarsa")) {
                        setStatus('expired');
                        // Use payload if available even if expired, to show who it was
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
                setErrorMsg("System error during verification");
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

    // Using inline styles for colors similar to global theme where tailwind classes might vary slightly
    // bg-brand-cream replacement: bg-[#FDFBF7]
    // bg-brand-lime replacement: bg-[#D4F46A]

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_black] p-6 text-center">

                {/* Logo / Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter">SMASH PARTNER</h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Official Member Verification</p>
                </div>

                {/* Content based on Status */}
                {status === 'loading' && (
                    <div className="py-12 flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-black" size={48} />
                        <p className="font-bold animate-pulse">Verifying QR Code...</p>
                    </div>
                )}

                {status === 'valid' && memberData && (
                    <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center border-4 border-black mb-2 relative">
                            <CheckCircle2 size={56} className="text-green-600" />
                            <div className="absolute -bottom-2 bg-black text-white px-3 py-1 text-xs font-black uppercase rounded-full">
                                Verified
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase">Selamat Datang</p>
                            <h2 className="text-3xl font-black uppercase leading-none mt-1">{memberData.name}</h2>
                            <p className="text-xs font-mono bg-gray-100 px-2 py-1 mt-2 inline-block rounded border border-gray-300">ID: {memberData.memberId}</p>
                        </div>

                        <div className="w-full bg-green-50 border-2 border-green-600 p-4 mt-2">
                            <p className="font-bold text-green-800 text-sm uppercase">Status Member: AKTIF</p>
                            <p className="text-xs font-bold mt-1 text-green-700">Valid untuk hari ini:</p>
                            <p className="font-black text-lg text-green-900">{getTodayDateFormatted()}</p>
                        </div>

                        <p className="text-xs text-gray-400 mt-4 max-w-[250px]">
                            Tunjukkan halaman ini ke petugas jika diperlukan verifikasi manual.
                        </p>
                    </div>
                )}

                {status === 'expired' && (
                    <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center border-4 border-black mb-2">
                            <AlertCircle size={56} className="text-[#FF9F1C]" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-black uppercase text-red-600">QR KADALUARSA</h2>
                            {memberData && <p className="font-bold text-lg mt-1">{memberData.name}</p>}
                        </div>

                        <div className="w-full bg-red-50 border-2 border-red-600 p-4 mt-2">
                            <p className="text-xs font-bold text-red-800 uppercase">{errorMsg}</p>
                            <p className="text-xs mt-2">Silakan generate QR Code baru di aplikasi untuk hari ini.</p>
                        </div>
                    </div>
                )}

                {status === 'invalid' && (
                    <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center border-4 border-black mb-2">
                            <XCircle size={56} className="text-red-600" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-black uppercase text-red-600">QR TIDAK VALID</h2>
                        </div>

                        <div className="w-full bg-gray-100 border-2 border-gray-300 p-4 mt-2">
                            <p className="text-xs font-bold text-gray-500 uppercase">Error Details</p>
                            <p className="text-sm font-bold text-red-500 mt-1">{errorMsg}</p>
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-4 border-t-2 border-dashed border-gray-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Smash Partner System &copy; 2026</p>
                </div>
            </div>
        </div>
    );
}

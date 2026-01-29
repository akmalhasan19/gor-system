"use client";

import { WifiOff, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100 text-center">
            <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full flex flex-col items-center gap-6 relative overflow-hidden">

                {/* Decorative Background Element */}
                <div className="absolute top-0 left-0 w-full h-2 bg-brand-orange border-b-2 border-black"></div>

                {/* Icon */}
                <div className="w-24 h-24 bg-brand-orange border-2 border-black flex items-center justify-center animate-pulse rounded-full">
                    <WifiOff size={48} className="text-white" strokeWidth={3} />
                </div>

                {/* Text */}
                <div className="flex flex-col gap-2 z-10">
                    <h1 className="text-5xl font-black font-sans tracking-tighter text-brand-orange">OFFLINE!</h1>
                    <h2 className="text-lg font-bold uppercase bg-black text-white px-2 py-1 inline-block">
                        Koneksi Terputus
                    </h2>
                    <p className="text-gray-600 font-medium mt-2 text-sm">
                        Anda sedang offline. Periksa koneksi internet Anda dan coba lagi.
                        <br />
                        <span className="font-bold text-black mt-2 inline-block">
                            Data akan otomatis tersinkronisasi saat koneksi kembali.
                        </span>
                    </p>
                </div>

                {/* Helpful Tips */}
                <div className="w-full bg-gray-50 border-2 border-black p-4 text-left">
                    <h3 className="font-bold text-sm mb-2 uppercase">💡 Tips:</h3>
                    <ul className="text-xs text-gray-700 space-y-1">
                        <li>• Periksa WiFi atau data seluler Anda</li>
                        <li>• Pastikan mode pesawat tidak aktif</li>
                        <li>• Coba refresh halaman setelah koneksi kembali</li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex-1 flex items-center justify-center gap-2 bg-brand-lime px-6 py-3 border-2 border-black font-black uppercase tracking-wider hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                        <RefreshCcw size={20} />
                        Coba Lagi
                    </button>

                    <Link
                        href="/"
                        className="flex-1 flex items-center justify-center gap-2 bg-white px-6 py-3 border-2 border-black font-black uppercase tracking-wider hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                        <Home size={20} />
                        Home
                    </Link>
                </div>

                {/* Branding */}
                <div className="mt-4 text-xs text-gray-500">
                    <p className="font-bold">Smash Partner GOR Management</p>
                    <p>Sistem akan kembali normal saat online</p>
                </div>
            </div>
        </div>
    );
}

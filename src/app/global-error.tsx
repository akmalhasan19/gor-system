"use client";

import { AlertOctagon, RotateCcw } from "lucide-react";
import { Syne, Space_Grotesk } from "next/font/google"; // Import fonts to ensure style consistency
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });
const syne = Syne({ subsets: ['latin'], variable: '--font-syne' });

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="id">
            <body className={`min-h-screen bg-red-50 flex items-center justify-center font-sans ${spaceGrotesk.variable} ${syne.variable}`}>
                <div className="p-4 w-full max-w-lg">
                    <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-10 flex flex-col items-center gap-8 text-center">

                        <div className="flex flex-col items-center gap-4">
                            <AlertOctagon size={80} className="text-red-600" strokeWidth={2.5} />
                            <h1 className="text-6xl font-black font-sans uppercase tracking-tighter">CRASH!</h1>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xl font-bold">Sistem mengalami error fatal.</p>
                            <p className="text-gray-600">
                                Mohon maaf, terjadi kesalahan yang tidak bisa ditangani oleh wasit.
                                Silakan refresh halaman total.
                            </p>
                            {error.digest && (
                                <div className="font-mono text-xs bg-gray-100 p-2 border border-black">
                                    Error Digest: {error.digest}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => reset()}
                            className="w-full flex justify-center items-center gap-3 bg-black text-white px-8 py-4 font-black uppercase tracking-widest hover:bg-red-600 transition-colors border-2 border-transparent hover:border-black"
                        >
                            <RotateCcw size={24} />
                            Reset Pertandingan
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}

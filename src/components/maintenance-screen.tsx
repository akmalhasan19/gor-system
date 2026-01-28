"use client";

import { HardHat, Hammer, Construction } from "lucide-react";

export const MaintenanceScreen = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-yellow-400 text-center font-sans">
            <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-10 max-w-lg w-full flex flex-col items-center gap-8 relative overflow-hidden">

                {/* Construction Tape Effect */}
                <div className="absolute top-4 -left-10 w-[120%] h-8 bg-black text-yellow-400 flex items-center justify-center font-black uppercase text-xs tracking-widest transform -rotate-6 border-y-2 border-white z-0">
                    Maintenance &nbsp; • &nbsp; Maintenance &nbsp; • &nbsp; Maintenance &nbsp; • &nbsp; Maintenance
                </div>

                <div className="relative z-10 flex flex-col items-center gap-6 mt-8">
                    <div className="flex gap-4">
                        <Construction size={48} className="text-black animate-bounce" />
                        <Hammer size={48} className="text-black animate-pulse" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-black">
                            UNDER<br />CONSTRUCTION
                        </h1>
                        <div className="bg-black text-white px-4 py-2 text-xl font-bold uppercase transform -rotate-2 inline-block shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                            Sedang Perbaikan
                        </div>
                    </div>

                    <p className="text-gray-800 font-bold text-lg max-w-xs leading-relaxed">
                        Lapangan sedang dipoles agar lebih kinclong.
                        Silakan kembali beberapa saat lagi.
                    </p>
                </div>

                <div className="w-full h-4 bg-[repeating-linear-gradient(-45deg,#000,#000_10px,#fbbf24_10px,#fbbf24_20px)] border-2 border-black"></div>
            </div>
        </div>
    );
};

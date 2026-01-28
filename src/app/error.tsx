"use client";

import { AlertOctagon, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100 text-center">
            <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full flex flex-col items-center gap-6 relative overflow-hidden">

                {/* Decorative Background Element */}
                <div className="absolute top-0 left-0 w-full h-2 bg-red-500 border-b-2 border-black"></div>

                {/* Icon */}
                <div className="w-24 h-24 bg-red-500 border-2 border-black flex items-center justify-center animate-pulse rounded-full">
                    <AlertOctagon size={48} className="text-white" strokeWidth={3} />
                </div>

                {/* Text */}
                <div className="flex flex-col gap-2 z-10">
                    <h1 className="text-5xl font-black font-sans tracking-tighter text-red-600">FAULT!</h1>
                    <h2 className="text-lg font-bold uppercase bg-black text-white px-2 py-1 inline-block">
                        Sistem Error
                    </h2>
                    <p className="text-gray-600 font-medium mt-2 text-sm">
                        Terjadi kesalahan teknis. Wasit (Server) sedang kebingungan.
                        <br />
                        <span className="font-mono text-xs bg-gray-100 p-1 mt-2 inline-block border border-gray-300">
                            Code: {error.digest || 'Unknown'}
                        </span>
                    </p>
                </div>

                {/* Button */}
                <button
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                    className="flex items-center gap-2 bg-brand-orange px-6 py-3 border-2 border-black font-black uppercase tracking-wider hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                    <RotateCcw size={20} />
                    Ulangi Point (Reload)
                </button>
            </div>
        </div>
    );
}

import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100 text-center">
            <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full flex flex-col items-center gap-6">

                {/* Icon */}
                <div className="w-24 h-24 bg-brand-orange border-2 border-black flex items-center justify-center animate-bounce">
                    <AlertTriangle size={48} className="text-black" strokeWidth={3} />
                </div>

                {/* Text */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-6xl font-black font-sans tracking-tighter">404</h1>
                    <h2 className="text-xl font-bold uppercase bg-black text-white px-2 py-1 inline-block transform -rotate-2">
                        Out of Bounds!
                    </h2>
                    <p className="text-gray-600 font-medium mt-2">
                        Halaman yang anda cari tidak ditemukan atau bola keluar garis.
                    </p>
                </div>

                {/* Button */}
                <Link
                    href="/"
                    className="flex items-center gap-2 bg-brand-lime px-6 py-3 border-2 border-black font-black uppercase tracking-wider hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                    <Home size={20} />
                    Kembali ke Lapangan
                </Link>
            </div>
        </div>
    );
}

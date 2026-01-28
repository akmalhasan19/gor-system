import Link from "next/link";
import { ShieldAlert, Lock } from "lucide-react";

export const AccessDenied = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100 text-center">
            <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full flex flex-col items-center gap-6 relative">

                {/* Striped Pattern Header */}
                <div className="absolute top-0 left-0 w-full h-4 bg-[repeating-linear-gradient(45deg,#000,#000_10px,#fff_10px,#fff_20px)] border-b-2 border-black"></div>

                {/* Icon */}
                <div className="w-24 h-24 bg-black flex items-center justify-center rounded-none mt-4">
                    <ShieldAlert size={48} className="text-red-500" strokeWidth={3} />
                </div>

                {/* Text */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black font-sans tracking-tighter uppercase">Pelanggaran!</h1>
                    <h2 className="text-lg font-bold uppercase bg-red-600 text-white px-2 py-1 inline-block transform rotate-1">
                        Akses Ditolak
                    </h2>
                    <p className="text-gray-600 font-medium mt-2">
                        Area ini khusus untuk Owner/Manager. Anda tidak memiliki tiket masuk.
                    </p>
                </div>

                {/* Button */}
                <Link
                    href="/"
                    className="flex items-center gap-2 bg-white text-black px-6 py-3 border-2 border-black font-black uppercase tracking-wider hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-x-0 hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                    <Lock size={20} />
                    Kembali ke Zone Aman
                </Link>
            </div>
        </div>
    );
};

"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Initial check
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            // Show "Back Online" briefly
            setShowBanner(true);
            setTimeout(() => setShowBanner(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBanner(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showBanner && isOnline) return null;

    return (
        <div
            className={`
                fixed bottom-4 right-4 z-[9999] 
                flex items-center gap-3 px-4 py-3
                border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                font-black uppercase text-sm tracking-wide
                transition-all duration-300 transform
                ${isOnline
                    ? 'bg-brand-lime text-black translate-y-0'
                    : 'bg-red-500 text-white translate-y-0 animate-pulse'
                }
            `}
        >
            {isOnline ? (
                <>
                    <Wifi size={20} strokeWidth={3} />
                    <span>Koneksi Kembali</span>
                </>
            ) : (
                <>
                    <WifiOff size={20} strokeWidth={3} />
                    <span>Koneksi Terputus / Offline</span>
                </>
            )}
        </div>
    );
};

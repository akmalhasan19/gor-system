'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    CalendarDays,
    ShoppingCart,
    Banknote,
    Users,
    Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const MobileBottomNav = () => {
    const pathname = usePathname();

    const navItems = [
        { id: '/dashboard', icon: LayoutDashboard, label: 'Home' },
        { id: '/scheduler', icon: CalendarDays, label: 'Jadwal' },
        { id: '/pos', icon: ShoppingCart, label: 'Kantin' },
        { id: '/reports', icon: Receipt, label: 'Laporan' },
        { id: '/shift', icon: Banknote, label: 'Kasir' },
        { id: '/members', icon: Users, label: 'Member' },
    ];

    const [isScannerOpen, setIsScannerOpen] = React.useState(false);

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t-[3px] border-black px-1 py-1.5 flex justify-around items-center z-50 md:hidden pb-safe gap-1">
                {navItems.slice(0, 3).map((item) => {
                    const isActive = pathname === item.id || (item.id === '/dashboard' && pathname === '/');
                    return (
                        <Link
                            key={item.id}
                            href={item.id}
                            className={cn(
                                "flex flex-col items-center justify-center px-1.5 py-2 rounded-lg transition-all border-2 border-transparent min-w-[44px] min-h-[44px]",
                                isActive ? "bg-brand-lime border-black shadow-neo-sm -translate-y-0.5" : "hover:bg-gray-100"
                            )}
                        >
                            <item.icon
                                size={20}
                                strokeWidth={isActive ? 3 : 2}
                                className={cn(isActive ? "text-black" : "text-gray-500")}
                            />
                            <span className={cn(
                                "text-[9px] font-bold uppercase mt-0.5",
                                isActive ? "text-black" : "text-gray-500"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}

                {/* SCAN BUTTON - Center / Prominent */}
                <button
                    onClick={() => setIsScannerOpen(true)}
                    className="flex flex-col items-center justify-center px-1.5 py-2 rounded-xl transition-all border-2 border-black bg-black min-w-[50px] min-h-[50px] shadow-neo-sm -translate-y-2 active:translate-y-0 active:shadow-none"
                >
                    <div className="bg-white/20 p-1.5 rounded-full mb-0.5">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-brand-lime"
                        >
                            <rect width="5" height="5" x="3" y="3" rx="1" />
                            <rect width="5" height="5" x="16" y="3" rx="1" />
                            <rect width="5" height="5" x="3" y="16" rx="1" />
                            <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                            <path d="M21 21v.01" />
                            <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                            <path d="M3 12h.01" />
                            <path d="M12 3h.01" />
                            <path d="M12 16v.01" />
                            <path d="M16 12h1" />
                            <path d="M21 12v.01" />
                            <path d="M12 21v-1" />
                        </svg>
                    </div>
                    <span className="text-[9px] font-black uppercase text-brand-lime tracking-wider">
                        SCAN
                    </span>
                </button>

                {navItems.slice(3).map((item) => {
                    const isActive = pathname === item.id;
                    return (
                        <Link
                            key={item.id}
                            href={item.id}
                            className={cn(
                                "flex flex-col items-center justify-center px-1.5 py-2 rounded-lg transition-all border-2 border-transparent min-w-[44px] min-h-[44px]",
                                isActive ? "bg-brand-lime border-black shadow-neo-sm -translate-y-0.5" : "hover:bg-gray-100"
                            )}
                        >
                            <item.icon
                                size={20}
                                strokeWidth={isActive ? 3 : 2}
                                className={cn(isActive ? "text-black" : "text-gray-500")}
                            />
                            <span className={cn(
                                "text-[9px] font-bold uppercase mt-0.5",
                                isActive ? "text-black" : "text-gray-500"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {/* QR Scanner Modal (Lazy loaded ideally, but simple for now) */}
            {isScannerOpen && (
                <QrScannerModalWrapper isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
            )}
        </>
    );
};

// Dynamic import for QrScanner to avoid SSR issues with html5-qrcode
import dynamic from 'next/dynamic';
const QrScannerModalWrapper = dynamic(
    () => import('@/components/qr-scanner-modal').then((mod) => mod.QrScannerModal),
    { ssr: false }
);


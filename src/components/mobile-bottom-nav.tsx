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

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-[3px] border-black px-1 py-1.5 flex justify-around items-center z-50 md:hidden pb-safe gap-1">
            {navItems.map((item) => {
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
        </div>
    );
};

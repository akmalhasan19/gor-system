'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    CalendarDays,
    ShoppingCart,
    Banknote,
    Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const MobileBottomNav = () => {
    const pathname = usePathname();

    const navItems = [
        { id: '/dashboard', icon: LayoutDashboard, label: 'Home' },
        { id: '/scheduler', icon: CalendarDays, label: 'Jadwal' },
        { id: '/pos', icon: ShoppingCart, label: 'Kantin' },
        { id: '/shift', icon: Banknote, label: 'Kasir' },
        { id: '/members', icon: Users, label: 'Member' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-[3px] border-black p-2 flex justify-around items-center z-50 md:hidden pb-safe">
            {navItems.map((item) => {
                const isActive = pathname === item.id || (item.id === '/dashboard' && pathname === '/');
                return (
                    <Link
                        key={item.id}
                        href={item.id}
                        className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-xl transition-all border-[3px] border-transparent",
                            isActive ? "bg-brand-lime border-black shadow-neo-sm -translate-y-1" : "hover:bg-gray-100"
                        )}
                    >
                        <item.icon
                            size={24}
                            strokeWidth={isActive ? 3 : 2}
                            className={cn(isActive ? "text-black" : "text-gray-500")}
                        />
                    </Link>
                );
            })}
        </div>
    );
};

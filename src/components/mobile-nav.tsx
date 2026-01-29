'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    Menu, LayoutDashboard, CalendarDays, ShoppingCart,
    Users, Receipt, Banknote, Settings, LogOut
} from 'lucide-react';
import { signOut } from '@/lib/auth';

export const MobileNav = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    const menuItems = [
        { id: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: '/scheduler', icon: CalendarDays, label: 'Jadwal' },
        { id: '/pos', icon: ShoppingCart, label: 'Kantin / POS' },
        { id: '/members', icon: Users, label: 'Member' },
        { id: '/reports', icon: Receipt, label: 'Laporan' },
        { id: '/shift', icon: Banknote, label: 'Kasir / Shift' },
        { id: '/settings', icon: Settings, label: 'Pengaturan' },
    ];

    return (
        <nav className="bg-brand-lime border-b-2 border-black p-2 sticky top-0 z-30 shadow-md md:hidden">
            <div className="w-full flex justify-between items-center px-2 relative">
                {/* Logo Section */}
                <div className="flex items-center gap-2 group">
                    <div className="w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-110">
                        <Image
                            src="/smash-logo.svg"
                            alt="Smash Logo"
                            width={32}
                            height={32}
                            className="w-full h-full object-contain brightness-0"
                        />
                    </div>
                    <span className="text-xl font-display font-black tracking-tight italic">
                        Smash<span className="text-pastel-lilac">.</span>
                    </span>
                </div>

                {/* Menu Button with Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`bg-white p-1.5 border-2 border-black shadow-neo-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all ${isMenuOpen ? 'bg-black text-white' : ''}`}
                    >
                        <Menu className="w-6 h-6" strokeWidth={2.5} />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border-2 border-black shadow-neo-lg z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
                            <div className="flex flex-col p-1">
                                {menuItems.map((item) => {
                                    const isActive = pathname === item.id || (item.id === '/dashboard' && pathname === '/');
                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.id}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 font-bold text-sm uppercase hover:bg-brand-lime hover:text-black transition-colors text-left border-b border-gray-100 last:border-0 ${isActive ? "bg-black text-white hover:bg-gray-800 hover:text-white" : "text-gray-700"}`}
                                        >
                                            <item.icon size={18} />
                                            {item.label}
                                        </Link>
                                    );
                                })}

                                <div className="border-t border-gray-100 my-1"></div>

                                <button
                                    onClick={async () => {
                                        await signOut();
                                        window.location.href = '/login';
                                    }}
                                    className="flex w-full items-center gap-3 px-4 py-3 font-bold text-sm uppercase text-red-600 hover:bg-red-50 text-left"
                                >
                                    <LogOut size={18} />
                                    Keluar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

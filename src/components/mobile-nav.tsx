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
import { AlertDialog } from '@/components/ui/alert-dialog';

export const MobileNav = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
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

    const handleLogout = async () => {
        await signOut();
        window.location.href = '/login';
    };

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

                {/* Logout Button */}
                <button
                    onClick={() => setIsLogoutDialogOpen(true)}
                    className="bg-red-500 text-white p-1.5 border-2 border-black shadow-neo-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center gap-2 px-3 rounded-none"
                    aria-label="Keluar"
                >
                    <LogOut className="w-4 h-4" strokeWidth={2.5} />
                    <span className="font-bold text-xs uppercase">Keluar</span>
                </button>
            </div>

            <AlertDialog
                isOpen={isLogoutDialogOpen}
                onClose={() => setIsLogoutDialogOpen(false)}
                onConfirm={handleLogout}
                title="Konfirmasi Keluar"
                description="Apakah Anda yakin ingin keluar dari aplikasi?"
                confirmLabel="Ya, Keluar"
                cancelLabel="Batal"
                variant="danger"
            />
        </nav>
    );
};

"use client";

import React from "react";
import Image from "next/image";

import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    CalendarDays,
    ShoppingCart,
    Users,
    Receipt,
    Banknote,
    Settings,
    LogOut
} from "lucide-react";
import { signOut } from "@/lib/auth";
import { AlertDialog } from "@/components/ui/alert-dialog";

export const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();

    const menuItems = [
        { id: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: '/scheduler', icon: CalendarDays, label: 'Jadwal' },
        { id: '/pos', icon: ShoppingCart, label: 'Kantin / POS' },
        { id: '/members', icon: Users, label: 'Member' },
        { id: '/reports', icon: Receipt, label: 'Laporan' },
        { id: '/shift', icon: Banknote, label: 'Kasir / Shift' },
        { id: '/settings', icon: Settings, label: 'Pengaturan' },
    ];

    const isActive = (path: string) => {
        if (path === '/dashboard' && pathname === '/') return true;
        return pathname.startsWith(path);
    };

    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = React.useState(false);

    const handleLogout = async () => {
        await signOut();
        window.location.href = '/login';
    };

    return (
        <div className="hidden lg:flex flex-col w-64 bg-black text-white h-screen sticky top-0 border-r-2 border-white/20">
            {/* Logo Area */}
            <div className="p-6 flex items-center gap-3 border-b border-white/20">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <Image
                        src="/smash-logo.svg"
                        alt="Smash Logo"
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain"
                    />
                </div>
                <div>
                    <h1 className="text-xl font-display font-black tracking-tighter italic leading-none">
                        Smash<span className="text-brand-lime">.</span>
                    </h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Partner App
                    </p>
                </div>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]">
                {menuItems.map((item) => {
                    const active = isActive(item.id);
                    return (
                        <div
                            key={item.id}
                            onClick={() => {
                                if (pathname !== item.id) {
                                    router.push(item.id);
                                    router.refresh();
                                }
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm uppercase transition-all duration-200 group cursor-pointer select-none
                        ${active
                                    ? "bg-brand-lime text-black shadow-[4px_4px_0px_white] translate-x-[-2px] translate-y-[-2px]"
                                    : "text-gray-400 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            <item.icon
                                size={20}
                                strokeWidth={active ? 2.5 : 2}
                                className={`transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"}`}
                            />
                            {item.label}
                        </div>
                    );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-white/20">
                <button
                    onClick={() => setIsLogoutDialogOpen(true)}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm uppercase text-red-500 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                >
                    <LogOut size={20} />
                    Keluar
                </button>

                <div className="mt-4 text-center text-[10px] text-gray-600 font-mono">
                    v1.0.0 &bull; 2026
                </div>
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
        </div>
    );
};

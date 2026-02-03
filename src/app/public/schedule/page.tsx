"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Scheduler } from '@/components/scheduler';
import { useAppStore } from '@/lib/store';
import { useVenue } from '@/lib/venue-context';

export default function PublicSchedulePage() {
    const { bookings, courts, syncCourts } = useAppStore();
    const { currentVenueId } = useVenue();
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Sync courts when venue is loaded
    useEffect(() => {
        if (currentVenueId && currentVenueId.trim() !== '') {
            syncCourts(currentVenueId);
        }
    }, [currentVenueId, syncCourts]);

    if (!isHydrated) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-xl animate-pulse">Loading Schedule...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="bg-brand-lime border-b-2 border-black p-4 sticky top-0 z-30 shadow-md">
                <div className="w-full flex justify-center items-center gap-2">
                    <div className="w-10 h-10 flex items-center justify-center">
                        <Image
                            src="/smash-logo.png"
                            alt="Smash Logo"
                            width={40}
                            height={40}
                            className="w-full h-full object-contain brightness-0"
                            priority
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black italic tracking-tight uppercase leading-none">Smash<span className="text-pastel-lilac">.</span> Partner</h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-center mt-0.5">Public Availability View</p>
                    </div>
                </div>
            </nav>

            <main className="flex-1 p-4 overflow-y-auto w-full max-w-6xl mx-auto">
                <div className="bg-blue-100 border-2 border-blue-900 text-blue-900 p-4 mb-6 shadow-[4px_4px_0px_#1e3a8a]">
                    <p className="text-sm font-black text-center uppercase">
                        Halaman ini hanya untuk melihat ketersediaan lapangan.
                    </p>
                    <p className="text-xs font-bold text-center uppercase mt-1">
                        Untuk reservasi, silakan hubungi Admin kami via WhatsApp.
                    </p>
                </div>

                <div className="mb-8">
                    <Scheduler
                        bookings={bookings}
                        courts={courts}
                        readOnly={true}
                    />
                </div>
            </main>

            <footer className="p-4 border-t-2 border-black bg-white text-center">
                <p className="text-[10px] font-bold uppercase text-gray-400">Powered by GOR Management System</p>
            </footer>
        </div>
    );
}

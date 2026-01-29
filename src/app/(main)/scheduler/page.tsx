'use client';

import React, { useState, useEffect } from 'react';
import { Scheduler } from "@/components/scheduler";
import { BookingModal } from "@/components/booking-modal";
import { Booking } from "@/lib/constants";
import { useAppStore } from "@/lib/store";
import { useVenue } from "@/lib/venue-context";
import { toast } from "sonner";
import { getMaintenanceTasks, MaintenanceTask } from "@/lib/api/maintenance";
import { NeoButton } from "@/components/ui/neo-button";
import { Share2, Plus, ChevronLeft, ChevronRight } from "lucide-react";

export default function SchedulerPage() {
    const {
        bookings, addBooking, courts, customers, updateCustomer,
        selectedDate, setSelectedDate
    } = useAppStore();
    const { currentVenueId, currentVenue } = useVenue();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
    const [bookingInitialData, setBookingInitialData] = useState<{ courtId: string; time: number } | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    // Fetch maintenance tasks
    useEffect(() => {
        const fetchMaintenance = async () => {
            if (!currentVenueId) return;
            try {
                const tasks = await getMaintenanceTasks(currentVenueId, selectedDate);
                setMaintenanceTasks(tasks);
            } catch (error) {
                console.error('Failed to fetch maintenance tasks:', error);
            }
        };
        fetchMaintenance();
    }, [currentVenueId, selectedDate]);

    const handleDateChange = (days: number) => {
        const currentDate = new Date(selectedDate);
        currentDate.setDate(currentDate.getDate() + days);
        const newDateStr = currentDate.toLocaleDateString('en-CA');
        setSelectedDate(newDateStr);
    };

    const handleSaveBooking = async (newBooking: Omit<Booking, "id">, customerId?: string, useQuota?: boolean) => {
        try {
            if (!currentVenueId) {
                toast.error('No venue selected');
                return;
            }

            // Handle Quota Usage
            let finalBooking = { ...newBooking };
            if (useQuota && customerId) {
                const customer = customers.find(c => c.id === customerId);
                if (customer && customer.quota && customer.quota > 0) {
                    await updateCustomer(customerId, { quota: customer.quota - 1 });
                    finalBooking.status = 'LUNAS';
                    finalBooking.paidAmount = finalBooking.price;
                    toast.success(`Menggunakan 1 Jatah Member. Sisa: ${customer.quota - 1}`);
                } else {
                    toast.error("Gagal menggunakan jatah member. Kuota habis atau tidak valid.");
                    return;
                }
            }

            await addBooking(currentVenueId, finalBooking);
            toast.success('Booking berhasil disimpan!');
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save booking:', error);
            toast.error('Gagal menyimpan booking. Silakan coba lagi.');
        }
    };

    const handleDeleteBooking = async (id: string) => {
        try {
            await useAppStore.getState().deleteBooking(id);
            toast.success('Booking berhasil dihapus!');
            handleCloseModal();
        } catch (error) {
            console.error('Failed to delete booking:', error);
            toast.error('Gagal menghapus booking. ' + (error instanceof Error ? error.message : ''));
        }
    };

    const handleBookingClick = (booking: Booking) => {
        setSelectedBooking(booking);
        setBookingInitialData(null);
        setIsModalOpen(true);
    };

    const handleSlotClick = (courtId: string, hour: number) => {
        setSelectedBooking(null);
        setBookingInitialData({ courtId, time: hour });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setBookingInitialData(null);
        setSelectedBooking(null);
    };

    const handleCopyPublicLink = () => {
        const link = `${window.location.origin}/public/schedule`;
        navigator.clipboard.writeText(link);
        toast.success('Link Jadwal Publik berhasil disalin! Kirim link ini ke pelanggan Anda.');
    };

    return (
        <div className="flex-1 p-4 overflow-y-auto">
            <div className="mb-4 flex justify-between items-center">
                <h1 className="text-lg font-display font-black uppercase italic">Jadwal Lapangan</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopyPublicLink}
                        className="flex items-center gap-2 bg-white text-black border-2 border-black px-3 py-2 text-xs font-bold uppercase hover:bg-gray-100 shadow-neo-sm active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                    >
                        <Share2 size={16} strokeWidth={2.5} />
                        Public Link
                    </button>
                    <NeoButton onClick={() => setIsModalOpen(true)} className="px-3 py-2 text-xs">
                        <Plus size={16} strokeWidth={3} className="mr-2" /> Input Booking
                    </NeoButton>
                </div>
            </div>

            {/* Date Navigator */}
            <div className="flex items-center justify-between bg-white border-2 border-black p-3 md:p-4 mb-4 shadow-neo-sm rounded-xl gap-2 md:gap-4">
                <button
                    onClick={() => handleDateChange(-1)}
                    className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 flex items-center justify-center bg-white border-2 border-black hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                    <ChevronLeft size={20} className="md:w-6 md:h-6" strokeWidth={3} />
                </button>

                <div className="flex flex-col items-center flex-1 min-w-0 px-2">
                    <span className="font-display font-black uppercase text-base sm:text-lg md:text-2xl tracking-tight text-center leading-tight">
                        {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {selectedDate === new Date().toLocaleDateString('en-CA') && (
                        <span className="text-[10px] font-bold bg-brand-lime px-3 py-0.5 border-2 border-black rounded-full shadow-[1px_1px_0px_0px_#000000] mt-1 -rotate-2">
                            HARI INI
                        </span>
                    )}
                </div>

                <button
                    onClick={() => handleDateChange(1)}
                    className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 flex items-center justify-center bg-white border-2 border-black hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                    <ChevronRight size={20} className="md:w-6 md:h-6" strokeWidth={3} />
                </button>
            </div>

            <Scheduler
                bookings={bookings}
                courts={courts}
                maintenanceTasks={maintenanceTasks}
                onSlotClick={handleSlotClick}
                onBookingClick={handleBookingClick}
                operatingHoursStart={currentVenue?.operatingHoursStart}
                operatingHoursEnd={currentVenue?.operatingHoursEnd}
            />

            <BookingModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveBooking}
                onDelete={handleDeleteBooking}
                initialData={bookingInitialData}
                existingBooking={selectedBooking}
            />
        </div>
    );
}

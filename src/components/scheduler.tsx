"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Booking, Court, OPERATIONAL_HOURS } from "@/lib/constants";
import { Court as ApiCourt } from "@/lib/api/courts";
import { MaintenanceTask as ApiMaintenanceTask, isSlotBlockedByMaintenance } from "@/lib/api/maintenance";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarX, Settings } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { useVenue } from "@/lib/venue-context";
import { NeoBadge } from "@/components/ui/neo-badge";
import { MessageSquare, Trash2, Wrench } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface SchedulerProps {
    bookings: Booking[];
    courts: Court[];
    maintenanceTasks?: ApiMaintenanceTask[];
    onSlotClick?: (courtId: string, hour: number) => void;
    onBookingClick?: (booking: Booking) => void;
    readOnly?: boolean;
    operatingHoursStart?: number;
    operatingHoursEnd?: number;
}

export const Scheduler: React.FC<SchedulerProps> = ({
    bookings,
    courts,
    maintenanceTasks = [],
    onSlotClick,
    onBookingClick,
    readOnly = false,
    operatingHoursStart = 8,
    operatingHoursEnd = 23
}) => {
    const { addToCart } = useAppStore();
    const { currentVenueId, currentVenue } = useVenue();

    const { updateBooking } = useAppStore();
    const [moveTarget, setMoveTarget] = useState<{ bookingId: string, courtId: string, hour: number } | null>(null);

    // Real-time timer state
    const [now, setNow] = useState(new Date());

    React.useEffect(() => {
        // Update "now" every second to trigger re-renders for timers
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // If no courts are defined, show empty state
    if (!courts || courts.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center p-8 bg-gray-50/50">
                <EmptyState
                    icon={CalendarX}
                    title="Belum Ada Lapangan"
                    description="Anda belum memiliki lapangan yang terdaftar. Tambahkan lapangan untuk mulai mengatur jadwal."
                    action={
                        <Link href="/settings">
                            <button className="flex items-center gap-2 bg-brand-lime text-black px-4 py-2 font-black uppercase text-xs border-2 border-black shadow-neo hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                                <Settings size={14} strokeWidth={3} />
                                Atur Lapangan
                            </button>
                        </Link>
                    }
                />
            </div>
        );
    }

    // Generate hours based on props
    const hours = Array.from(
        { length: operatingHoursEnd - operatingHoursStart + 1 },
        (_, i) => i + operatingHoursStart
    );

    const handleWhatsApp = (e: React.MouseEvent, booking: Booking, courtName: string) => {
        e.stopPropagation();
        const text = `Halo Kak ${booking.customerName}, konfirmasi booking lapangan ${courtName} untuk jam ${booking.startTime}:00 selama ${booking.duration} jam. Status: ${booking.status}. Terima kasih!`;
        const url = `https://wa.me/${booking.phone.replace(/^0/, '62')}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const getBookingAt = (courtId: string, hour: number) => {
        return bookings.find((b) => {
            // Support both number (legacy/constants) and string "HH:MM:SS" (DB)
            let start = typeof b.startTime === 'number' ? b.startTime : parseInt(b.startTime.split(':')[0]);

            const end = start + b.duration;
            return b.status !== 'cancelled' && b.courtId === courtId && hour >= start && hour < end;
        });
    };

    const handlePayClick = (e: React.MouseEvent, booking: Booking) => {
        e.stopPropagation();
        const remainingPrice = booking.price - (booking.paidAmount || 0);
        addToCart({
            id: `booking-${booking.id}`,
            type: 'BOOKING',
            name: `Sewa ${booking.duration} Jam (${booking.customerName}) ${booking.status === 'DP' ? '(Pelunasan)' : ''}`,
            price: remainingPrice,
            quantity: 1,
            referenceId: booking.id
        });
    };



    const handleDragStart = (e: React.DragEvent, booking: Booking) => {
        if (readOnly) return;
        e.dataTransfer.setData("bookingId", booking.id);
        e.dataTransfer.setData("duration", booking.duration.toString());
        e.dataTransfer.effectAllowed = "move";
        // Make it semi-transparent during drag
        (e.target as HTMLElement).style.opacity = "0.5";
    };

    const handleDragEnd = (e: React.DragEvent) => {
        (e.target as HTMLElement).style.opacity = "1";
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (readOnly) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, targetCourtId: string, targetHour: number) => {
        if (readOnly) return;
        e.preventDefault();
        const bookingId = e.dataTransfer.getData("bookingId");
        const durationStr = e.dataTransfer.getData("duration");

        if (!bookingId || !durationStr) return;

        const duration = parseInt(durationStr);

        // Validation: Check overlapping
        const isOccupied = bookings.some(b => {
            if (b.id === bookingId) return false; // Ignore self
            if (b.courtId !== targetCourtId) return false;

            const bStart = typeof b.startTime === 'number' ? b.startTime : parseInt(b.startTime.split(':')[0]);
            const bEnd = bStart + b.duration;
            const targetEnd = targetHour + duration;

            return (targetHour < bEnd && targetEnd > bStart);
        });

        if (isOccupied) {
            toast.error("Slot sudah terisi!");
            return;
        }

        if (isOccupied) {
            toast.error("Slot sudah terisi!");
            return;
        }

        setMoveTarget({ bookingId, courtId: targetCourtId, hour: targetHour });
    };

    const confirmMove = async () => {
        if (!moveTarget) return;
        const { bookingId, courtId, hour } = moveTarget;

        try {
            if (!currentVenueId) throw new Error("Venue not found");
            const newStartTime = `${hour.toString().padStart(2, '0')}:00:00`;
            await updateBooking(currentVenueId, bookingId, {
                courtId: courtId,
                startTime: newStartTime
            });
            toast.success("Booking berhasil dipindahkan!");
        } catch (error) {
            console.error("Failed to move booking:", error);
            toast.error("Gagal memindahkan booking.");
        }
        setMoveTarget(null);
    };

    const isBookingStale = (booking: Booking): boolean => {
        // Only check unpaid bookings
        if (booking.status !== 'pending' && booking.status !== 'BELUM_BAYAR') {
            return false;
        }

        // If createdAt is not available, assume not stale (backward compatibility)
        if (!booking.createdAt) {
            return false;
        }

        const createdTime = new Date(booking.createdAt).getTime();
        const currentTime = now.getTime(); // Use "now" state
        const minutesElapsed = (currentTime - createdTime) / (1000 * 60);

        return minutesElapsed > 60;
    };

    return (
        <div className="overflow-x-auto pb-2">
            <div className="min-w-fit border-2 border-black bg-white shadow-neo">
                {/* Header Row */}
                <div className="flex border-b-2 border-black bg-black text-white">
                    <div className="sticky left-0 z-20 w-[60px] min-w-[60px] p-1.5 font-black uppercase text-center border-r-2 border-white text-[10px] bg-black">
                        JAM
                    </div>
                    {courts.map((court) => (
                        <div
                            key={court.id}
                            className="min-w-[150px] flex-1 p-1.5 font-black uppercase text-center border-r-2 border-white last:border-0 text-[10px]"
                        >
                            {court.name}
                        </div>
                    ))}
                </div>

                {/* Grid Body */}
                {hours.map((hour) => (
                    <div
                        key={hour}
                        className="flex border-b-2 border-black last:border-0"
                    >
                        {/* Time Column */}
                        <div className="sticky left-0 z-10 w-[60px] min-w-[60px] p-1 font-bold text-[10px] text-center border-r-2 border-black bg-gray-100 flex items-center justify-center">
                            {hour}:00
                        </div>

                        {/* Court Columns */}
                        {courts.map((court) => {
                            const booking = getBookingAt(court.id, hour);
                            let startHour = -1;
                            if (booking) {
                                startHour = typeof booking.startTime === 'number' ? booking.startTime : parseInt(booking.startTime.split(':')[0]);
                            }
                            const isStart = booking && startHour === hour;

                            if (booking) {
                                if (isStart) {
                                    const isPaid = booking.status === "LUNAS" || (booking.price > 0 && booking.paidAmount >= booking.price);
                                    const isStale = isBookingStale(booking);

                                    // Check if booking is finished but not paid
                                    // Use "now" state for current hour check
                                    const currentHour = now.getHours();
                                    const isToday = booking.bookingDate === now.toLocaleDateString('en-CA');
                                    const endHour = startHour + booking.duration;
                                    const isFinishedAndUnpaid = isToday && endHour <= currentHour && !isPaid;

                                    // Payment Timeout Logic
                                    const bookingToleranceMinutes = currentVenue?.bookingTolerance || 15;
                                    const minDpPercent = currentVenue?.minDpPercentage || 50;
                                    const dpPercent = booking.price > 0 ? (booking.paidAmount / booking.price) * 100 : 0;
                                    const isSecured = isPaid || dpPercent >= minDpPercent;

                                    // Calculate Time Left if not secured
                                    let timeLeftStr = "";
                                    let isExpired = false;

                                    if (!isSecured && booking.createdAt && !isPaid) {
                                        // If in_cart_since is set, timer is paused
                                        // We treat the time spent in cart as "free time", so we only count time BEFORE cart + time AFTER cart (if any)
                                        // But simplified logic per requirement: "start timer, pause if in cart"

                                        // Actually the requirement is: "auto-delete after 15 mins".
                                        // If in_cart_since is present, we pause. 
                                        // Visual Logic:
                                        // If in_cart: SHOW "IN CART" (Paused)
                                        // If not in_cart: SHOW Time Left

                                        if (booking.inCartSince) {
                                            timeLeftStr = "IN CART";
                                        } else {
                                            const createdTime = new Date(booking.createdAt).getTime();
                                            const toleranceMs = bookingToleranceMinutes * 60 * 1000;
                                            const expireTime = createdTime + toleranceMs;
                                            const nowMs = now.getTime(); // Use "now" state
                                            const diffMs = expireTime - nowMs;

                                            if (diffMs > 0) {
                                                const mins = Math.floor(diffMs / 60000);
                                                const secs = Math.floor((diffMs % 60000) / 1000);
                                                timeLeftStr = `⏱ ${mins}:${secs.toString().padStart(2, '0')}`;
                                            } else {
                                                timeLeftStr = "EXPIRED";
                                                isExpired = true;
                                            }
                                        }
                                    }


                                    // Determine background color based on payment and stale status
                                    const bgColor = isPaid ? "bg-brand-lime" : isFinishedAndUnpaid ? "bg-red-200" : isExpired ? "bg-red-500" : isStale ? "bg-red-400" : "bg-white";
                                    const patternClass = !isPaid
                                        ? "bg-[linear-gradient(45deg,#00000010_25%,transparent_25%,transparent_50%,#00000010_50%,#00000010_75%,transparent_75%,transparent)] bg-[length:20px_20px]"
                                        : "";

                                    return (
                                        <div
                                            key={court.id}
                                            className="min-w-[150px] flex-1 border-r-2 border-black last:border-r-0 p-1 bg-white h-auto min-h-[50px] cursor-grab active:cursor-grabbing hover:brightness-95 transition-all"
                                            draggable={!readOnly}
                                            onDragStart={(e) => handleDragStart(e, booking)}
                                            onDragEnd={handleDragEnd}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onBookingClick?.(booking);
                                            }}
                                        >
                                            <div
                                                className={`w-full h-full border-2 border-black shadow-sm flex flex-col justify-between p-1.5 gap-1 ${bgColor} ${patternClass}`}
                                            >
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-start justify-between gap-1">
                                                        <div className="font-black text-[10px] leading-snug uppercase break-words flex-1">
                                                            {readOnly ? booking.customerName.charAt(0) + "***" : booking.customerName}
                                                        </div>
                                                        {/* Payment Timer Badge */}
                                                        {timeLeftStr && !readOnly && !isPaid && (
                                                            <div className={`
                                                                ${booking.inCartSince ? 'bg-blue-500' : isExpired ? 'bg-black' : 'bg-red-600'} 
                                                                border border-black px-1 py-0.5 text-[8px] font-black text-white shadow-[1px_1px_0px_black] whitespace-nowrap flex-shrink-0 flex items-center gap-1
                                                            `}>
                                                                {timeLeftStr}
                                                            </div>
                                                        )}

                                                        {isFinishedAndUnpaid && !readOnly && !timeLeftStr && (
                                                            <div
                                                                className="bg-brand-orange border border-black px-1 py-0.5 text-[7px] font-black text-black shadow-[1px_1px_0px_black] whitespace-nowrap flex-shrink-0 animate-pulse"
                                                                title="Main selesai tapi belum lunas!"
                                                            >
                                                                TAGIH!
                                                            </div>
                                                        )}
                                                    </div>
                                                    {!readOnly && (
                                                        <div className="text-[9px] font-bold opacity-80 leading-none">
                                                            {booking.phone}
                                                        </div>
                                                    )}
                                                    {booking.duration > 1 && (
                                                        <div className="text-[8px] font-bold italic mt-0.5">
                                                            {booking.duration} Jam
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-auto flex flex-wrap justify-between items-end gap-1">
                                                    <div className="flex gap-1 items-end">
                                                        {!readOnly && (
                                                            <button
                                                                onClick={(e) => handleWhatsApp(e, booking, court.name)}
                                                                className="bg-green-500 border border-black p-0.5 text-white hover:bg-green-600 shadow-[1px_1px_0px_black] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                                                                title="Kirim ke WhatsApp"
                                                            >
                                                                <MessageSquare size={10} strokeWidth={3} />
                                                            </button>
                                                        )}
                                                        {!isPaid && !readOnly && (
                                                            <button
                                                                onClick={(e) => handlePayClick(e, booking)}
                                                                className="bg-brand-orange border border-black px-1 py-0.5 text-[8px] font-black uppercase text-black hover:bg-orange-400 shadow-[1px_1px_0px_black] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none whitespace-nowrap"
                                                            >
                                                                {booking.status === 'DP' ? 'Lunasi' : 'Bayar'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    // Occupied slots for multi-hour bookings
                                    return (
                                        <div
                                            key={court.id}
                                            className="min-w-[150px] flex-1 border-r-2 border-black last:border-r-0 relative bg-gray-50 flex flex-col items-center justify-center p-1"
                                            onClick={(e) => {
                                                if (!readOnly) {
                                                    e.stopPropagation();
                                                    alert("Slot ini sedang dipakai oleh booking dari jam sebelumnya.");
                                                }
                                            }}
                                        >
                                            <div className="w-0.5 h-full bg-gray-300 absolute left-1/2 -translate-x-1/2 top-0 pointer-events-none"></div>
                                            <div className="relative z-10 bg-white border border-gray-300 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-gray-400 uppercase shadow-sm">
                                                (Lanjut)
                                            </div>
                                        </div>
                                    );
                                }
                            }

                            if (readOnly) {
                                return (
                                    <div
                                        key={court.id}
                                        className="min-w-[150px] flex-1 border-r-2 border-black last:border-r-0 p-1 min-h-[50px] bg-gray-50 flex items-center justify-center"
                                    >
                                        <span className="text-[10px] text-gray-400 font-bold">KOSONG</span>
                                    </div>
                                );
                            }

                            // Check for maintenance block
                            const maintenanceBlock = isSlotBlockedByMaintenance(maintenanceTasks, court.id, hour);
                            if (maintenanceBlock) {
                                return (
                                    <div
                                        key={court.id}
                                        className="min-w-[150px] flex-1 border-r-2 border-black last:border-r-0 p-1 min-h-[50px] bg-gray-300 bg-[linear-gradient(45deg,#00000015_25%,transparent_25%,transparent_50%,#00000015_50%,#00000015_75%,transparent_75%,transparent)] bg-[length:10px_10px] flex flex-col items-center justify-center cursor-not-allowed"
                                        title={`Maintenance: ${maintenanceBlock.maintenanceType}`}
                                    >
                                        <Wrench size={14} className="text-gray-600" />
                                        <span className="text-[8px] font-bold text-gray-600 uppercase mt-0.5">Maintenance</span>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={court.id}
                                    onClick={() => onSlotClick?.(court.id, hour)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, court.id, hour)}
                                    className="min-w-[150px] flex-1 border-r-2 border-black last:border-r-0 p-1 min-h-[50px] hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center group"
                                >
                                    <span className="opacity-0 group-hover:opacity-100 font-bold text-gray-300 text-xl">
                                        +
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <AlertDialog
                isOpen={!!moveTarget}
                onClose={() => setMoveTarget(null)}
                onConfirm={confirmMove}
                title="Pindahkan Booking"
                description="Apakah anda yakin ingin memindahkan booking ke slot ini?"
                confirmLabel="Pindahkan"
            />
        </div>
    );
};

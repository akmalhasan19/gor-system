"use client";

import React from "react";
import { Booking, Court, OPERATIONAL_HOURS } from "@/lib/constants";
import { NeoBadge } from "@/components/ui/neo-badge";

interface SchedulerProps {
    bookings: Booking[];
    courts: Court[];
}

export const Scheduler: React.FC<SchedulerProps> = ({ bookings, courts }) => {
    const getBookingAt = (courtId: number, hour: number) => {
        return bookings.find((b) => {
            const start = b.startTime;
            const end = b.startTime + b.duration;
            return hour >= start && hour < end;
        });
    };

    return (
        <div className="overflow-x-auto pb-4 no-scrollbar">
            <div className="min-w-[500px] border-2 border-black bg-white shadow-neo">
                {/* Header Row */}
                <div className="grid grid-cols-[60px_1fr_1fr_1fr] border-b-2 border-black bg-black text-white">
                    <div className="p-2 font-black uppercase text-center border-r-2 border-white text-xs">
                        JAM
                    </div>
                    {courts.map((court) => (
                        <div
                            key={court.id}
                            className="p-2 font-black uppercase text-center border-r-2 border-white last:border-0 text-xs"
                        >
                            {court.name}
                        </div>
                    ))}
                </div>

                {/* Grid Body */}
                {OPERATIONAL_HOURS.map((hour) => (
                    <div
                        key={hour}
                        className="grid grid-cols-[60px_1fr_1fr_1fr] border-b-2 border-black last:border-0"
                    >
                        {/* Time Column */}
                        <div className="p-2 font-bold text-xs text-center border-r-2 border-black bg-gray-100 flex items-center justify-center">
                            {hour}:00
                        </div>

                        {/* Court Columns */}
                        {courts.map((court) => {
                            const booking = getBookingAt(court.id, hour);
                            const isStart = booking && booking.startTime === hour;

                            if (booking) {
                                if (isStart) {
                                    const isPaid = booking.status === "LUNAS";
                                    const bgColor = isPaid ? "bg-brand-lime" : "bg-white";
                                    const patternClass = !isPaid
                                        ? "bg-[linear-gradient(45deg,#00000010_25%,transparent_25%,transparent_50%,#00000010_50%,#00000010_75%,transparent_75%,transparent)] bg-[length:20px_20px]"
                                        : "";

                                    return (
                                        <div
                                            key={court.id}
                                            className="border-r-2 border-black last:border-r-0 p-1 bg-white h-auto min-h-[60px]"
                                        >
                                            <div
                                                className={`w-full h-full border-2 border-black shadow-sm flex flex-col justify-between p-2 gap-2 ${bgColor} ${patternClass}`}
                                            >
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="font-black text-[10px] leading-snug uppercase break-words">
                                                        {booking.customerName}
                                                    </div>
                                                    <div className="text-[10px] font-bold opacity-80 leading-none">
                                                        {booking.phone}
                                                    </div>
                                                    {booking.duration > 1 && (
                                                        <div className="text-[9px] font-bold italic mt-0.5">
                                                            {booking.duration} Jam
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-auto">
                                                    <NeoBadge status={booking.status} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    // Occupied slots for multi-hour bookings
                                    return (
                                        <div
                                            key={court.id}
                                            className="border-r-2 border-black last:border-r-0 relative bg-gray-50/50 flex items-center justify-center -z-10"
                                        >
                                            <div className="w-0.5 h-4 bg-gray-300 rounded-full"></div>
                                        </div>
                                    );
                                }
                            }

                            return (
                                <div
                                    key={court.id}
                                    className="border-r-2 border-black last:border-r-0 p-1 min-h-[60px] hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center group"
                                >
                                    <span className="opacity-0 group-hover:opacity-100 font-bold text-gray-300 text-2xl">
                                        +
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

export const CourtSettings = () => {
    const { courts, updateCourt } = useAppStore();

    const handleUpdate = async (courtId: string, field: string, value: number | null) => {
        try {
            // Optimistic update handled by store if designed well, or wait for sync.
            // Our store updates state immediately.
            await updateCourt(courtId, { [field]: value });
            toast.success("Harga disimpan!");
        } catch (error: any) {
            console.error(error);
            toast.error("Gagal menyimpan: " + (error.message || "Terjadi kesalahan"));
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Pengaturan Lapangan</h2>
                <p className="text-sm text-gray-500 font-bold">Atur harga normal dan harga khusus member di sini.</p>
            </div>

            <div className="grid gap-6">
                {courts.map((court) => (
                    <div key={court.id} className="bg-white border-2 border-black p-4 shadow-neo flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b-2 border-gray-100 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-black rounded-full">
                                    {court.courtNumber}
                                </div>
                                <h3 className="text-xl font-black uppercase text-brand-lime-dark">{court.name}</h3>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 border border-black ${court.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {court.isActive ? 'AKTIF' : 'NON-AKTIF'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Standard Rate */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold uppercase text-gray-500">Harga Umum (Per Jam)</label>
                                <div className="flex items-center group focus-within:shadow-[4px_4px_0px_black] transition-all border-2 border-black">
                                    <div className="bg-gray-100 border-r-2 border-black p-2 font-bold text-sm select-none">Rp</div>
                                    <input
                                        type="number"
                                        defaultValue={court.hourlyRate}
                                        onBlur={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val) && val !== court.hourlyRate) handleUpdate(court.id, 'hourlyRate', val);
                                        }}
                                        className="p-2 w-full font-bold outline-none bg-white font-mono"
                                    />
                                </div>
                            </div>

                            {/* Member Rate */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold uppercase text-brand-lilac">Harga Member (Per Jam)</label>
                                <div className="flex items-center group focus-within:shadow-[4px_4px_0px_#A78BFA] transition-all border-2 border-black">
                                    <div className="bg-brand-lilac text-white border-r-2 border-black p-2 font-bold text-sm select-none">Rp</div>
                                    <input
                                        type="number"
                                        defaultValue={court.memberHourlyRate || ''}
                                        placeholder="Belum diatur"
                                        onBlur={(e) => {
                                            const rawVal = e.target.value;
                                            if (rawVal === '') {
                                                // If cleared, maybe set to null? But API expects number? 
                                                // Looking at API types, optional usually means undefined/null.
                                                // Let's assume 0 is not valid, so 0 or empty -> delete.
                                                // But usually simpler to just parse.
                                                // If empty, let's ignore or set undefined?
                                                // Let's try sending null if allowed, or just leave it.
                                                // Actually, best to just set to same as normal price if user wants to reset?
                                                // Or support null.
                                            }
                                            const val = parseInt(rawVal);
                                            if (!isNaN(val) && val !== court.memberHourlyRate) {
                                                handleUpdate(court.id, 'memberHourlyRate', val);
                                            }
                                        }}
                                        className="p-2 w-full font-bold outline-none bg-brand-lilac/10 font-mono placeholder:text-gray-400 placeholder:font-sans"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold italic mt-1">
                                    *Harga ini otomatis dipakai saat memilih Member di booking.
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

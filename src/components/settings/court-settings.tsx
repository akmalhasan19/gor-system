"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { NeoButton } from "@/components/ui/neo-button";
import { Plus } from "lucide-react";

export const CourtSettings = () => {
    const { courts, updateCourt, addCourt, currentVenueId } = useAppStore();
    const [isAdding, setIsAdding] = useState(false);
    const [newCourtData, setNewCourtData] = useState({
        name: '',
        hourlyRate: 0,
        memberHourlyRate: 0
    });

    const handleUpdate = async (courtId: string, field: string, value: number | null) => {
        try {
            await updateCourt(courtId, { [field]: value });
            toast.success("Harga disimpan!");
        } catch (error: any) {
            console.error(error);
            toast.error("Gagal menyimpan: " + (error.message || "Terjadi kesalahan"));
        }
    };

    const handleAddCourt = async () => {
        if (!newCourtData.name) {
            toast.error("Nama lapangan wajib diisi!");
            return;
        }
        if (newCourtData.hourlyRate <= 0) {
            toast.error("Harga per jam harus lebih dari 0!");
            return;
        }

        try {
            await addCourt(currentVenueId, {
                name: newCourtData.name,
                hourlyRate: newCourtData.hourlyRate,
                memberHourlyRate: newCourtData.memberHourlyRate || undefined, // Send undefined if 0/empty
                courtNumber: courts.length + 1, // Simple auto-increment suggestion
                isActive: true
            });
            toast.success("Lapangan berhasil ditambahkan!");
            setIsAdding(false);
            setNewCourtData({ name: '', hourlyRate: 0, memberHourlyRate: 0 });
        } catch (error: any) {
            console.error(error);
            toast.error("Gagal menambah lapangan: " + (error.message || "Terjadi kesalahan"));
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Pengaturan Lapangan</h2>
                    <p className="text-sm text-gray-500 font-bold">Atur harga normal dan harga khusus member di sini.</p>
                </div>
                {!isAdding && (
                    <NeoButton
                        onClick={() => setIsAdding(true)}
                        className="py-2 px-4 text-xs"
                        icon={<Plus size={16} strokeWidth={3} />}
                    >
                        Tambah Lapangan
                    </NeoButton>
                )}
            </div>

            {isAdding && (
                <div className="bg-white border-2 border-black p-4 shadow-neo flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center border-b-2 border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-brand-lime text-black flex items-center justify-center font-black rounded-full border-2 border-black">
                                +
                            </div>
                            <h3 className="text-xl font-black uppercase text-black">Lapangan Baru</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold uppercase text-gray-500">Nama Lapangan</label>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Cth: Lapangan 3"
                                value={newCourtData.name}
                                onChange={(e) => setNewCourtData({ ...newCourtData, name: e.target.value })}
                                className="p-2 w-full font-bold outline-none bg-white border-2 border-black focus:shadow-[4px_4px_0px_black] transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold uppercase text-gray-500">Harga Umum (Per Jam)</label>
                            <div className="flex items-center group focus-within:shadow-[4px_4px_0px_black] transition-all border-2 border-black">
                                <div className="bg-gray-100 border-r-2 border-black p-2 font-bold text-sm select-none">Rp</div>
                                <input
                                    type="number"
                                    value={newCourtData.hourlyRate || ''}
                                    onChange={(e) => setNewCourtData({ ...newCourtData, hourlyRate: parseInt(e.target.value) || 0 })}
                                    className="p-2 w-full font-bold outline-none bg-white font-mono"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold uppercase text-brand-lilac">Harga Member (Opsional)</label>
                            <div className="flex items-center group focus-within:shadow-[4px_4px_0px_#A78BFA] transition-all border-2 border-black">
                                <div className="bg-brand-lilac text-white border-r-2 border-black p-2 font-bold text-sm select-none">Rp</div>
                                <input
                                    type="number"
                                    value={newCourtData.memberHourlyRate || ''}
                                    placeholder="Opsional"
                                    onChange={(e) => setNewCourtData({ ...newCourtData, memberHourlyRate: parseInt(e.target.value) || 0 })}
                                    className="p-2 w-full font-bold outline-none bg-brand-lilac/10 font-mono placeholder:text-gray-400 placeholder:font-sans"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <NeoButton
                            variant="secondary"
                            onClick={() => setIsAdding(false)}
                            className="py-2 px-4 text-xs"
                        >
                            Batal
                        </NeoButton>
                        <NeoButton
                            onClick={handleAddCourt}
                            className="py-2 px-4 text-xs bg-brand-lime"
                        >
                            Simpan Lapangan
                        </NeoButton>
                    </div>
                </div>
            )}

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
                                <label htmlFor={`court-${court.id}-hourly`} className="text-xs font-bold uppercase text-gray-500">Harga Umum (Per Jam)</label>
                                <div className="flex items-center group focus-within:shadow-[4px_4px_0px_black] transition-all border-2 border-black">
                                    <div className="bg-gray-100 border-r-2 border-black p-2 font-bold text-sm select-none">Rp</div>
                                    <input
                                        id={`court-${court.id}-hourly`}
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
                                <label htmlFor={`court-${court.id}-member`} className="text-xs font-bold uppercase text-brand-lilac">Harga Member (Per Jam)</label>
                                <div className="flex items-center group focus-within:shadow-[4px_4px_0px_#A78BFA] transition-all border-2 border-black">
                                    <div className="bg-brand-lilac text-white border-r-2 border-black p-2 font-bold text-sm select-none">Rp</div>
                                    <input
                                        id={`court-${court.id}-member`}
                                        type="number"
                                        defaultValue={court.memberHourlyRate || ''}
                                        placeholder="Belum diatur"
                                        onBlur={(e) => {
                                            const rawVal = e.target.value;
                                            const val = parseInt(rawVal);
                                            // Handle update if different
                                            if (rawVal === '') {
                                                if (court.memberHourlyRate !== undefined && court.memberHourlyRate !== null) {
                                                    // If clearing value
                                                    handleUpdate(court.id, 'memberHourlyRate', null); // or 0? API might want null/undefined handled carefully
                                                }
                                            } else if (!isNaN(val) && val !== court.memberHourlyRate) {
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

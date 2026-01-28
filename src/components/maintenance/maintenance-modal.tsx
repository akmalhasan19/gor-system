"use client";

import React, { useState, useEffect } from "react";
import { useVenue } from "@/lib/venue-context";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import {
    createMaintenanceTask,
    MAINTENANCE_TYPES,
    MaintenanceTask,
} from "@/lib/api/maintenance";
import { X, Wrench, Calendar, Clock } from "lucide-react";

interface MaintenanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved?: () => void;
    initialCourtId?: string;
    initialHour?: number;
    initialDate?: string;
}

export function MaintenanceModal({
    isOpen,
    onClose,
    onSaved,
    initialCourtId,
    initialHour,
    initialDate,
}: MaintenanceModalProps) {
    const { currentVenueId, currentVenue } = useVenue();
    const { courts } = useAppStore();

    const [courtId, setCourtId] = useState(initialCourtId || "");
    const [taskDate, setTaskDate] = useState(
        initialDate || new Date().toISOString().split("T")[0]
    );
    const [startHour, setStartHour] = useState(initialHour || 8);
    const [durationHours, setDurationHours] = useState(1);
    const [maintenanceType, setMaintenanceType] = useState("cleaning");
    const [technicianName, setTechnicianName] = useState("");
    const [notes, setNotes] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setCourtId(initialCourtId || courts[0]?.id || "");
            setTaskDate(initialDate || new Date().toISOString().split("T")[0]);
            setStartHour(initialHour || 8);
            setDurationHours(1);
            setMaintenanceType("cleaning");
            setTechnicianName("");
            setNotes("");
        }
    }, [isOpen, initialCourtId, initialHour, initialDate, courts]);

    const handleSave = async () => {
        if (!currentVenueId || !courtId) {
            toast.error("Pilih lapangan terlebih dahulu");
            return;
        }

        setIsSaving(true);
        try {
            await createMaintenanceTask({
                venueId: currentVenueId,
                courtId,
                taskDate,
                startHour,
                durationHours,
                maintenanceType,
                status: "scheduled",
                technicianName: technicianName || undefined,
                notes: notes || undefined,
            });

            toast.success("Jadwal maintenance berhasil dibuat!");
            onSaved?.();
            onClose();
        } catch (error: any) {
            console.error("Failed to create maintenance task:", error);
            toast.error("Gagal membuat jadwal: " + (error.message || "Terjadi kesalahan"));
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const operatingStart = currentVenue?.operatingHoursStart || 8;
    const operatingEnd = currentVenue?.operatingHoursEnd || 23;
    const hours = Array.from(
        { length: operatingEnd - operatingStart + 1 },
        (_, i) => i + operatingStart
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white border-[3px] border-black shadow-neo w-full max-w-md">
                {/* Header */}
                <div className="bg-gray-800 text-white p-3 flex justify-between items-center border-b-[3px] border-black">
                    <div className="flex items-center gap-2">
                        <Wrench size={18} />
                        <h2 className="font-black text-sm uppercase">Jadwal Maintenance</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="hover:text-brand-orange transition-colors"
                    >
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                {/* Form */}
                <div className="p-4 space-y-4">
                    {/* Court Selection */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase text-gray-600">
                            Lapangan
                        </label>
                        <select
                            value={courtId}
                            onChange={(e) => setCourtId(e.target.value)}
                            className="border-2 border-black p-2 font-bold text-sm bg-white"
                        >
                            {courts.map((court) => (
                                <option key={court.id} value={court.id}>
                                    {court.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase text-gray-600 flex items-center gap-1">
                            <Calendar size={12} /> Tanggal
                        </label>
                        <input
                            type="date"
                            value={taskDate}
                            onChange={(e) => setTaskDate(e.target.value)}
                            className="border-2 border-black p-2 font-bold text-sm"
                        />
                    </div>

                    {/* Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold uppercase text-gray-600 flex items-center gap-1">
                                <Clock size={12} /> Jam Mulai
                            </label>
                            <select
                                value={startHour}
                                onChange={(e) => setStartHour(parseInt(e.target.value))}
                                className="border-2 border-black p-2 font-bold text-sm bg-white"
                            >
                                {hours.map((h) => (
                                    <option key={h} value={h}>
                                        {h.toString().padStart(2, "0")}:00
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold uppercase text-gray-600">
                                Durasi (Jam)
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={12}
                                value={durationHours}
                                onChange={(e) => setDurationHours(parseInt(e.target.value) || 1)}
                                className="border-2 border-black p-2 font-bold text-sm"
                            />
                        </div>
                    </div>

                    {/* Type */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase text-gray-600">
                            Jenis Maintenance
                        </label>
                        <select
                            value={maintenanceType}
                            onChange={(e) => setMaintenanceType(e.target.value)}
                            className="border-2 border-black p-2 font-bold text-sm bg-white"
                        >
                            {MAINTENANCE_TYPES.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Technician */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase text-gray-600">
                            Teknisi (Opsional)
                        </label>
                        <input
                            type="text"
                            value={technicianName}
                            onChange={(e) => setTechnicianName(e.target.value)}
                            placeholder="Nama teknisi..."
                            className="border-2 border-black p-2 font-bold text-sm"
                        />
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase text-gray-600">
                            Catatan (Opsional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Catatan tambahan..."
                            rows={2}
                            className="border-2 border-black p-2 font-bold text-sm resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t-[3px] border-black bg-gray-50 flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-white text-black font-black py-2.5 text-sm uppercase border-2 border-black hover:bg-gray-100 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !courtId}
                        className="flex-1 bg-gray-800 text-white font-black py-2.5 text-sm uppercase border-2 border-black hover:bg-black transition-colors disabled:opacity-50"
                    >
                        {isSaving ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </div>
        </div>
    );
}

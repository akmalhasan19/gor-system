"use client";

import React, { useState } from "react";
import { useVenue } from "@/lib/venue-context";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { createMaintenanceSchedule, updateMaintenanceSchedule, MaintenanceSchedule } from "@/lib/api/maintenance";
import { Loader2, Save, X } from "lucide-react";

interface MaintenanceScheduleFormProps {
    onClose: () => void;
    onSaved: () => void;
    initialData?: MaintenanceSchedule;
}

export function MaintenanceScheduleForm({
    onClose,
    onSaved,
    initialData
}: MaintenanceScheduleFormProps) {
    const { currentVenueId } = useVenue();
    const { courts } = useAppStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        courtId: initialData?.courtId || courts[0]?.id || "",
        title: initialData?.title || "",
        frequencyDays: initialData?.frequencyDays || 30,
        nextDueDate: initialData?.nextDueDate || new Date().toISOString().split('T')[0],
        costEstimate: initialData?.costEstimate || 0,
    });

    const isEditing = !!initialData;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentVenueId) return;

        setIsSubmitting(true);
        try {
            if (isEditing && initialData) {
                await updateMaintenanceSchedule(initialData.id, {
                    ...formData,
                    costEstimate: Number(formData.costEstimate),
                    frequencyDays: Number(formData.frequencyDays),
                });
                toast.success("Jadwal rutin berhasil diperbarui");
            } else {
                await createMaintenanceSchedule({
                    venueId: currentVenueId,
                    courtId: formData.courtId,
                    title: formData.title,
                    frequencyDays: Number(formData.frequencyDays),
                    nextDueDate: formData.nextDueDate,
                    isActive: true, // Default active
                    costEstimate: Number(formData.costEstimate),
                });
                toast.success("Jadwal rutin berhasil dibuat");
            }
            onSaved();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Gagal menyimpan jadwal");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full border-2 border-black shadow-neo animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b-2 border-black bg-yellow-400">
                    <h2 className="font-black uppercase text-lg">
                        {isEditing ? "Edit Jadwal Rutin" : "Buat Jadwal Rutin"}
                    </h2>
                    <button onClick={onClose} className="hover:bg-black hover:text-white p-1 transition-colors rounded">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Lapangan</label>
                        <select
                            required
                            className="w-full px-3 py-2 border-2 border-black font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            value={formData.courtId}
                            onChange={(e) => setFormData({ ...formData, courtId: e.target.value })}
                        >
                            {courts.map((court) => (
                                <option key={court.id} value={court.id}>
                                    {court.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Nama Kegiatan</label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Poles Lantai, Cek Net, Service AC"
                            className="w-full px-3 py-2 border-2 border-black font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Frekuensi (Hari)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                className="w-full px-3 py-2 border-2 border-black font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                value={formData.frequencyDays}
                                onChange={(e) => setFormData({ ...formData, frequencyDays: Number(e.target.value) })}
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Lakukan setiap {formData.frequencyDays} hari</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Jatuh Tempo Berikutnya</label>
                            <input
                                type="date"
                                required
                                className="w-full px-3 py-2 border-2 border-black font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                value={formData.nextDueDate}
                                onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Estimasi Biaya (Rp)</label>
                        <input
                            type="number"
                            min="0"
                            className="w-full px-3 py-2 border-2 border-black font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            value={formData.costEstimate}
                            onChange={(e) => setFormData({ ...formData, costEstimate: Number(e.target.value) })}
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold border-2 border-transparent hover:bg-gray-100 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 bg-black text-white px-6 py-2 border-2 border-black font-bold text-sm uppercase shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-70"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Simpan Jadwal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useVenue } from "@/lib/venue-context";
import { getVenueSettings, updateVenueSettings, ReminderConfig } from "@/lib/api/reminders";
import { toast } from "sonner";
import { Save, Plus, Trash2, Bell, AlertTriangle, Loader2 } from "lucide-react";

export const ReminderSettingsForm = () => {
    const { currentVenueId } = useVenue();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { register, control, handleSubmit, reset } = useForm<ReminderConfig>({
        defaultValues: {
            warnings: [],
            expired_message_enabled: true
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "warnings"
    });

    useEffect(() => {
        if (currentVenueId) {
            loadSettings();
        }
    }, [currentVenueId]);

    const loadSettings = async () => {
        if (!currentVenueId) return;
        setLoading(true);
        try {
            const { data, error } = await getVenueSettings(currentVenueId);
            if (data) {
                reset(data);
            } else if (error) {
                toast.error("Gagal memuat pengaturan reminder");
                console.error(error);
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: ReminderConfig) => {
        if (!currentVenueId) return;
        setSaving(true);
        try {
            // Sort warnings by days_before (descending)
            data.warnings.sort((a, b) => b.days_before - a.days_before);

            const { success, error } = await updateVenueSettings(currentVenueId, data);
            if (success) {
                toast.success("Pengaturan berhasil disimpan");
            } else {
                toast.error("Gagal menyimpan pengaturan");
                console.error(error);
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan saat menyimpan");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white p-6 border-2 border-black shadow-neo">
                <div className="flex items-center gap-2 mb-4">
                    <Bell className="text-brand-orange" />
                    <h3 className="text-lg font-black uppercase">Peringatan Jatuh Tempo</h3>
                </div>

                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-3 p-3 bg-gray-50 border border-gray-200 rounded">
                            <div className="flex-1">
                                <label className="block text-xs font-bold uppercase mb-1">
                                    Hari Sebelum Expired
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm">H -</span>
                                    <input
                                        type="number"
                                        {...register(`warnings.${index}.days_before`, { valueAsNumber: true, required: true })}
                                        className="w-20 p-2 border border-black font-bold text-center"
                                        placeholder="7"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    {...register(`warnings.${index}.enabled`)}
                                    className="w-4 h-4 accent-black"
                                />
                                <span className="text-sm font-bold">Aktif</span>
                            </div>

                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="mb-1 p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() => append({ days_before: 1, enabled: true })}
                        className="flex items-center gap-2 text-sm font-bold text-brand-orange hover:text-orange-600"
                    >
                        <Plus size={16} />
                        Tambah Peringatan Baru
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 border-2 border-black shadow-neo">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="text-red-600" />
                    <h3 className="text-lg font-black uppercase">Notifikasi Expired</h3>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        {...register("expired_message_enabled")}
                        className="w-5 h-5 accent-black"
                    />
                    <div>
                        <div className="font-bold">Kirim Konfirmasi Expired</div>
                        <div className="text-xs text-gray-500">
                            Mengirim pesan saat membership benar-benar sudah berakhir (H+1)
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-black text-white px-6 py-3 font-bold uppercase hover:bg-gray-800 disabled:opacity-70 shadow-neo"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Simpan Pengaturan
                </button>
            </div>
        </form>
    );
};

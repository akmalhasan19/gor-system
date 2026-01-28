"use client";

import React, { useState } from "react";
import { useVenue } from "@/lib/venue-context";
import { updateVenue } from "@/lib/api/venues";
import { toast } from "sonner";
import { Clock, AlertTriangle, ShieldAlert } from "lucide-react";

export const OperationalSettings = () => {
    const { currentVenue, refreshVenue } = useVenue();
    const [lowQuotaList, setLowQuotaList] = useState<any[]>([]);

    const handleUpdate = async (field: string, value: any) => {
        if (!currentVenue) return;
        try {
            await updateVenue(currentVenue.id, { [field]: value });
            await refreshVenue();
            toast.success("Pengaturan disimpan!");
        } catch (error: any) {
            console.error(error);
            toast.error("Gagal menyimpan: " + (error.message || "Terjadi kesalahan"));
        }
    };

    if (!currentVenue) return <div>Loading...</div>;

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Pengaturan Operasional</h2>
                <p className="text-sm text-gray-500 font-bold">Atur kebijakan booking, toleransi waktu, dan notifikasi.</p>
            </div>

            <div className="grid gap-6">

                {/* Booking Tolerance */}
                <div className="bg-white border-2 border-black p-4 shadow-neo flex flex-col gap-4">
                    <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-2">
                        <div className="bg-blue-100 p-2 rounded-full border-2 border-black">
                            <Clock size={20} className="text-blue-600" />
                        </div>
                        <h3 className="text-lg font-black uppercase">Toleransi Check-in</h3>
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="text-xs text-gray-500 font-bold">
                            Berapa lama booking ditahan jika member belum datang (Check-in)? Lewat dari ini, slot akan otomatis batal (TBD).
                        </p>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                defaultValue={currentVenue.bookingTolerance || 15}
                                onBlur={(e) => handleUpdate('bookingTolerance', parseInt(e.target.value))}
                                className="border-2 border-black p-2 font-bold w-20 text-center"
                            />
                            <span className="font-bold text-sm">Menit</span>
                        </div>
                    </div>
                </div>

                {/* Overtime Policy */}
                <div className="bg-white border-2 border-black p-4 shadow-neo flex flex-col gap-4">
                    <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-2">
                        <div className="bg-orange-100 p-2 rounded-full border-2 border-black">
                            <AlertTriangle size={20} className="text-orange-600" />
                        </div>
                        <h3 className="text-lg font-black uppercase">Kebijakan Overtime</h3>
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="text-xs text-gray-500 font-bold">
                            Apa yang terjadi jika main melebihi jam booking?
                        </p>
                        <select
                            value={currentVenue.overtimePolicy || 'allow'}
                            onChange={(e) => handleUpdate('overtimePolicy', e.target.value)}
                            className="border-2 border-black p-2 font-bold text-sm bg-white"
                        >
                            <option value="allow">Izinkan (Toleransi Wajar)</option>
                            <option value="charge">Charge Denda Otomatis</option>
                            <option value="strict">Strict (Lampu Mati Otomatis)</option>
                        </select>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white border-2 border-black p-4 shadow-neo flex flex-col gap-4">
                    <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-2">
                        <div className="bg-green-100 p-2 rounded-full border-2 border-black">
                            <ShieldAlert size={20} className="text-green-600" />
                        </div>
                        <h3 className="text-lg font-black uppercase">Notifikasi Member</h3>
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="text-xs text-gray-500 font-bold">
                            Jam pengiriman WhatsApp otomatis untuk member dengan sisa kuota 1.
                        </p>
                        <div className="flex items-center gap-2">
                            <input
                                type="time"
                                defaultValue={currentVenue.waNotificationTime || '07:00'}
                                onBlur={(e) => handleUpdate('waNotificationTime', e.target.value)}
                                className="border-2 border-black p-2 font-bold"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-gray-100 pt-2 mt-2">
                        <p className="text-xs text-gray-500 font-bold">
                            Integrasi WhatsApp Gateway (Fonnte)
                        </p>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Masukkan Token Fonnte"
                                defaultValue={currentVenue.fonnteToken || ''}
                                onBlur={(e) => handleUpdate('fonnteToken', e.target.value)}
                                className="border-2 border-black p-2 font-bold w-full text-sm"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 italic">
                            Token ini digunakan untuk mengirim pesan otomatis. Jangan bagikan ke siapapun.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-gray-100 pt-2 mt-2">
                        <p className="text-xs text-gray-500 font-bold">
                            Template Pesan
                        </p>
                        <div className="flex flex-col gap-1">
                            <textarea
                                placeholder="Halo {name}, sisa kuota anda: {quota}"
                                defaultValue={currentVenue.waTemplateReminder || ''}
                                onBlur={(e) => handleUpdate('waTemplateReminder', e.target.value)}
                                className="border-2 border-black p-2 font-bold w-full text-sm h-24"
                            />
                            <p className="text-[10px] text-gray-400 italic">
                                Gunakan <b>{'{name}'}</b> untuk nama member, dan <b>{'{quota}'}</b> untuk sisa kuota.
                            </p>
                        </div>
                    </div>
                </div>



                {/* Manual Triggers (For Testing) */}
                <div className="bg-white border-2 border-black p-4 shadow-neo flex flex-col gap-4">
                    <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-2">
                        <div className="bg-red-100 p-2 rounded-full border-2 border-black">
                            <ShieldAlert size={20} className="text-red-600" />
                        </div>
                        <h3 className="text-lg font-black uppercase">Tools Sistem</h3>
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="text-xs text-gray-500 font-bold">
                            Jalankan pengecekan otomatis secara manual (biasanya berjalan di background).
                        </p>
                        <button
                            onClick={async () => {
                                const { runAutoCancelCheck } = await import("@/lib/utils/auto-cancel");
                                toast.promise(runAutoCancelCheck(currentVenue.id, currentVenue), {
                                    loading: 'Mengecek booking No-Show...',
                                    success: (count) => `Selesai! ${count} booking dibatalkan karena No-Show.`,
                                    error: 'Gagal menjalankan pengecekan.'
                                });
                            }}
                            className="bg-black text-white font-black py-2 px-4 uppercase hover:bg-gray-800 border-2 border-transparent hover:border-black transition-all w-fit text-sm"
                        >
                            Jalankan Cek No-Show Sekarang
                        </button>
                    </div>

                    <div className="flex flex-col gap-2 border-t pt-4 mt-2">
                        <p className="text-xs text-gray-500 font-bold">
                            Cek member dengan sisa kuota 1 (untuk reminder topup).
                        </p>
                        <button
                            onClick={async () => {
                                const { checkLowQuotaMembers, generateQuotaReminderLink } = await import("@/lib/utils/quota-reminder");
                                const toastId = toast.loading("Mengecek member...");
                                try {
                                    const members = await checkLowQuotaMembers(currentVenue.id);
                                    if (members.length === 0) {
                                        toast.success("Tidak ada member dengan sisa kuota 1.", { id: toastId });
                                    } else {
                                        toast.success(`Ditemukan ${members.length} member.`, { id: toastId });
                                        // We could show a modal or list here. For now, let's just log or simplified list display mechanism?
                                        // Ideally we want to render them.
                                        // Let's modify component state to show them?
                                        // We need to upgrade this component to have state for this list.
                                    }
                                    setLowQuotaList(members); // Need to add this state
                                } catch (e: any) {
                                    toast.error("Gagal: " + e.message, { id: toastId });
                                }
                            }}
                            className="bg-black text-white font-black py-2 px-4 uppercase hover:bg-gray-800 border-2 border-transparent hover:border-black transition-all w-fit text-sm"
                        >
                            Cek Kuota Member (Manual)
                        </button>

                        {/* List Display for Low Quota */}
                        {lowQuotaList.length > 0 && (
                            <div className="mt-2 flex flex-col gap-2">
                                {lowQuotaList.map((m: any) => (
                                    <div key={m.id} className="flex justify-between items-center bg-gray-50 p-2 border border-gray-200">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{m.name}</span>
                                            <span className="text-xs text-gray-500">{m.phone}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {currentVenue.fonnteToken ? (
                                                <button
                                                    onClick={async () => {
                                                        const { sendFonnteMessage } = await import("@/lib/utils/quota-reminder");
                                                        const toastId = toast.loading("Mengirim...");
                                                        try {
                                                            const res = await sendFonnteMessage(
                                                                currentVenue.fonnteToken!,
                                                                m.phone.replace(/\D/g, ''),
                                                                currentVenue.waTemplateReminder
                                                                    ? currentVenue.waTemplateReminder.replace('{name}', m.name).replace('{quota}', m.quota)
                                                                    : `Halo ${m.name}, reminder sisa kuota: ${m.quota}`
                                                            );
                                                            if (res.status === true || res.token) { // Fonnte success checks
                                                                toast.success("Terkirim!", { id: toastId });
                                                            } else {
                                                                toast.error("Gagal: " + (res.reason || 'Unknown'), { id: toastId });
                                                            }
                                                        } catch (e: any) {
                                                            toast.error("Error: " + e.message, { id: toastId });
                                                        }
                                                    }}
                                                    className="bg-blue-600 text-white text-xs font-bold px-2 py-1 uppercase rounded hover:bg-blue-700"
                                                >
                                                    Kirim Otomatis
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={async () => {
                                                        const { generateQuotaReminderLink } = await import("@/lib/utils/quota-reminder");
                                                        const link = generateQuotaReminderLink(m);
                                                        window.open(link, '_blank');
                                                    }}
                                                    className="bg-green-500 text-white text-xs font-bold px-2 py-1 uppercase rounded hover:bg-green-600"
                                                >
                                                    Kirim WA
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

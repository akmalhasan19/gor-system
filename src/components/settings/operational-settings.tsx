"use client";

import React from "react";
import { useVenue } from "@/lib/venue-context";
import { updateVenue } from "@/lib/api/venues";
import { toast } from "sonner";
import { Clock, AlertTriangle, ShieldAlert } from "lucide-react";

export const OperationalSettings = () => {
    const { currentVenue, refreshVenue } = useVenue();

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

                {/* Win-back Promo Settings */}
                <div className="bg-white border-2 border-black p-4 shadow-neo flex flex-col gap-4">
                    <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-2">
                        <div className="bg-purple-100 p-2 rounded-full border-2 border-black">
                            <ShieldAlert size={20} className="text-purple-600" />
                        </div>
                        <h3 className="text-lg font-black uppercase">Win-back Promo</h3>
                    </div>
                    <div className="flex flex-col gap-4">
                        <p className="text-xs text-gray-500 font-bold">
                            Konfigurasi promo untuk menarik kembali member yang berisiko churn.
                        </p>

                        {/* Promo Code Prefix */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold uppercase text-gray-600">Prefix Kode Promo</label>
                            <input
                                type="text"
                                placeholder="COMEBACK"
                                defaultValue={currentVenue.winbackConfiguration?.promo_code_prefix || 'COMEBACK'}
                                onBlur={(e) => handleUpdate('winbackConfiguration', {
                                    ...currentVenue.winbackConfiguration,
                                    promo_code_prefix: e.target.value
                                })}
                                className="border-2 border-black p-2 font-bold text-sm"
                            />
                            <p className="text-[10px] text-gray-400 italic">
                                Contoh hasil: COMEBACK-ABC123
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Default Discount */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold uppercase text-gray-600">Diskon (%)</label>
                                <input
                                    type="number"
                                    min="5"
                                    max="50"
                                    defaultValue={currentVenue.winbackConfiguration?.default_discount_percent || 15}
                                    onBlur={(e) => handleUpdate('winbackConfiguration', {
                                        ...currentVenue.winbackConfiguration,
                                        default_discount_percent: parseInt(e.target.value)
                                    })}
                                    className="border-2 border-black p-2 font-bold text-sm"
                                />
                            </div>

                            {/* Validity Days */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold uppercase text-gray-600">Berlaku (Hari)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    defaultValue={currentVenue.winbackConfiguration?.validity_days || 7}
                                    onBlur={(e) => handleUpdate('winbackConfiguration', {
                                        ...currentVenue.winbackConfiguration,
                                        validity_days: parseInt(e.target.value)
                                    })}
                                    className="border-2 border-black p-2 font-bold text-sm"
                                />
                            </div>
                        </div>

                        {/* Message Template */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold uppercase text-gray-600">Template Pesan Win-back</label>
                            <textarea
                                placeholder="Halo {name}! 👋 Gunakan kode promo *{promo_code}*..."
                                defaultValue={currentVenue.winbackConfiguration?.message_template || 'Halo {name}! 👋\n\nKami kangen sama kamu di {venue}! 🏸\n\nGunakan kode promo *{promo_code}* untuk dapat diskon *{discount}%* booking lapangan.\n\nBerlaku sampai {valid_until}.\n\nYuk main lagi! 💪'}
                                onBlur={(e) => handleUpdate('winbackConfiguration', {
                                    ...currentVenue.winbackConfiguration,
                                    message_template: e.target.value
                                })}
                                className="border-2 border-black p-2 font-bold w-full text-sm h-32"
                            />
                            <p className="text-[10px] text-gray-400 italic">
                                Variable: <b>{'{name}'}</b>, <b>{'{venue}'}</b>, <b>{'{promo_code}'}</b>, <b>{'{discount}'}</b>, <b>{'{valid_until}'}</b>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


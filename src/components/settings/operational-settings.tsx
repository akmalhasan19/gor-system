"use client";

import React from "react";
import { useVenue } from "@/lib/venue-context";
import { updateVenue } from "@/lib/api/venues";
import { toast } from "sonner";
import { Clock, AlertTriangle, ShieldAlert, QrCode, Loader2, CheckCircle, Trash2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getCsrfHeaders } from '@/lib/hooks/use-csrf';
import { supabase } from "@/lib/supabase";

export const OperationalSettings = () => {
    const { currentVenue, refreshVenue } = useVenue();
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [waLoading, setWaLoading] = useState(false);

    // Realtime subscription for status updates
    useEffect(() => {
        if (!currentVenue) return;

        // Subscribe to changes on this venue
        const channel = supabase
            .channel(`venue_status_${currentVenue.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'venues',
                    filter: `id=eq.${currentVenue.id}`
                },
                (payload) => {
                    const newStatus = payload.new.wa_status;
                    if (newStatus !== currentVenue.waStatus) {
                        refreshVenue();
                        if (newStatus === 'disconnected' && currentVenue.waStatus === 'connected') {
                            toast.info("WhatsApp terputus (terdeteksi via Realtime).");
                        } else if (newStatus === 'connected') {
                            setQrCode(null);
                            toast.success("WhatsApp Terhubung!");
                        }
                    }
                }
            )
            .subscribe();

        // Initial check (once) to ensure we are up to date
        // And optional lightweight heartbeat (every 30s) instead of 5s
        const checkWaStatus = async () => {
            try {
                const res = await fetch('/api/whatsapp/status', {
                    method: 'POST',
                    headers: getCsrfHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ venueId: currentVenue.id })
                });
                const data = await res.json();
                if (data.status && data.status !== currentVenue.waStatus) {
                    refreshVenue();
                }
            } catch (e) { console.error("Heartbeat failed", e); }
        };

        checkWaStatus();
        const heartbeat = setInterval(checkWaStatus, 30000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(heartbeat);
        };
    }, [currentVenue?.id, currentVenue?.waStatus]);

    const handleConnectWA = async () => {
        if (!currentVenue) return;
        setWaLoading(true);
        try {
            const res = await fetch('/api/whatsapp/connect', {
                method: 'POST',
                headers: getCsrfHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ venueId: currentVenue.id })
            });
            const data = await res.json();

            if (data.qrCode) {
                setQrCode(data.qrCode);
            } else if (data.status === 'connected') {
                refreshVenue();
            } else {
                toast.error(data.error || "Gagal menghubungkan WhatsApp");
            }
        } catch (e) {
            toast.error("Terjadi kesalahan koneksi");
        } finally {
            setWaLoading(false);
        }
    };

    const handleDisconnectWA = async () => {
        if (!currentVenue || !confirm("Yakin ingin memutuskan koneksi WhatsApp? Notifikasi tidak akan berjalan.")) return;
        setWaLoading(true);
        try {
            await fetch('/api/whatsapp/disconnect', {
                method: 'POST',
                headers: getCsrfHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ venueId: currentVenue.id })
            });
            setQrCode(null);
            refreshVenue();
            toast.success("WhatsApp terputus");
        } catch (e) {
            toast.error("Gagal disconnect");
        } finally {
            setWaLoading(false);
        }
    };

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

                    <div className="flex flex-col gap-4 border-t border-gray-100 pt-4 mt-2">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-black uppercase text-gray-700">
                                Integrasi WhatsApp Gateway
                            </p>
                            {currentVenue.waStatus === 'connected' && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                    <CheckCircle size={12} /> Connected
                                </span>
                            )}
                        </div>

                        {currentVenue.waStatus === 'connected' ? (
                            <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-200 p-2 rounded-full">
                                        <CheckCircle className="text-green-700" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-green-800 text-sm">WhatsApp Terhubung</h4>
                                        <p className="text-xs text-green-600">Device ID: {currentVenue.waDeviceId}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDisconnectWA}
                                    disabled={waLoading}
                                    className="h-8 text-xs bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                                >
                                    {waLoading ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                                    <span className="ml-2">Putuskan</span>
                                </Button>
                            </div>
                        ) : (
                            <div className="bg-gray-50 border-2 border-gray-200 p-6 rounded-lg text-center flex flex-col items-center justify-center gap-4">
                                {qrCode ? (
                                    <div className="flex flex-col items-center animate-in fade-in duration-300">
                                        <h4 className="font-bold text-gray-800 text-lg mb-2">Scan QR Code</h4>
                                        <p className="text-xs text-gray-500 mb-4 max-w-[200px]">
                                            Buka WhatsApp di HP Anda &gt; Menu &gt; Perangkat Tertaut &gt; Tautkan Perangkat
                                        </p>
                                        <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-sm">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={qrCode.startsWith('http') || qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                                                alt="Scan QR"
                                                className="w-[200px] h-[200px] object-contain"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 mt-4 text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                            <Loader2 className="animate-spin" size={12} />
                                            Menunggu scan...
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-white p-4 rounded-full border border-gray-200 shadow-sm">
                                            <QrCode size={48} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">Hubungkan WhatsApp GOR</h4>
                                            <p className="text-xs text-gray-500 max-w-[250px] mx-auto mt-1">
                                                Gunakan nomor WhatsApp GOR Anda untuk mengirim notifikasi otomatis ke member.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleConnectWA}
                                            disabled={waLoading}
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold"
                                        >
                                            {waLoading ? (
                                                <>
                                                    <Loader2 className="animate-spin mr-2" size={16} /> Connecting...
                                                </>
                                            ) : (
                                                "Hubungkan Sekarang"
                                            )}
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
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


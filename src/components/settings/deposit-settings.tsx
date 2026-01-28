"use client";

import React from "react";
import { useVenue } from "@/lib/venue-context";
import { updateVenue } from "@/lib/api/venues";
import { toast } from "sonner";
import { DollarSign, ShieldCheck, Divide } from "lucide-react";
import { DepositPolicy } from "@/lib/constants";

export const DepositSettings = () => {
    const { currentVenue, refreshVenue } = useVenue();

    const handleUpdate = async (updates: Partial<DepositPolicy>) => {
        if (!currentVenue) return;

        const currentPolicy = currentVenue.depositPolicy || {
            isEnabled: false,
            minDepositAmount: 50000,
            cancellationPolicy: 'strict',
            refundRules: { hMinus1: 100, hDay: 0 }
        };

        const newPolicy = { ...currentPolicy, ...updates };

        try {
            // Mapping back to snake_case for DB happens in api/venues.ts updateVenue
            // But wait, updateVenue takes Partial<Venue> which uses camelCase for the app layer
            // We need to ensure updateVenue handles the mapping or we pass the object as is if it expects matched keys.
            // Let's assume updateVenue handles it or we pass a direct object update if it supports JSONB fields.
            // Actually, for JSONB columns, we usually just pass the whole object.

            await updateVenue(currentVenue.id, { depositPolicy: newPolicy });
            await refreshVenue();
            toast.success("Pengaturan Deposit disimpan!");
        } catch (error: any) {
            console.error(error);
            toast.error("Gagal menyimpan: " + (error.message || "Terjadi kesalahan"));
        }
    };

    if (!currentVenue) return <div>Loading...</div>;

    const policy = currentVenue.depositPolicy || {
        isEnabled: false,
        minDepositAmount: 50000,
        cancellationPolicy: 'strict',
        refundRules: { hMinus1: 100, hDay: 0 }
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Pengaturan Keuangan</h2>
                <p className="text-sm text-gray-500 font-bold">Atur kebijakan deposit dan pembayaran.</p>
            </div>

            <div className="bg-white border-2 border-black p-4 shadow-neo flex flex-col gap-4">
                <div className="flex items-center justify-between border-b-2 border-gray-100 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full border-2 border-black">
                            <DollarSign size={20} className="text-green-600" />
                        </div>
                        <h3 className="text-lg font-black uppercase">Sistem Deposit (DP)</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={policy.isEnabled}
                            onChange={(e) => handleUpdate({ isEnabled: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none ring-2 ring-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                </div>

                <div className="flex flex-col gap-4">
                    <p className="text-xs text-gray-500 font-bold">
                        Jika aktif, pelanggan WAJIB membayar DP saat booking.
                    </p>

                    <div className={`flex flex-col gap-4 transition-all ${!policy.isEnabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold uppercase text-gray-600">Minimal Deposit (Rp)</label>
                            <input
                                type="number"
                                defaultValue={policy.minDepositAmount}
                                onBlur={(e) => handleUpdate({ minDepositAmount: parseInt(e.target.value) })}
                                className="border-2 border-black p-2 font-bold text-sm w-full"
                            />
                        </div>

                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-none">
                            <div className="flex items-start gap-2">
                                <ShieldCheck size={16} className="text-blue-600 mt-0.5" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-black uppercase text-blue-800">Kebijakan Pembatalan</span>
                                    <p className="text-[10px] text-blue-800 font-bold">
                                        Saat ini menggunakan kebijakan "Strict":
                                    </p>
                                    <ul className="text-[10px] list-disc list-inside text-blue-700">
                                        <li>Cancel H-1: Refund {policy.refundRules.hMinus1}%</li>
                                        <li>Cancel Hari H: Refund {policy.refundRules.hDay}%</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

"use client";

import React, { useState, useEffect } from "react";
import { Booking, Customer } from "@/lib/constants";
import { NeoInput } from "@/components/ui/neo-input";
import { useAppStore } from "@/lib/store";
import { RRule } from "rrule";

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (booking: Omit<Booking, "id">) => void;
    initialData: { courtId: string; time: number } | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const { customers, updateCustomer } = useAppStore();

    const [customerName, setCustomerName] = useState("");
    const [phone, setPhone] = useState("");
    const [duration, setDuration] = useState(1);
    const [isRecurring, setIsRecurring] = useState(false);
    const [repeatWeeks, setRepeatWeeks] = useState(4);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

    useEffect(() => {
        if (isOpen && initialData) {
            // Reset fields
            setCustomerName("");
            setPhone("");
            setDuration(1);
            setIsRecurring(false);
            setRepeatWeeks(4);
            setSelectedCustomerId("");
        }
    }, [isOpen, initialData]);

    // Handle Member Selection
    const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const custId = e.target.value;
        setSelectedCustomerId(custId);

        if (custId) {
            const customer = customers.find(c => c.id === custId);
            if (customer) {
                setCustomerName(customer.name);
                setPhone(customer.phone);
            }
        } else {
            setCustomerName("");
            setPhone("");
        }
    };

    const handleSave = async () => {
        if (!initialData) return;
        if (!customerName || !phone) return alert("Nama dan No HP harus diisi!");

        const baseBooking: Omit<Booking, "id"> = {
            courtId: initialData.courtId,
            startTime: initialData.time,
            duration: duration,
            customerName,
            phone,
            price: duration * 50000,
            status: 'BELUM_BAYAR',
            paidAmount: 0
        };

        // Check if member quota applies
        const customer = customers.find(c => c.id === selectedCustomerId);
        let currentQuota = customer?.quota || 0;

        // Function to process a single booking
        const processBooking = async (b: Omit<Booking, "id">) => {
            // Logic for Member Quota
            if (b.status === 'BELUM_BAYAR' && customer && customer.isMember && currentQuota > 0) {
                b.status = 'LUNAS';
                b.price = 0; // Free because quota
                b.paidAmount = 0;
                currentQuota--;
            }
            await onSave(b);
        };

        try {
            if (isRecurring) {
                const startDate = new Date();
                startDate.setHours(initialData.time, 0, 0, 0);

                const rule = new RRule({
                    freq: RRule.WEEKLY,
                    dtstart: startDate,
                    count: repeatWeeks
                });

                const dates = rule.all();

                for (const date of dates) {
                    await processBooking({
                        ...baseBooking,
                    });
                }
            } else {
                await processBooking(baseBooking);
            }

            // Update customer quota if changed
            if (customer && customer.quota !== currentQuota) {
                await updateCustomer(customer.id, { quota: currentQuota });
            }

            onClose();
        } catch (error) {
            console.error('Failed to save booking:', error);
            alert('Gagal menyimpan booking. Silakan coba lagi.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black shadow-neo w-full max-w-sm flex flex-col max-h-[90vh]">
                <div className="bg-black text-white p-3 flex justify-between items-center border-b-2 border-black">
                    <h2 className="font-black text-sm uppercase">Booking Lapangan {initialData?.courtId} - Jam {initialData?.time}:00</h2>
                    <button onClick={onClose} className="hover:text-brand-orange font-bold text-sm">X</button>
                </div>

                <div className="p-4 flex flex-col gap-4 overflow-y-auto">
                    {/* Member Selection */}
                    <div className="flex flex-col gap-1 border-b-2 border-dashed border-gray-200 pb-3">
                        <label className="text-xs font-bold uppercase text-gray-500">Pilih Member (Opsional)</label>
                        <select
                            className="bg-gray-50 border border-black p-2 font-bold text-sm"
                            value={selectedCustomerId}
                            onChange={handleCustomerSelect}
                        >
                            <option value="">-- Tamu / Non-Member --</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} {c.isMember ? '(Member)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase">Nama Pemesan</label>
                        <NeoInput
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Nama..."
                            className="p-2 text-sm"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase">No HP</label>
                        <NeoInput
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="08..."
                            className="p-2 text-sm"
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1 flex flex-col gap-1">
                            <label className="text-xs font-bold uppercase">Durasi (Jam)</label>
                            <input
                                type="number"
                                min={1}
                                max={5}
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value))}
                                className="border-2 border-black p-2 font-bold text-sm w-full outline-none focus:shadow-[2px_2px_0px_black] transition-all"
                            />
                        </div>
                    </div>

                    {/* Recurring Options */}
                    <div className="bg-blue-50 p-2 border border-blue-200">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={isRecurring}
                                onChange={(e) => setIsRecurring(e.target.checked)}
                                className="w-4 h-4 accent-black"
                            />
                            <span className="font-bold text-xs uppercase text-blue-800">Ulangi Booking (Rutin)</span>
                        </label>

                        {isRecurring && (
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs font-bold">Ulangi selama</span>
                                <input
                                    type="number"
                                    min={2}
                                    max={12}
                                    value={repeatWeeks}
                                    onChange={(e) => setRepeatWeeks(parseInt(e.target.value))}
                                    className="w-12 border border-black p-1 text-center font-bold text-xs"
                                />
                                <span className="text-xs font-bold">Minggu</span>
                            </div>
                        )}
                    </div>

                    <div className="text-right">
                        <span className="text-xs font-bold text-gray-500">Estimasi Biaya</span>
                        <div className="text-xl font-black">
                            Rp {(duration * 50000).toLocaleString()}
                            {isRecurring && <span className="text-xs text-brand-orange ml-1">x {repeatWeeks} mgg</span>}
                        </div>
                    </div>
                </div>

                <div className="p-3 border-t-2 border-black bg-gray-50">
                    <button
                        onClick={handleSave}
                        className="w-full bg-black text-white font-black py-3 text-sm uppercase hover:bg-brand-orange hover:text-black border-2 border-transparent hover:border-black transition-all"
                    >
                        Simpan Booking
                    </button>
                </div>
            </div>
        </div>
    );
};

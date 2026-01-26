"use client";

import React, { useState } from "react";
import { X, Save, CheckCircle2 } from "lucide-react";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoInput } from "@/components/ui/neo-input";
import { COURTS, Booking } from "@/lib/constants";

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (booking: Omit<Booking, "id">) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
    isOpen,
    onClose,
    onSave,
}) => {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        courtId: 1,
        time: "19:00",
        duration: 1,
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            customerName: formData.name,
            phone: formData.phone,
            courtId: formData.courtId,
            startTime: parseInt(formData.time.split(":")[0]),
            duration: formData.duration,
            status: "BELUM_BAYAR",
            price: formData.duration * 50000,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative bg-white w-full max-w-sm h-full max-h-[95vh] overflow-hidden flex flex-col border-t-2 md:border-2 border-black shadow-neo animate-in slide-in-from-bottom-5">

                <div className="flex justify-between items-center p-3 border-b-2 border-black bg-brand-lime">
                    <h2 className="text-lg font-black uppercase flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6" /> Input Booking
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 border-2 border-black bg-white active:translate-y-1 transition-transform"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 pb-24">
                    <form id="bookingForm" onSubmit={handleSubmit}>
                        <NeoInput
                            id="name"
                            label="Nama Pemesan"
                            placeholder="Contoh: Pak Budi"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            autoFocus
                            required
                            className="p-2 text-sm"
                        />

                        <NeoInput
                            id="phone"
                            label="Nomor HP (WhatsApp)"
                            type="tel"
                            placeholder="08..."
                            value={formData.phone}
                            onChange={(e) =>
                                setFormData({ ...formData, phone: e.target.value })
                            }
                            className="p-2 text-sm"
                        />

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block font-bold text-xs mb-1 uppercase">
                                    Lapangan
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full border-2 border-black p-2 text-sm font-bold appearance-none rounded-none bg-white"
                                        value={formData.courtId}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                courtId: Number(e.target.value),
                                            })
                                        }
                                    >
                                        {COURTS.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-sm">
                                        ▼
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-xs mb-1 uppercase">
                                    Durasi
                                </label>
                                <div className="flex items-center">
                                    <button
                                        type="button"
                                        className="h-[40px] w-[32px] border-2 border-black bg-gray-100 font-bold text-sm active:bg-gray-300 flex items-center justify-center"
                                        onClick={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                duration: Math.max(1, prev.duration - 1),
                                            }))
                                        }
                                    >
                                        -
                                    </button>
                                    <div className="h-[40px] flex-1 flex items-center justify-center border-t-2 border-b-2 border-black font-bold text-sm">
                                        {formData.duration} Jam
                                    </div>
                                    <button
                                        type="button"
                                        className="h-[40px] w-[32px] border-2 border-black bg-gray-100 font-bold text-sm active:bg-gray-300 flex items-center justify-center"
                                        onClick={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                duration: prev.duration + 1,
                                            }))
                                        }
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold text-xs mb-1 uppercase">
                                Jam Main
                            </label>
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                {["08:00", "19:00", "20:00", "21:00"].map((time) => (
                                    <button
                                        key={time}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, time })}
                                        className={`p-2 border-2 border-black font-bold text-[10px] ${formData.time === time
                                            ? "bg-black text-white"
                                            : "bg-white hover:bg-gray-100"
                                            }`}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="time"
                                className="w-full border-2 border-black p-2 text-sm font-bold"
                                value={formData.time}
                                onChange={(e) =>
                                    setFormData({ ...formData, time: e.target.value })
                                }
                            />
                        </div>
                    </form>
                </div>

                {/* Sticky Footer */}
                <div className="p-4 border-t-2 border-black bg-white absolute bottom-0 w-full">
                    <NeoButton
                        type="submit"
                        form="bookingForm"
                        className="w-full py-2 text-sm"
                        icon={<Save size={16} />}
                    >
                        SIMPAN
                    </NeoButton>
                </div>
            </div>
        </div>
    );
};

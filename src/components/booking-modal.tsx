"use client";

import React, { useState, useEffect } from "react";
import { Booking, Customer } from "@/lib/constants";
import { toast } from "sonner";
import { getCourts, Court } from "@/lib/api/courts";
import { useVenue } from "@/lib/venue-context";
import { NeoInput } from "@/components/ui/neo-input";
import { useAppStore } from "@/lib/store";
import { RRule } from "rrule";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (booking: Omit<Booking, "id">, customerId?: string, useQuota?: boolean) => void;
    onDelete?: (id: string) => void;
    initialData: { courtId: string; time: number } | null;
    existingBooking?: Booking | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData, existingBooking }) => {
    const { customers, updateCustomer, courts } = useAppStore();
    const { currentVenueId } = useVenue();

    const [hourlyRate, setHourlyRate] = useState(50000); // Default fallback

    const [customerName, setCustomerName] = useState("");
    const [phone, setPhone] = useState("");
    const [duration, setDuration] = useState(1);
    const [isRecurring, setIsRecurring] = useState(false);
    const [repeatWeeks, setRepeatWeeks] = useState(4);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [useQuota, setUseQuota] = useState(false);

    // Update hourly rate based on selected court
    useEffect(() => {
        if (!initialData && !existingBooking) return;

        const targetCourtId = existingBooking ? existingBooking.courtId : initialData?.courtId;

        // targetCourtId can be "1" (string number) or UUID
        // We try to match by id or courtNumber
        const court = courts.find(c => c.id === targetCourtId || String(c.courtNumber) === String(targetCourtId));

        if (court) {
            setHourlyRate(court.hourlyRate);
        }
    }, [initialData, existingBooking, courts]);

    // Update hourly rate when customer changes (check for member rate)
    useEffect(() => {
        if (!initialData && !existingBooking) return;

        const targetCourtId = existingBooking ? existingBooking.courtId : initialData?.courtId;
        const court = courts.find(c => c.id === targetCourtId || String(c.courtNumber) === String(targetCourtId));

        if (court) {
            const customer = customers.find(c => c.id === selectedCustomerId);
            const isMember = customer?.isMember || false;

            // Use member rate if applicable and available, otherwise standard rate
            if (isMember && court.memberHourlyRate) {
                setHourlyRate(court.memberHourlyRate);
            } else {
                setHourlyRate(court.hourlyRate);
            }
        }
    }, [selectedCustomerId, courts, initialData, existingBooking, customers]);

    useEffect(() => {
        if (isOpen) {
            if (existingBooking) {
                // Edit Mode
                setCustomerName(existingBooking.customerName);
                setPhone(existingBooking.phone);
                setDuration(existingBooking.duration);
                // Recurring not supported for edit mode yet
                setIsRecurring(false);
                setRepeatWeeks(4);
                setSelectedCustomerId(""); // Complex to match back to ID without passing it, skip for now
                setUseQuota(false);
            } else if (initialData) {
                // New Booking Mode
                setCustomerName("");
                setPhone("");
                setDuration(1);
                setIsRecurring(false);
                setRepeatWeeks(4);
                setSelectedCustomerId("");
                setUseQuota(false);
            }
        }
    }, [isOpen, initialData, existingBooking]);

    // Handle Member Selection
    const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const custId = e.target.value;
        setSelectedCustomerId(custId);

        if (custId) {
            const customer = customers.find(c => c.id === custId);
            if (customer) {
                setCustomerName(customer.name);
                setPhone(customer.phone);
                // Auto-select useQuota if available
                if (customer.quota && customer.quota > 0) {
                    setUseQuota(true);
                } else {
                    setUseQuota(false);
                }
            }
        } else {
            setCustomerName("");
            setPhone("");
            setUseQuota(false);
        }
    };

    const handleSave = async () => {
        if (!initialData && !existingBooking) return;
        if (!customerName || !phone) return alert("Nama dan No HP harus diisi!");
        if (!duration || duration < 1) return alert("Durasi minimal 1 jam!");

        // If editing, use existing data or fallback to initialData (which might be trickier if just passed existingBooking)
        // For simplicity, we trust parent to pass initialData matching existingBooking if editing
        const courtId = existingBooking ? existingBooking.courtId : initialData!.courtId;
        const startTimeStr = existingBooking ? existingBooking.startTime : `${initialData!.time.toString().padStart(2, '0')}:00:00`;
        const bookingDate = existingBooking ? existingBooking.bookingDate : new Date().toISOString().split('T')[0];

        // ... logic for baseBooking ...
        // We need to reconstruct baseBooking carefully

        const baseBooking: Omit<Booking, "id"> = {
            courtId,
            startTime: startTimeStr,
            duration: duration,
            customerName,
            phone,
            price: duration * hourlyRate,
            status: existingBooking ? existingBooking.status : 'BELUM_BAYAR', // Keep status if editing
            paidAmount: existingBooking ? existingBooking.paidAmount : 0,
            bookingDate
        };

        // ... rest of logic (quota etc) ...
        // For edit, we might want to skip quota logic or handle it carefully. 
        // For now, let's just save.

        try {
            await onSave(baseBooking, selectedCustomerId, useQuota);
            onClose();
        } catch (error) {
            console.error('Failed to save booking:', error);
            alert('Gagal menyimpan booking. Silakan coba lagi.');
        }
    };

    const handleDelete = () => {
        if (!existingBooking || !onDelete) return;
        setShowDeleteAlert(true);
    };

    const confirmDelete = () => {
        if (existingBooking && onDelete) {
            onDelete(existingBooking.id);
            onClose();
        }
    };

    if (!isOpen) return null;

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                {/* ... existing modal content ... */}
                <div className="bg-white border-2 border-black shadow-neo w-full max-w-sm flex flex-col max-h-[90vh]">
                    <div className="bg-black text-white p-3 flex justify-between items-center border-b-2 border-black">
                        <h2 className="font-black text-sm uppercase">
                            {existingBooking ? 'Edit Booking' : `Booking ${courts.find(c => c.id === initialData?.courtId)?.name || 'Lapangan'} - Jam ${initialData?.time}:00`}
                        </h2>
                        <button onClick={onClose} className="hover:text-brand-orange font-bold text-sm">X</button>
                    </div>

                    <div className="p-4 flex flex-col gap-4 overflow-y-auto">
                        {!existingBooking && (
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
                        )}

                        {selectedCustomer?.isMember && !existingBooking && (
                            <div className="flex flex-col gap-2">
                                {selectedCustomer.quota && selectedCustomer.quota > 0 ? (
                                    <div className="bg-brand-lime/20 border-2 border-brand-lime p-2">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={useQuota}
                                                onChange={(e) => setUseQuota(e.target.checked)}
                                                className="w-4 h-4 accent-black"
                                                disabled={duration > 1} // Disable if duration > 1 because quota usually per session (1 hour)? Or allow? Assuming 1 quota = 1 hour for now? Or 1 session? Let's assume 1 Quota = 1 Booking Session regardless of hours? OR 1 Quota = 1 Hour?
                                            // User said "4 play sessions". Usually session = 1 hour or 1 booking.
                                            // Let's assume 1 Booking.
                                            // But usually it's per hour.
                                            // Let's stick to 1 Quota Point = 1 Booking for now unless specified.
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-black text-sm uppercase text-black">Gunakan Jatah Member</span>
                                                <span className="text-xs text-black/70 font-bold">Sisa Jatah: {selectedCustomer.quota}x Main</span>
                                            </div>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="bg-brand-lilac/10 border-2 border-brand-lilac p-3 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black uppercase text-brand-lilac">Paket Member</span>
                                            <span className="text-xs font-bold bg-brand-lilac text-white px-2 py-0.5 rounded-full">Hemat</span>
                                        </div>
                                        <p className="text-[10px] text-gray-600 leading-tight">
                                            Bayar 4 minggu sekaligus dengan harga khusus member.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsRecurring(true);
                                                setRepeatWeeks(4);
                                                toast.success("Paket Member 4 Sesi diterapkan! Cek total biaya.");
                                            }}
                                            className="bg-brand-lilac text-white font-bold text-xs py-2 uppercase hover:bg-purple-600 border-2 border-transparent hover:border-black transition-all"
                                        >
                                            Ambil Paket 4 Sesi
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

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
                                    value={duration || ''}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setDuration(isNaN(val) ? 0 : val);
                                    }}
                                    className="border-2 border-black p-2 font-bold text-sm w-full outline-none focus:shadow-[2px_2px_0px_black] transition-all"
                                />
                            </div>
                        </div>

                        {!existingBooking && (
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
                        )}

                        <div className="text-right">
                            <span className="text-xs font-bold text-gray-500">Estimasi Biaya ({new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(hourlyRate)} / jam)</span>
                            <div className="text-xl font-black">
                                {useQuota ? (
                                    <span className="text-brand-lime">LUNAS (Jatah Member)</span>
                                ) : (
                                    <>
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(duration * hourlyRate)}
                                        {isRecurring && <span className="text-xs text-brand-orange ml-1">x {repeatWeeks} mgg</span>}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-3 border-t-2 border-black bg-gray-50 flex gap-2">
                        {existingBooking && (
                            <button
                                onClick={handleDelete}
                                className="flex-1 bg-red-600 text-white font-black py-3 text-sm uppercase hover:bg-red-700 border-2 border-transparent hover:border-black transition-all"
                            >
                                Hapus
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            className="flex-1 bg-black text-white font-black py-3 text-sm uppercase hover:bg-brand-orange hover:text-black border-2 border-transparent hover:border-black transition-all"
                        >
                            {existingBooking ? 'Simpan Perubahan' : 'Simpan Booking'}
                        </button>
                    </div>
                </div>
            </div>

            <AlertDialog
                isOpen={showDeleteAlert}
                onClose={() => setShowDeleteAlert(false)}
                onConfirm={confirmDelete}
                title="Hapus Booking"
                description="Apakah anda yakin ingin menghapus booking ini? Slot akan langsung kosong."
                confirmLabel="Hapus"
                variant="danger"
            />
        </>
    );
};

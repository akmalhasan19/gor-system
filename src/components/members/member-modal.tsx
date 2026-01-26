"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Customer } from "@/lib/constants";
import { NeoInput } from "@/components/ui/neo-input";

interface MemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Customer;
}

export const MemberModal: React.FC<MemberModalProps> = ({ isOpen, onClose, initialData }) => {
    const { addCustomer, updateCustomer } = useAppStore();

    // Form State
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [isMember, setIsMember] = useState(false);
    const [quota, setQuota] = useState(0);
    const [expiry, setExpiry] = useState("");

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setPhone(initialData.phone);
            setIsMember(initialData.isMember);
            setQuota(initialData.quota || 0);
            setExpiry(initialData.membershipExpiry || "");
        } else {
            // Reset for new
            setName("");
            setPhone("");
            setIsMember(false);
            setQuota(0);
            setExpiry("");
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name || !phone) return alert("Nama dan No HP wajib diisi!");

        const customerData: Omit<Customer, 'id'> = {
            name,
            phone,
            isMember,
            quota: isMember ? quota : undefined,
            membershipExpiry: isMember ? expiry : undefined
        };

        try {
            if (initialData) {
                await updateCustomer(initialData.id, customerData);
                alert('Data pelanggan berhasil diupdate!');
            } else {
                await addCustomer(customerData);
                alert('Pelanggan baru berhasil ditambahkan!');
            }
            onClose();
        } catch (error) {
            console.error('Failed to save customer:', error);
            alert('Gagal menyimpan data pelanggan. Silakan coba lagi.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black shadow-neo w-full max-w-md flex flex-col max-h-[90vh]">
                <div className="bg-black text-white p-3 flex justify-between items-center border-b-2 border-black">
                    <h2 className="font-black text-sm uppercase">
                        {initialData ? "Edit Pelanggan" : "Tambah Pelanggan"}
                    </h2>
                    <button onClick={onClose} className="hover:text-brand-orange font-bold text-sm">X</button>
                </div>

                <div className="p-4 flex flex-col gap-4 overflow-y-auto">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase">Nama Lengkap</label>
                        <NeoInput
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: Pak Budi"
                            className="p-2 text-sm"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase">No Handphone</label>
                        <NeoInput
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="0812..."
                            className="p-2 text-sm"
                        />
                    </div>

                    <div className="p-3 bg-gray-50 border-2 border-black border-dashed flex flex-col gap-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={isMember}
                                onChange={(e) => setIsMember(e.target.checked)}
                                className="w-5 h-5 accent-black"
                            />
                            <span className="font-black uppercase text-sm">Aktifkan Membership</span>
                        </label>

                        {isMember && (
                            <div className="pl-7 space-y-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold uppercase">Jatah Main (Quota)</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setQuota(Math.max(0, quota - 1))}
                                            className="w-8 h-8 flex items-center justify-center border border-black bg-white hover:bg-gray-100 font-bold"
                                        >-</button>
                                        <input
                                            type="number"
                                            value={quota}
                                            onChange={(e) => setQuota(parseInt(e.target.value) || 0)}
                                            className="flex-1 w-full border border-black px-2 font-bold text-center"
                                        />
                                        <button
                                            onClick={() => setQuota(quota + 1)}
                                            className="w-8 h-8 flex items-center justify-center border border-black bg-white hover:bg-gray-100 font-bold"
                                        >+</button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold uppercase">Berlaku Sampai</label>
                                    <input
                                        type="date"
                                        value={expiry}
                                        onChange={(e) => setExpiry(e.target.value)}
                                        className="w-full border border-black p-2 font-bold text-sm uppercase outline-none focus:ring-1 focus:ring-black"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-3 border-t-2 border-black bg-gray-50">
                    <button
                        onClick={handleSave}
                        className="w-full bg-black text-white font-black py-3 text-sm uppercase hover:bg-brand-orange hover:text-black border-2 border-transparent hover:border-black transition-all"
                    >
                        Simpan Data
                    </button>
                </div>
            </div>
        </div>
    );
};

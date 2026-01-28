"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Customer } from "@/lib/constants";
import { NeoInput } from "@/components/ui/neo-input";

import { supabase } from "@/lib/supabase";
import { Camera, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { compressAndConvertToWebp } from "@/lib/utils/image-utils";
import { sanitizePhone } from "@/lib/utils/formatters";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface MemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Customer;
}

export const MemberModal: React.FC<MemberModalProps> = ({ isOpen, onClose, initialData }) => {
    const { addCustomer, updateCustomer, currentVenueId } = useAppStore();

    // Form State
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [isMember, setIsMember] = useState(false);
    const [quota, setQuota] = useState(0);
    const [expiry, setExpiry] = useState("");

    // Photo State
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setPhone(initialData.phone);
            setIsMember(initialData.isMember);
            setQuota(initialData.quota || 0);
            setExpiry(initialData.membershipExpiry || "");
            setPhotoPreview(initialData.photo_url || null);
        } else {
            // Reset for new
            setName("");
            setPhone("");
            setIsMember(false);
            setQuota(0);
            setExpiry("");
            setPhotoPreview(null);
            setPhotoFile(null);
        }
    }, [initialData, isOpen]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPhotoPreview(objectUrl);
        }
    };

    const uploadPhoto = async (file: File): Promise<string | null> => {
        try {
            // Convert to WebP for optimization
            const webpFile = await compressAndConvertToWebp(file, 600, 600, 0.85);
            const fileName = `${currentVenueId}/${Date.now()}.webp`;
            const { error: uploadError } = await supabase.storage
                .from('member-photos')
                .upload(fileName, webpFile);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('member-photos')
                .getPublicUrl(fileName);

            return data.publicUrl;
        } catch (error) {
            console.error('Failed to upload photo:', error);
            return null;
        }
    };

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name || !phone) {
            toast.error("Nama dan No HP wajib diisi!");
            return;
        }

        setIsUploading(true);
        let photoUrl = initialData?.photo_url;

        try {
            if (photoFile) {
                const uploadedUrl = await uploadPhoto(photoFile);
                if (uploadedUrl) {
                    photoUrl = uploadedUrl;
                } else {
                    toast.error("Gagal mengupload foto. Melanjutkan penyimpanan tanpa foto baru.");
                }
            }

            const customerData: Omit<Customer, 'id'> = {
                name,
                phone: sanitizePhone(phone),
                isMember,
                quota: isMember ? quota : undefined,
                membershipExpiry: isMember ? expiry : undefined,
                photo_url: photoUrl
            };

            if (initialData) {
                await updateCustomer(initialData.id, customerData);
                toast.success('Data pelanggan berhasil diupdate!');
            } else {
                await addCustomer(currentVenueId, customerData);
                toast.success('Pelanggan baru berhasil ditambahkan!');
            }
            onClose();
        } catch (error) {
            console.error('Failed to save customer:', error);
            toast.error('Gagal menyimpan data pelanggan. Silakan coba lagi.');
        } finally {
            setIsUploading(false);
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
                    {/* Photo Upload Section */}
                    <div className="flex flex-col items-center gap-2 mb-2">
                        <div className="relative w-24 h-24 bg-gray-100 rounded-full border-2 border-black overflow-hidden flex items-center justify-center group">
                            {photoPreview ? (
                                <img
                                    src={photoPreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Camera size={32} className="text-gray-400" />
                            )}
                            <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white text-xs font-bold text-center p-1">
                                <Upload size={16} className="mb-1" />
                                <span className="sr-only">Upload</span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handlePhotoChange}
                            />
                        </div>
                        <span className="text-xs font-bold uppercase text-gray-500">
                            {photoPreview ? "Ganti Foto" : "Upload Foto"}
                        </span>
                    </div>

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

                <div className="p-3 border-t-2 border-black bg-gray-50 flex gap-2">
                    {initialData && (
                        <button
                            onClick={() => setShowDeleteAlert(true)}
                            disabled={isUploading}
                            className="bg-red-600 text-white font-black py-3 px-4 text-sm uppercase hover:bg-red-700 border-2 border-transparent hover:border-black transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            type="button"
                        >
                            Hapus
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isUploading}
                        className="flex-1 bg-black text-white font-black py-3 text-sm uppercase hover:bg-brand-orange hover:text-black border-2 border-transparent hover:border-black transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                Memproses...
                            </>
                        ) : (
                            "Simpan Data"
                        )}
                    </button>
                </div>
            </div>

            {initialData && (
                <AlertDialog
                    isOpen={showDeleteAlert}
                    onClose={() => setShowDeleteAlert(false)}
                    onConfirm={async () => {
                        setIsUploading(true);
                        try {
                            const { deleteCustomer } = useAppStore.getState();
                            await deleteCustomer(initialData.id);
                            toast.success("Member berhasil dihapus");
                            onClose();
                        } catch (error) {
                            console.error(error);
                            toast.error("Gagal menghapus member");
                        } finally {
                            setIsUploading(false);
                            setShowDeleteAlert(false);
                        }
                    }}
                    title="Hapus Member"
                    description="Apakah anda yakin ingin menghapus member ini? Data member akan hilang dari list namun riwayat booking tetap tersimpan."
                    confirmLabel="Hapus"
                    variant="danger"
                />
            )}
        </div>
    );
};

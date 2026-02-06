"use client";

import React, { useState, useRef } from "react";
import { useVenue } from "@/lib/venue-context";
import { updateVenue } from "@/lib/api/venues";
import { toast } from "sonner";
import { Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchWithCsrf } from "@/lib/hooks/use-csrf";
import { CreditCard, ExternalLink, HelpCircle, Save, Plus, X, Check } from "lucide-react";

export const VenueProfileSettings = () => {
    const { currentVenue, refreshVenue } = useVenue();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!currentVenue) return <div>Loading...</div>;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran file maksimal 5MB");
            return;
        }
        if (!file.type.startsWith('image/')) {
            toast.error("File harus berupa gambar");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('venueId', currentVenue.id);

        try {
            const res = await fetchWithCsrf('/api/venues/photo', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Upload failed');

            await refreshVenue();
            toast.success("Foto venue berhasil diperbarui!");
        } catch (error: any) {
            console.error(error);
            toast.error("Gagal upload foto: " + error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Profil Venue</h2>
                <p className="text-sm text-gray-500 font-bold">Atur tampilan venue Anda di halaman booking partner.</p>
            </div>

            <div className="bg-white border-2 border-black p-6 shadow-neo grid gap-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-2">
                        <div className="bg-pink-100 p-2 rounded-full border-2 border-black">
                            <ImageIcon size={20} className="text-pink-600" />
                        </div>
                        <h3 className="text-lg font-black uppercase">Foto Cover</h3>
                    </div>

                    <p className="text-xs text-gray-500 font-bold">
                        Foto ini akan muncul sebagai cover utama di daftar venue API Partner. Gunakan foto landscape kualitas tinggi.
                    </p>

                    <div className="relative group w-full max-w-lg aspect-video bg-gray-100 border-2 border-black border-dashed rounded-lg overflow-hidden flex items-center justify-center">
                        {currentVenue.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={currentVenue.photo_url}
                                alt="Venue Cover"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                <ImageIcon size={48} />
                                <span className="text-sm font-bold">Belum ada foto</span>
                            </div>
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                                variant="secondary"
                                className="font-bold bg-white text-black hover:bg-gray-200"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                {uploading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Camera className="mr-2" size={16} />}
                                {uploading ? 'Mengupload...' : 'Ganti Foto'}
                            </Button>
                        </div>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />

                    <div className="text-[10px] text-gray-400 font-mono">
                        Rekomendasi: JPG/PNG, Max 5MB. Rasio 16:9.
                    </div>
                </div>

                {/* Additional Profile Fields could go here (Description, Facilities, etc.) if expanded */}

                {/* Facilities Section */}
                <div className="flex flex-col gap-4 pt-6 border-t-2 border-gray-100">
                    <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-2">
                        <div className="bg-orange-100 p-2 rounded-full border-2 border-black">
                            <Check size={20} className="text-orange-600" />
                        </div>
                        <h3 className="text-lg font-black uppercase">Fasilitas Venue</h3>
                    </div>

                    <div className="flex flex-col gap-4">
                        <p className="text-xs text-gray-500 font-bold">
                            Tambahkan fasilitas yang tersedia untuk menarik lebih banyak pelanggan (maksimal 10).
                        </p>

                        <div className="flex gap-2">
                            <input
                                placeholder="Cth: Parkir Luas, Kantin, Locker"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-bold border-2 border-black"
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter') {
                                        const input = e.currentTarget;
                                        const val = input.value.trim();
                                        if (!val) return;

                                        const currentFacilities = currentVenue.facilities || [];
                                        if (currentFacilities.includes(val)) {
                                            toast.error("Fasilitas sudah ada!");
                                            return;
                                        }
                                        if (currentFacilities.length >= 10) {
                                            toast.error("Maksimal 10 fasilitas!");
                                            return;
                                        }

                                        const newFacilities = [...currentFacilities, val];
                                        setUploading(true);
                                        try {
                                            await updateVenue(currentVenue.id, { facilities: newFacilities });
                                            await refreshVenue();
                                            input.value = '';
                                            toast.success("Fasilitas ditambahkan!");
                                        } catch (err: any) {
                                            toast.error(err.message);
                                        } finally {
                                            setUploading(false);
                                        }
                                    }
                                }}
                            />
                            <Button
                                className="bg-orange-500 hover:bg-orange-600 text-white font-bold border-2 border-black shadow-neo active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                                onClick={async () => {
                                    const input = document.querySelector('input[placeholder="Cth: Parkir Luas, Kantin, Locker"]') as HTMLInputElement;
                                    if (!input) return;
                                    const val = input.value.trim();
                                    if (!val) return;

                                    const currentFacilities = currentVenue.facilities || [];
                                    if (currentFacilities.includes(val)) {
                                        toast.error("Fasilitas sudah ada!");
                                        return;
                                    }
                                    if (currentFacilities.length >= 10) {
                                        toast.error("Maksimal 10 fasilitas!");
                                        return;
                                    }

                                    const newFacilities = [...currentFacilities, val];
                                    setUploading(true);
                                    try {
                                        await updateVenue(currentVenue.id, { facilities: newFacilities });
                                        await refreshVenue();
                                        input.value = '';
                                        toast.success("Fasilitas ditambahkan!");
                                    } catch (err: any) {
                                        toast.error(err.message);
                                    } finally {
                                        setUploading(false);
                                    }
                                }}
                                disabled={uploading}
                            >
                                <Plus size={20} />
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {(currentVenue.facilities || []).map((fac, idx) => (
                                <div key={idx} className="bg-white border-2 border-black px-3 py-1 rounded-full flex items-center gap-2 shadow-[2px_2px_0px_black]">
                                    <span className="text-xs font-black uppercase text-orange-600">{fac}</span>
                                    <button
                                        onClick={async () => {
                                            if (confirm(`Hapus fasilitas "${fac}"?`)) {
                                                const newFacilities = (currentVenue.facilities || []).filter(f => f !== fac);
                                                setUploading(true);
                                                try {
                                                    await updateVenue(currentVenue.id, { facilities: newFacilities });
                                                    await refreshVenue();
                                                    toast.success("Fasilitas dihapus!");
                                                } catch (err: any) {
                                                    toast.error(err.message);
                                                } finally {
                                                    setUploading(false);
                                                }
                                            }
                                        }}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                        disabled={uploading}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {(!currentVenue.facilities || currentVenue.facilities.length === 0) && (
                                <span className="text-xs text-gray-400 italic">Belum ada fasilitas.</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* XenPlatform Integration Section */}
                <div className="flex flex-col gap-4 pt-6 border-t-2 border-gray-100">
                    <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-2">
                        <div className="bg-blue-100 p-2 rounded-full border-2 border-black">
                            <CreditCard size={20} className="text-blue-600" />
                        </div>
                        <h3 className="text-lg font-black uppercase">Xendit Integration</h3>
                    </div>

                    <div className="grid gap-6">
                        {/* Create Account Container */}
                        <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg flex flex-col gap-3">
                            <div className="flex gap-2 items-start">
                                <div className="bg-white p-1 rounded-full border border-blue-200 mt-1">
                                    <ExternalLink size={16} className="text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-blue-900">Belum punya akun Xendit?</h4>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Buat akun Xendit Anda melalui link khusus dibawah ini untuk terhubung dengan platform kami.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-2">
                                <div className="flex-1 bg-white border border-blue-200 rounded px-3 py-2 text-xs text-gray-500 font-mono truncate select-all">
                                    https://dashboard.xendit.co/xenPlatform/sma614925?op_env=test
                                </div>
                                <Button
                                    className="h-auto py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white border-2 border-transparent"
                                    onClick={() => window.open('https://dashboard.xendit.co/xenPlatform/sma614925?op_env=test', '_blank')}
                                >
                                    Buka Link
                                </Button>
                            </div>
                        </div>

                        {/* Account ID Input */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold uppercase flex items-center gap-2">
                                Xendit Account ID
                                <div title="ID Akun Xendit anda (dimulai dengan 'acct_'). Ditemukan di Dashboard Xendit > Settings > Your Business Information.">
                                    <HelpCircle size={14} className="text-gray-400 cursor-help" />
                                </div>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    placeholder="acct_xxx..."
                                    value={currentVenue.xendit_account_id || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        // Local state handling if needed, currently rely on manual save
                                    }}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono border-2 border-black"
                                    disabled={uploading}
                                />
                                <Button
                                    onClick={async () => {
                                        const inputEl = document.querySelector('input[placeholder="acct_xxx..."]') as HTMLInputElement;
                                        if (!inputEl) return;
                                        const newValue = inputEl.value;

                                        setUploading(true);
                                        try {
                                            await updateVenue(currentVenue.id, { xendit_account_id: newValue });
                                            await refreshVenue();
                                            toast.success("Xendit ID saved!");
                                        } catch (e: any) {
                                            toast.error(e.message);
                                        } finally {
                                            setUploading(false);
                                        }
                                    }}
                                    disabled={uploading}
                                >
                                    {uploading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                                Pastikan ID akun sesuai agar dana settlement dapat diteruskan dengan benar.
                            </p>
                        </div>
                    </div>
                </div>            </div>
        </div>
    );
};

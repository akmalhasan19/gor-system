"use client";

import React, { useState, useRef } from "react";
import { useVenue } from "@/lib/venue-context";
import { updateVenue } from "@/lib/api/venues";
import { toast } from "sonner";
import { Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchWithCsrf } from "@/lib/hooks/use-csrf";

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
            </div>
        </div>
    );
};

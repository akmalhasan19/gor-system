"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAppStore } from "@/lib/store";
import { X, Plus, PackagePlus, Trash2, AlertTriangle, Camera, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { compressAndConvertToWebp } from "@/lib/utils/image-utils";
import { ImageCropper } from "@/components/ui/image-cropper";

interface StockModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'EXISTING' | 'NEW';
}

export const StockModal: React.FC<StockModalProps> = ({ isOpen, onClose, initialMode = 'EXISTING' }) => {
    const { products, updateProductStock, addProduct, removeProduct, currentVenueId } = useAppStore();
    const [mode, setMode] = useState<'EXISTING' | 'NEW'>('EXISTING');

    // Existing Product State
    const [selectedProductId, setSelectedProductId] = useState<string>("");

    // New Product State
    const [newName, setNewName] = useState("");
    const [newCategory, setNewCategory] = useState<string>("DRINK");
    const [newPrice, setNewPrice] = useState<string>("");
    const [newImageUrl, setNewImageUrl] = useState<string>("");

    // Shared State
    const [amount, setAmount] = useState<string>("1");

    // Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Photo State
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Cropping State
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
        }
    }, [isOpen, initialMode]);

    if (!isOpen) return null;

    const resetForm = () => {
        setSelectedProductId("");
        setNewName("");
        setNewName("");
        setNewCategory("DRINK");
        setNewPrice("");
        setNewImageUrl("");
        setAmount("1");
        setMode(initialMode);
        setShowDeleteConfirm(false);
        setPhotoFile(null);
        setPhotoPreview(null);
        setIsUploading(false);
        setImageToCrop(null);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setImageToCrop(objectUrl);
            // Clear input so same file can be selected again if needed
            e.target.value = '';
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        // Create a File object from the blob
        const file = new File([croppedBlob], "product-image.webp", { type: "image/webp" });

        setPhotoFile(file);

        // Create preview URL
        const previewUrl = URL.createObjectURL(croppedBlob);
        setPhotoPreview(previewUrl);

        // Close cropper
        setImageToCrop(null);
    };

    const handleCancelCrop = () => {
        setImageToCrop(null);
    };

    const uploadPhoto = async (file: File): Promise<string | null> => {
        try {
            // Already cropped and webp, but maybe compress more if needed?
            // Since we use getCroppedImg with quality 0.9, it's likely already good.
            // But let's run through our standard utility just in case to ensure size constraints if any, or just upload directly.
            // Let's use compressAndConvertToWebp but maybe with less aggressive resize since we want high quality cropped?
            // Actually, let's just upload the cropped file directly if size is okay.
            // But to be consistent with codebase, let's process it.
            const webpFile = await compressAndConvertToWebp(file, 600, 600, 0.9);
            const fileName = `products/${currentVenueId}/${Date.now()}.webp`;

            const bucketName = 'product-images';

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(fileName, webpFile);

            if (uploadError) {
                console.error('Upload error details:', uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName);

            return data.publicUrl;
        } catch (error) {
            console.error('Failed to upload photo:', error);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseInt(amount);

        if (numAmount <= 0 || isNaN(numAmount)) return;

        if (!currentVenueId) {
            toast.error("Error: Data Venue tidak ditemukan. Silakan refresh halaman.");
            return;
        }

        setIsUploading(true);
        try {
            if (mode === 'EXISTING') {
                if (selectedProductId) {
                    await updateProductStock(selectedProductId, numAmount);
                    toast.success('Stok berhasil ditambahkan!');
                    onClose();
                    resetForm();
                }
            } else {
                // New Product Mode
                const price = parseInt(newPrice);
                if (newName && !isNaN(price)) {
                    let finalImageUrl = newImageUrl;

                    // Upload photo if selected
                    if (photoFile) {
                        const uploadedUrl = await uploadPhoto(photoFile);
                        if (uploadedUrl) {
                            finalImageUrl = uploadedUrl;
                        } else {
                            toast.error("Gagal mengupload foto. Melanjutkan tanpa foto.");
                        }
                    }

                    const newProduct = {
                        name: newName,
                        price: price,
                        category: newCategory as any,
                        stock: numAmount,
                        image_url: finalImageUrl
                    };

                    console.log('Adding product:', { currentVenueId, newProduct });

                    if (!currentVenueId) {
                        throw new Error("Venue ID is missing");
                    }

                    await addProduct(currentVenueId, newProduct);
                    toast.success('Produk baru berhasil ditambahkan!');
                    onClose();
                    resetForm();
                }
            }
        } catch (error: any) {
            console.error('Failed to update stock/product:', error);
            console.error('Error stringified:', JSON.stringify(error, null, 2));
            toast.error(`Gagal menyimpan data: ${error?.message || 'Unknown error'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteClick = () => {
        if (selectedProductId) {
            setShowDeleteConfirm(true);
        }
    };

    const confirmDelete = async () => {
        if (selectedProductId) {
            try {
                await removeProduct(selectedProductId);
                toast.success('Produk berhasil dihapus!');
                setSelectedProductId("");
                setShowDeleteConfirm(false);
            } catch (error) {
                console.error('Failed to delete product:', error);
                toast.error('Gagal menghapus produk. Silakan coba lagi.');
            }
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "") { setAmount(""); return; }
        if (!/^\d*$/.test(value)) return;
        const numValue = parseInt(value);
        if (!isNaN(numValue)) setAmount(numValue.toString());
    };

    const handleIncrement = () => {
        const current = parseInt(amount) || 0;
        setAmount((current + 1).toString());
    };

    const handleDecrement = () => {
        const current = parseInt(amount) || 0;
        setAmount(Math.max(1, current - 1).toString());
    };

    // Validation
    const isValid = mode === 'EXISTING'
        ? (selectedProductId && parseInt(amount) > 0)
        : (newName && newPrice && parseInt(newPrice) > 0 && parseInt(amount) > 0);

    const selectedProduct = products.find(p => p.id === selectedProductId);

    return (
        <>
            {/* Cropper Modal Overlay */}
            {imageToCrop && (
                <ImageCropper
                    imageSrc={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCancelCrop}
                />
            )}

            <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-sm border-2 border-black shadow-neo-lg relative flex flex-col max-h-[90vh] overflow-hidden">

                    {/* Delete Confirmation Overlay */}
                    {showDeleteConfirm && (
                        <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-red-100 p-4 rounded-full mb-4 border-2 border-black">
                                <AlertTriangle size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-xl font-black uppercase text-center mb-2">Hapus Produk?</h3>
                            <p className="text-center font-bold text-gray-600 mb-6">
                                Anda yakin ingin menghapus <span className="text-black underline">{selectedProduct?.name}</span>?
                                <br />Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-3 font-black uppercase border-2 border-black hover:bg-gray-100 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 font-black uppercase bg-red-600 text-white border-2 border-black hover:bg-red-700 shadow-neo active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => { onClose(); resetForm(); }}
                        className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors z-10"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-6 pb-0">
                        <div className="flex items-center gap-3 mb-6 border-b-2 border-dashed border-gray-200 pb-4">
                            <div className="bg-blue-100 p-2 rounded border border-black">
                                <PackagePlus size={24} className="text-blue-600" />
                            </div>
                            <h2 className="text-xl font-black uppercase italic">
                                {mode === 'EXISTING' ? 'Tambah Stok' : 'Produk Baru'}
                            </h2>
                        </div>

                        {/* Mode Toggle */}
                        <div className="flex p-1 bg-gray-100 border-2 border-black rounded-lg mb-4">
                            <button
                                type="button"
                                onClick={() => setMode('EXISTING')}
                                className={`flex-1 py-2 text-xs font-black uppercase transition-all ${mode === 'EXISTING'
                                    ? 'bg-white border-2 border-black shadow-sm'
                                    : 'text-gray-500 hover:text-black'
                                    }`}
                            >
                                Stok Lama
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('NEW')}
                                className={`flex-1 py-2 text-xs font-black uppercase transition-all ${mode === 'NEW'
                                    ? 'bg-white border-2 border-black shadow-sm'
                                    : 'text-gray-500 hover:text-black'
                                    }`}
                            >
                                Produk Baru
                            </button>
                        </div>
                    </div>

                    <div className="p-6 pt-0 flex-1 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                            {mode === 'EXISTING' ? (
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1">Pilih Item</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedProductId}
                                            onChange={(e) => setSelectedProductId(e.target.value)}
                                            className="w-full border-2 border-black p-2 font-bold focus:outline-none focus:ring-2 focus:ring-black rounded-none bg-white flex-1"
                                            required
                                        >
                                            <option value="" disabled>-- Pilih Produk --</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} (Stok: {p.stock})
                                                </option>
                                            ))}
                                        </select>
                                        {selectedProductId && (
                                            <button
                                                type="button"
                                                onClick={handleDeleteClick}
                                                className="bg-red-500 hover:bg-red-600 text-white border-2 border-black p-2 shadow-neo active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                                                title="Hapus Produk"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>


                                    {/* Image Upload & Name Group */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="relative w-24 h-24 bg-gray-100 rounded-xl border-2 border-black overflow-hidden flex items-center justify-center group shadow-neo-sm">
                                            {photoPreview ? (
                                                <Image
                                                    src={photoPreview}
                                                    alt="Preview"
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
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
                                        <span className="text-xs font-bold uppercase text-gray-500 mb-2">
                                            {photoPreview ? "Ganti Foto" : "Upload Foto Produk"}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Nama Produk</label>
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value.toUpperCase())}
                                            placeholder="CONTOH: POCARI SWEAT"
                                            className="w-full border-2 border-black p-2 font-bold focus:outline-none focus:ring-2 focus:ring-black"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1">Kategori</label>
                                            <select
                                                value={newCategory}
                                                onChange={(e) => setNewCategory(e.target.value)}
                                                className="w-full border-2 border-black p-2 font-bold focus:outline-none focus:ring-2 focus:ring-black bg-white"
                                            >
                                                <option value="DRINK">MINUMAN</option>
                                                <option value="FOOD">MAKANAN</option>
                                                <option value="EQUIPMENT">PERLENGKAPAN</option>
                                                <option value="RENTAL">SEWA</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1">Harga (Rp)</label>
                                            <input
                                                type="number"
                                                value={newPrice}
                                                onChange={(e) => setNewPrice(e.target.value)}
                                                placeholder="5000"
                                                className="w-full border-2 border-black p-2 font-bold focus:outline-none focus:ring-2 focus:ring-black"
                                            />
                                        </div>
                                    </div>

                                </>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">
                                    {mode === 'EXISTING' ? 'Jumlah Stok Masuk' : 'Stok Awal'}
                                </label>
                                <div className="flex items-center border-2 border-black w-full">
                                    <button
                                        type="button"
                                        onClick={handleDecrement}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border-r-2 border-black font-bold shrink-0"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={amount}
                                        onChange={handleAmountChange}
                                        className="flex-1 w-full min-w-0 p-2 text-center font-black focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleIncrement}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border-l-2 border-black font-bold shrink-0"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!isValid || isUploading}
                                className="mt-4 bg-green-600 text-white border-2 border-black py-3 font-black uppercase hover:bg-green-700 shadow-neo active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isUploading ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Plus size={18} strokeWidth={3} />
                                )}
                                {isUploading ? 'Menyimpan...' : (mode === 'EXISTING' ? 'Simpan Stok' : 'Simpan Produk Baru')}
                            </button>
                        </form>
                    </div>
                </div>
            </div >
        </>
    );
};

"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { X, Plus, PackagePlus, Trash2, AlertTriangle } from "lucide-react";

interface StockModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const StockModal: React.FC<StockModalProps> = ({ isOpen, onClose }) => {
    const { products, updateProductStock, addProduct, removeProduct, currentVenueId } = useAppStore();
    const [mode, setMode] = useState<'EXISTING' | 'NEW'>('EXISTING');

    // Existing Product State
    const [selectedProductId, setSelectedProductId] = useState<string>("");

    // New Product State
    const [newName, setNewName] = useState("");
    const [newCategory, setNewCategory] = useState<string>("DRINK");
    const [newPrice, setNewPrice] = useState<string>("");

    // Shared State
    const [amount, setAmount] = useState<string>("1");

    // Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    if (!isOpen) return null;

    const resetForm = () => {
        setSelectedProductId("");
        setNewName("");
        setNewCategory("DRINK");
        setNewPrice("");
        setAmount("1");
        setMode("EXISTING");
        setShowDeleteConfirm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseInt(amount);

        if (numAmount <= 0 || isNaN(numAmount)) return;

        try {
            if (mode === 'EXISTING') {
                if (selectedProductId) {
                    await updateProductStock(selectedProductId, numAmount);
                    alert('Stok berhasil ditambahkan!');
                    onClose();
                    resetForm();
                }
            } else {
                // New Product Mode
                const price = parseInt(newPrice);
                if (newName && !isNaN(price)) {
                    const newProduct = {
                        name: newName,
                        price: price,
                        category: newCategory as any,
                        stock: numAmount
                    };
                    await addProduct(currentVenueId, newProduct);
                    alert('Produk baru berhasil ditambahkan!');
                    onClose();
                    resetForm();
                }
            }
        } catch (error) {
            console.error('Failed to update stock/product:', error);
            alert('Gagal menyimpan data. Silakan coba lagi.');
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
                alert('Produk berhasil dihapus!');
                setSelectedProductId("");
                setShowDeleteConfirm(false);
            } catch (error) {
                console.error('Failed to delete product:', error);
                alert('Gagal menghapus produk. Silakan coba lagi.');
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm border-2 border-black shadow-neo-lg relative overflow-hidden">

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

                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6 border-b-2 border-dashed border-gray-200 pb-4">
                        <div className="bg-blue-100 p-2 rounded border border-black">
                            <PackagePlus size={24} className="text-blue-600" />
                        </div>
                        <h2 className="text-xl font-black uppercase italic">
                            {mode === 'EXISTING' ? 'Tambah Stok' : 'Produk Baru'}
                        </h2>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex p-1 bg-gray-100 border-2 border-black rounded-lg mb-6 sticky top-0">
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
                            disabled={!isValid}
                            className="mt-4 bg-green-600 text-white border-2 border-black py-3 font-black uppercase hover:bg-green-700 shadow-neo active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Plus size={18} strokeWidth={3} />
                            {mode === 'EXISTING' ? 'Simpan Stok' : 'Simpan Produk Baru'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

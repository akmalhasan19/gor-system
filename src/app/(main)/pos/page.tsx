'use client';

import React, { useState } from 'react';
import { ProductList } from "@/components/pos/product-list";
import { CartSidebar } from "@/components/pos/cart-sidebar";
import { StockModal } from "@/components/pos/stock-modal";
import { PackagePlus } from "lucide-react";

export default function POSPage() {
    const [isCartOpen, setIsCartOpen] = useState(true);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);

    return (
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
            <div className={`flex-1 overflow-y-auto bg-gray-50 border-r-0 md:border-r-2 border-gray-200 transition-all duration-300 ${isCartOpen ? 'md:blur-[1px] md:pointer-events-none md:select-none' : ''}`}>
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-display font-black uppercase italic">Kantin & Shop</h1>
                        <button
                            onClick={() => setIsStockModalOpen(true)}
                            className="flex items-center gap-1 text-xs font-bold uppercase bg-white border-2 border-black px-2 py-1 shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                        >
                            <PackagePlus size={14} />
                            Tambah Stok
                        </button>
                    </div>
                    <ProductList />
                </div>
            </div>

            {/* Click-outside overlay for Desktop */}
            {isCartOpen && (
                <div
                    className="hidden md:block absolute inset-0 z-30 bg-transparent cursor-pointer"
                    onClick={() => setIsCartOpen(false)}
                />
            )}

            {/* Sidebar: Overlay mode */}
            <div className={`absolute z-40 bg-white border-black transition-transform duration-300 ease-in-out shadow-2xl
                ${isCartOpen
                    ? "translate-y-0 translate-x-0"
                    : "translate-y-full md:translate-y-0 md:translate-x-full"
                }
                bottom-0 left-0 w-full h-[40vh] border-t-2
                md:top-0 md:left-auto md:right-0 md:w-[300px] md:h-full md:border-t-0 md:border-l-2
            `}>
                <CartSidebar onClose={() => setIsCartOpen(false)} />
            </div>

            <StockModal
                isOpen={isStockModalOpen}
                onClose={() => setIsStockModalOpen(false)}
            />
        </div>
    );
}

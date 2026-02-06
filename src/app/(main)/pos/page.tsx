'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { StockModal } from "@/components/pos/stock-modal";
import { PendingTransactionsBadge } from "@/components/pos/pending-transactions-badge";
import { PendingTransactionsModal } from "@/components/pos/pending-transactions-modal";
import { PackagePlus, ShoppingCart } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { usePageRefresh } from '@/hooks/use-page-refresh';

// Lazy load heavy POS components
const ProductList = dynamic(
    () => import('@/components/pos/product-list').then(mod => ({ default: mod.ProductList })),
    {
        loading: () => (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-black border-r-transparent"></div>
                    <p className="mt-2 font-bold text-sm">Loading Products...</p>
                </div>
            </div>
        ),
        ssr: false
    }
);

const CartSidebar = dynamic(
    () => import('@/components/pos/cart-sidebar').then(mod => ({ default: mod.CartSidebar })),
    {
        loading: () => (
            <div className="flex items-center justify-center p-4">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-black border-r-transparent"></div>
            </div>
        ),
        ssr: false
    }
);

export default function POSPage() {
    // Auto-refresh products and transactions when navigating to this page
    usePageRefresh('pos');
    const [isCartOpen, setIsCartOpen] = useState(true);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [stockModalMode, setStockModalMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
    const { cart } = useAppStore();
    const cartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isCartOpen && cartRef.current) {
            // Scroll to the cart element smoothly
            cartRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [isCartOpen]);

    return (
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
            <div className={`flex-1 overflow-y-auto bg-grid-brown border-r-0 md:border-r-2 border-gray-200 transition-all duration-300 ${isCartOpen ? 'md:blur-[1px] md:pointer-events-none md:select-none' : ''}`}>
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-display font-black uppercase italic">Kantin & Shop</h1>
                        <div className="flex gap-2">
                            <PendingTransactionsBadge onClick={() => setIsPendingModalOpen(true)} />
                            <button
                                onClick={() => setIsCartOpen(!isCartOpen)}
                                className={`flex items-center gap-2 text-xs font-bold uppercase border-2 border-black px-3 py-2 rounded-xl shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all ${isCartOpen ? 'bg-black text-white' : 'bg-white text-black'}`}
                            >
                                <ShoppingCart size={16} />
                                <span className="hidden sm:inline">Keranjang</span>
                                {cart.length > 0 && (
                                    <span className={`ml-1 px-1.5 py-0.5 text-[10px] border border-current rounded-full ${isCartOpen ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                        {cart.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setStockModalMode('EXISTING');
                                    setIsStockModalOpen(true);
                                }}
                                className="flex items-center gap-1 text-xs font-bold uppercase bg-white border-2 border-black px-2 py-1 rounded-xl shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                            >
                                <PackagePlus size={14} />
                                <span className="hidden sm:inline">Stok</span>
                            </button>
                        </div>
                    </div>
                    <ProductList onAddProduct={() => {
                        setStockModalMode('NEW');
                        setIsStockModalOpen(true);
                    }} />
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
            <div
                ref={cartRef}
                className={`absolute z-40 bg-white border-black transition-transform duration-300 ease-in-out shadow-2xl
                ${isCartOpen
                        ? "translate-y-0 translate-x-0"
                        : "translate-y-full md:translate-y-0 md:translate-x-full"
                    }
                bottom-0 left-0 w-full h-auto border-t-[3px] rounded-t-3xl overflow-hidden flex flex-col
                md:top-0 md:left-auto md:right-0 md:w-[300px] md:h-full md:max-h-none md:border-t-0 md:border-l-2 md:rounded-none
            `}>
                <CartSidebar onClose={() => setIsCartOpen(false)} />
            </div>

            <StockModal
                isOpen={isStockModalOpen}
                onClose={() => setIsStockModalOpen(false)}
                initialMode={stockModalMode}
            />

            <PendingTransactionsModal
                isOpen={isPendingModalOpen}
                onClose={() => setIsPendingModalOpen(false)}
            />
        </div>
    );
}

"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { PaymentModal } from "./payment-modal";
import { Trash2, ChevronRight } from "lucide-react";

interface CartSidebarProps {
    onClose?: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ onClose }) => {
    const { cart, removeFromCart, clearCart } = useAppStore();
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="flex flex-col h-auto max-h-[85vh] md:h-full md:max-h-none bg-white md:border-l-[3px] border-black">
            {/* Header */}
            <div className="p-4 border-b-[3px] border-black bg-black text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {onClose && (
                        <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-xl border border-white/30">
                            <ChevronRight size={18} />
                        </button>
                    )}
                    <h2 className="font-black text-lg uppercase italic tracking-tighter">POS Terminal</h2>
                </div>
                <div className="bg-brand-lime text-black px-2 py-0.5 text-[10px] font-black rounded-full border-2 border-black rotate-3">
                    {cart.length} ITEMS
                </div>
            </div>

            {/* Cart Items Container (The White Box with Borders) */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                <div className="border-[3px] border-black rounded-2xl p-4 bg-white shadow-neo min-h-[300px] flex flex-col">
                    <h3 className="font-black text-sm uppercase mb-3 border-b-[2px] border-black pb-1">Keranjang Belanja:</h3>

                    <div className="flex-1 flex flex-col gap-2">
                        {cart.length === 0 ? (
                            <div className="text-center text-gray-400 font-bold mt-12 italic text-xs uppercase opacity-30">
                                Belum ada item
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.id} className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-0">
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="font-bold text-[11px] uppercase truncate">{item.quantity}x {item.name}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                            (Rp {item.price.toLocaleString('id-ID')})
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-[11px] whitespace-nowrap">
                                            Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                                        </span>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg active:scale-90 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-4 pt-3 border-t-[3px] border-black flex justify-between items-center bg-gray-50 -mx-4 px-4 py-2">
                        <span className="font-black text-base uppercase">Total:</span>
                        <span className="font-black text-base">Rp {total.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="mt-4 pt-0">
                        <button
                            onClick={() => setIsPaymentOpen(true)}
                            disabled={cart.length === 0}
                            className="w-full bg-brand-lime border-[3px] border-black py-2 rounded-lg shadow-neo-sm active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed group hover:bg-lime-400"
                        >
                            <span className="font-black text-lg uppercase tracking-tightest group-active:scale-95 transition-transform block">
                                Bayar
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                totalAmount={total}
            />
        </div>
    );
};

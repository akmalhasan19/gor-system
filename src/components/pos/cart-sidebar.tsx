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
        <div className="flex flex-col h-full bg-white border-l-4 border-black">
            {/* Header */}
            <div className="p-2 border-b-2 border-black bg-black text-white flex justify-between items-center h-10">
                <div className="flex items-center gap-2">
                    {onClose && (
                        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
                            <ChevronRight size={14} />
                        </button>
                    )}
                    <h2 className="font-black text-xs uppercase">Current Order</h2>
                </div>
                <div className="bg-brand-orange text-black px-1.5 py-0 text-[9px] font-bold rounded-sm">
                    {cart.length}Items
                </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-1.5">
                {cart.length === 0 ? (
                    <div className="text-center text-gray-400 font-bold mt-8 italic text-[10px]">
                        Empty...
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={item.id} className="border border-black p-1.5 shadow-sm bg-white flex justify-between items-center group">
                            <div className="flex flex-col max-w-[60%]">
                                <span className="font-bold text-[10px] uppercase truncate">{item.name}</span>
                                <div className="text-[9px] text-gray-500 font-mono leading-none">
                                    {item.quantity} x {item.price / 1000}k
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-black text-[10px]">
                                    {(item.price * item.quantity / 1000).toLocaleString()}k
                                </span>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-all active:scale-95 border border-transparent hover:border-red-200"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer / Checkout */}
            <div className="p-1.5 border-t-2 border-black bg-gray-50">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold uppercase text-gray-600 text-[10px]">Total</span>
                    <span className="font-black text-sm">Rp {total.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-1">
                    <button
                        onClick={() => clearCart()}
                        disabled={cart.length === 0}
                        className="border border-black py-1.5 text-[10px] font-bold uppercase hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Batal
                    </button>
                    <button
                        onClick={() => setIsPaymentOpen(true)}
                        disabled={cart.length === 0}
                        className="bg-brand-green border border-black py-1.5 text-[10px] font-black uppercase text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-neo active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                    >
                        Bayar
                    </button>
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

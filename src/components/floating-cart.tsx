'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export const FloatingCart = () => {
    const { cart } = useAppStore();
    const pathname = usePathname();

    // Hide if on POS page
    // Also check for root '/' combined with 'tab=pos'? No, we are moving to proper routes.
    // So just check if pathname starts with /pos
    if (pathname.startsWith('/pos')) {
        return null;
    }

    // Only show if cart has items? Or always?
    // User logic: (!isCartOpen || activeTab !== 'pos')
    // Since we are not on POS, we show it.

    // Original logic:
    // (!isCartOpen || activeTab !== 'pos')
    // We cover activeTab !== 'pos' with the pathname check.
    // isCartOpen is now local to POS page. So effectively, if we are NOT on /pos, we show it.

    return (
        <Link
            href="/pos"
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 bg-black text-white p-3 md:p-4 shadow-neo hover:scale-110 transition-transform border-2 border-white rounded-full md:rounded-none"
        >
            <ShoppingCart size={20} className="md:w-6 md:h-6" />
            {/* Badge */}
            {cart.length > 0 && (
                <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-brand-orange text-black text-[10px] md:text-xs font-black px-1.5 md:px-2 py-0.5 border-2 border-black animate-bounce rounded-full md:rounded-none">
                    {cart.length}
                </div>
            )}
        </Link>
    );
};

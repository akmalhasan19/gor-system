"use client";

import React from "react";
import { useAppStore } from "@/lib/store";
import { NeoBadge } from "@/components/ui/neo-badge";

export const ProductList = () => {
    const { products, addToCart } = useAppStore();

    const handleAddProduct = (product: typeof products[0]) => {
        addToCart({
            id: `prod-${product.id}`, // specific cart ID logic can be improved
            type: 'PRODUCT',
            name: product.name,
            price: product.price,
            quantity: 1,
            referenceId: product.id
        });
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2">
            {products.map((product) => (
                <div
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    className="border-2 border-black bg-white shadow-neo hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer p-2 flex items-center gap-2 active:bg-gray-50 min-h-[60px]"
                >
                    <div className="flex flex-col items-start min-w-0 flex-1">
                        <div className="font-bold text-xs uppercase truncate w-full mb-1">
                            {product.name}
                        </div>
                        <div className="flex gap-1 flex-wrap">
                            <div className="text-[9px] font-bold bg-black text-white px-1 py-0 rounded-sm">
                                {product.stock}
                            </div>
                            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider border border-gray-300 px-1 rounded-sm">
                                {product.category}
                            </div>
                        </div>
                    </div>

                    <div className="font-black text-sm text-brand-orange whitespace-nowrap">
                        Rp {product.price.toLocaleString()}
                    </div>
                </div>
            ))}
        </div>
    );
};

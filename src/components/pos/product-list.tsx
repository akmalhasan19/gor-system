"use client";

import React from "react";
import Image from "next/image";
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 p-2">
            {products.map((product) => (
                <div
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    className="border-[2px] border-black bg-white rounded-xl shadow-neo-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer flex flex-col items-center overflow-hidden active:bg-gray-50"
                >
                    <div className="w-full p-1.5 border-b-[2px] border-black bg-gray-50 aspect-square flex items-center justify-center relative overflow-hidden group">
                        {product.image_url ? (
                            <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 15vw"
                            />
                        ) : (
                            <div className="w-full h-full border border-dashed border-gray-400 rounded-md flex items-center justify-center text-gray-400 font-bold text-[7px] uppercase text-center p-0.5">
                                {product.name} Icon
                            </div>
                        )}
                    </div>

                    <div className="w-full text-center p-1.5 flex flex-col items-center gap-0.5">
                        <div className="font-black text-[10px] uppercase leading-tight truncate w-full px-0.5">
                            {product.name}
                        </div>
                        <div className="text-[8px] font-bold text-gray-500 uppercase italic">
                            {product.category}
                        </div>
                        <div className="w-full mt-0.5 bg-brand-yellow border-[1.5px] border-black py-0.5 px-1 rounded-md font-black text-[9px] shadow-[1px_1px_0px_#000000] transform -rotate-1">
                            Rp {product.price.toLocaleString('id-ID')}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

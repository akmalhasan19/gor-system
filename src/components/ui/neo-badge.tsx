import React from "react";
import { cn } from "@/lib/utils";

interface NeoBadgeProps {
    status: string;
    className?: string;
}

export const NeoBadge = ({ status, className }: NeoBadgeProps) => {
    const getStatusColor = (s: string) => {
        switch (s.toUpperCase()) {
            case "LUNAS":
                return "bg-green-400 text-black";
            case "DP":
                return "bg-yellow-400 text-black";
            case "BELUM_BAYAR":
            case "BELUM":
            case "PENDING":
                return "bg-red-400 text-white";
            default:
                return "bg-gray-200 text-black";
        }
    };

    return (
        <span
            className={cn(
                "px-1 py-0.5 text-[10px] font-black uppercase border-2 border-black neo-shadow-sm leading-none inline-block",
                getStatusColor(status),
                className
            )}
        >
            {status}
        </span>
    );
};

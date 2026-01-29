import React from "react";
import { cn } from "@/lib/utils";

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger";
    icon?: React.ReactNode;
}

export const NeoButton = React.forwardRef<HTMLButtonElement, NeoButtonProps>(
    ({ className, variant = "primary", icon, children, ...props }, ref) => {
        const variants = {
            primary: "bg-brand-lime text-black",
            secondary: "bg-white text-black",
            danger: "bg-red-400 text-white",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "px-6 py-3 font-black uppercase tracking-wider border-[3px] border-black rounded-2xl transition-all",
                    "neo-shadow active:neo-interactive active:translate-x-[2px] active:translate-y-[2px] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-neo-lg",
                    "flex items-center justify-center gap-2",
                    variants[variant],
                    className
                )}
                {...props}
            >
                {icon && <span className="w-5 h-5">{icon}</span>}
                {children}
            </button>
        );
    }
);

NeoButton.displayName = "NeoButton";

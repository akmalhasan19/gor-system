import React from "react";
import { cn } from "@/lib/utils";

interface NeoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const NeoInput = React.forwardRef<HTMLInputElement, NeoInputProps>(
    ({ className, label, id, ...props }, ref) => {
        return (
            <div className="mb-4">
                <label
                    htmlFor={id}
                    className={cn("block font-bold mb-1 uppercase text-sm", className?.includes("text-") ? "" : "text-lg")}
                >
                    {label}
                </label>
                <input
                    ref={ref}
                    id={id}
                    className={cn(
                        "w-full border-2 border-black p-4 text-xl font-bold bg-white transition-all",
                        "focus:outline-none focus:neo-shadow active:translate-y-[2px]",
                        className
                    )}
                    onWheel={(e) => e.currentTarget.blur()}
                    {...props}
                />
            </div>
        );
    }
);
NeoInput.displayName = "NeoInput";

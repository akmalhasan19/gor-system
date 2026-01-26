import React from "react";
import { cn } from "@/lib/utils";

interface NeoCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    action?: React.ReactNode;
}

export const NeoCard = React.forwardRef<HTMLDivElement, NeoCardProps>(
    ({ className, title, action, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "bg-white border-2 border-black p-4 neo-shadow",
                    className
                )}
                {...props}
            >
                {(title || action) && (
                    <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
                        {title && (
                            <h3 className="font-black text-lg uppercase italic tracking-tighter">
                                {title}
                            </h3>
                        )}
                        {action && <div>{action}</div>}
                    </div>
                )}
                <div>{children}</div>
            </div>
        );
    }
);

NeoCard.displayName = "NeoCard";

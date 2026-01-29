import React from "react";
import { cn } from "@/lib/utils";

interface NeoCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    action?: React.ReactNode;
    headerColor?: string;
    showDecorator?: boolean;
}

export const NeoCard = React.forwardRef<HTMLDivElement, NeoCardProps>(
    ({ className, title, action, headerColor, showDecorator, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "bg-white border-[3px] border-black p-4 rounded-2xl neo-shadow relative overflow-hidden",
                    className
                )}
                {...props}
            >
                {showDecorator && (
                    <div
                        className={cn("absolute left-0 top-0 bottom-0 w-3 border-r-[3px] border-black", headerColor || "bg-brand-lime")}
                    />
                )}
                {(title || action) && (
                    <div className={cn(
                        "flex items-center justify-between mb-4 border-b-[3px] border-black pb-2",
                        showDecorator && "pl-4"
                    )}>
                        {title && (
                            <h3 className="font-black text-lg uppercase italic tracking-tighter">
                                {title}
                            </h3>
                        )}
                        {action && <div>{action}</div>}
                    </div>
                )}
                <div className={cn(showDecorator && "pl-4")}>{children}</div>
            </div>
        );
    }
);

NeoCard.displayName = "NeoCard";

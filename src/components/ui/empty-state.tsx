import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    action?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon: Icon,
    action,
    className
}) => {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 min-h-[200px] animate-in fade-in duration-500",
            className
        )}>
            {Icon && (
                <div className="bg-white p-4 rounded-full border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.1)] mb-4">
                    <Icon size={32} className="text-gray-400" strokeWidth={1.5} />
                </div>
            )}
            <h3 className="text-lg font-black uppercase tracking-tight mb-2 text-gray-800">
                {title}
            </h3>
            <p className="text-sm text-gray-500 font-bold max-w-xs mb-6 leading-relaxed">
                {description}
            </p>
            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </div>
    );
};

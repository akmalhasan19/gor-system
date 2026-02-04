"use client";

import React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

interface AlertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string | React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'default';
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = 'default'
}) => {
    return (
        <AlertDialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogPrimitive.Portal>
                {/* Overlay */}
                <AlertDialogPrimitive.Overlay className="fixed inset-0 bg-black/50 z-[10000] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

                {/* Content */}
                <AlertDialogPrimitive.Content
                    className="fixed left-[50%] top-[50%] z-[10000] translate-x-[-50%] translate-y-[-50%] bg-white border-2 border-black shadow-neo w-full max-w-sm flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-200"
                >
                    {/* Header */}
                    <div className="bg-black text-white p-3 flex justify-between items-center border-b-2 border-black">
                        <AlertDialogPrimitive.Title className="font-black text-sm uppercase">
                            {title}
                        </AlertDialogPrimitive.Title>
                        <AlertDialogPrimitive.Cancel
                            className="hover:text-brand-orange font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                            aria-label="Close dialog"
                        >
                            X
                        </AlertDialogPrimitive.Cancel>
                    </div>

                    {/* Description */}
                    <div className="p-6">
                        <AlertDialogPrimitive.Description className="font-bold text-sm">
                            {description}
                        </AlertDialogPrimitive.Description>
                    </div>

                    {/* Actions */}
                    <div className="p-3 border-t-2 border-black bg-gray-50 flex gap-2 justify-end">
                        <AlertDialogPrimitive.Cancel
                            className="bg-white text-black font-bold py-2 px-4 text-xs uppercase hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                        >
                            {cancelLabel}
                        </AlertDialogPrimitive.Cancel>
                        <AlertDialogPrimitive.Action
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`font-black py-2 px-4 text-xs uppercase text-white border-2 border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${variant === 'danger'
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                : 'bg-black hover:bg-brand-orange hover:text-black focus:ring-brand-orange'
                                }`}
                        >
                            {confirmLabel}
                        </AlertDialogPrimitive.Action>
                    </div>
                </AlertDialogPrimitive.Content>
            </AlertDialogPrimitive.Portal>
        </AlertDialogPrimitive.Root>
    );
};

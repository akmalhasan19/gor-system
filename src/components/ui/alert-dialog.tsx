import React from "react";

interface AlertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
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
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black shadow-neo w-full max-w-sm flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="bg-black text-white p-3 flex justify-between items-center border-b-2 border-black">
                    <h2 className="font-black text-sm uppercase">
                        {title}
                    </h2>
                    <button onClick={onClose} className="hover:text-brand-orange font-bold text-sm">X</button>
                </div>

                <div className="p-6">
                    <p className="font-bold text-sm">{description}</p>
                </div>

                <div className="p-3 border-t-2 border-black bg-gray-50 flex gap-2 justify-end">
                    <button
                        onClick={onClose}
                        className="bg-white text-black font-bold py-2 px-4 text-xs uppercase hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`font-black py-2 px-4 text-xs uppercase text-white border-2 border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all ${variant === 'danger'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-black hover:bg-brand-orange hover:text-black'
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

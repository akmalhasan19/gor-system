"use client";

import React, { useState, useEffect, use } from "react";
import {
    submitExitSurvey,
    hasSubmittedExitSurvey,
    getCustomerForSurvey,
    EXIT_SURVEY_REASONS,
} from "@/lib/api/exit-survey";
import {
    ClipboardList,
    CheckCircle,
    AlertTriangle,
    Send,
    RefreshCw,
} from "lucide-react";

interface SurveyPageProps {
    params: Promise<{
        venueId: string;
        customerId: string;
    }>;
}

export default function ExitSurveyPage({ params }: SurveyPageProps) {
    const resolvedParams = use(params);
    const { venueId, customerId } = resolvedParams;

    const [customerInfo, setCustomerInfo] = useState<{ name: string; venueName: string } | null>(null);
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
    const [otherReason, setOtherReason] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Check if already submitted
                const submitted = await hasSubmittedExitSurvey(venueId, customerId);
                if (submitted) {
                    setAlreadySubmitted(true);
                    setIsLoading(false);
                    return;
                }

                // Get customer info
                const info = await getCustomerForSurvey(venueId, customerId);
                if (!info) {
                    setError("Data tidak ditemukan. Link mungkin sudah tidak valid.");
                } else {
                    setCustomerInfo(info);
                }
            } catch (err) {
                setError("Terjadi kesalahan saat memuat data.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [venueId, customerId]);

    const toggleReason = (reasonId: string) => {
        setSelectedReasons((prev) =>
            prev.includes(reasonId)
                ? prev.filter((r) => r !== reasonId)
                : [...prev, reasonId]
        );
    };

    const handleSubmit = async () => {
        if (selectedReasons.length === 0) {
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await submitExitSurvey(
                venueId,
                customerId,
                selectedReasons,
                selectedReasons.includes("other") ? otherReason : undefined,
                feedback || undefined
            );

            if (result.success) {
                setIsSubmitted(true);
            } else {
                setError(result.error || "Gagal mengirim survey");
            }
        } catch (err) {
            setError("Terjadi kesalahan saat mengirim survey");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white border-[3px] border-black shadow-neo p-6 flex items-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span className="font-bold uppercase">Memuat...</span>
                </div>
            </div>
        );
    }

    // Already submitted state
    if (alreadySubmitted) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white border-[3px] border-black shadow-neo p-8 text-center">
                    <div className="w-20 h-20 mx-auto bg-blue-400 border-[3px] border-black shadow-neo flex items-center justify-center mb-6 -rotate-3">
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-black uppercase mb-3">Sudah Terisi! 📋</h1>
                    <p className="text-gray-600 font-medium">
                        Anda sudah mengisi survey ini sebelumnya. Terima kasih atas feedback Anda!
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-red-100 border-[3px] border-black shadow-neo p-8 text-center">
                    <div className="w-20 h-20 mx-auto bg-red-500 border-[3px] border-black shadow-neo flex items-center justify-center mb-6 rotate-3">
                        <AlertTriangle className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-black uppercase mb-3 text-red-700">Oops! ⚠️</h1>
                    <p className="text-red-600 font-medium">{error}</p>
                </div>
            </div>
        );
    }

    // Success state
    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-green-100 border-[3px] border-black shadow-neo p-8 text-center">
                    <div className="w-20 h-20 mx-auto bg-green-500 border-[3px] border-black shadow-neo flex items-center justify-center mb-6 -rotate-3">
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-black uppercase mb-3 text-green-700">
                        Terima Kasih! 🙏
                    </h1>
                    <p className="text-green-600 font-medium">
                        Feedback Anda sangat berharga untuk kami. Kami akan terus berusaha meningkatkan layanan.
                    </p>
                    <p className="mt-4 text-sm text-green-500 font-bold">
                        Sampai jumpa kembali di {customerInfo?.venueName}! 🏸
                    </p>
                </div>
            </div>
        );
    }

    // Form state
    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="bg-yellow-400 border-[3px] border-black shadow-neo p-6 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-black flex items-center justify-center border-2 border-black -rotate-3">
                            <ClipboardList className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black uppercase">Exit Survey</h1>
                            <p className="text-sm font-bold text-black/70">{customerInfo?.venueName}</p>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-black/80">
                        Halo <span className="font-black">{customerInfo?.name}</span>! 👋
                        <br />
                        Kami sedih melihat Anda tidak memperpanjang membership. Mohon bantu kami memahami alasannya agar kami bisa lebih baik lagi.
                    </p>
                </div>

                {/* Survey Form */}
                <div className="bg-white border-[3px] border-black shadow-neo p-6 space-y-6">
                    {/* Reasons Selection */}
                    <div>
                        <h2 className="font-black uppercase text-sm mb-3">
                            Kenapa Anda tidak memperpanjang? <span className="text-red-500">*</span>
                        </h2>
                        <p className="text-xs text-gray-500 mb-3">Pilih semua yang sesuai:</p>
                        <div className="space-y-2">
                            {EXIT_SURVEY_REASONS.map((reason) => (
                                <button
                                    key={reason.id}
                                    type="button"
                                    onClick={() => toggleReason(reason.id)}
                                    className={`w-full text-left p-3 border-2 border-black font-bold text-sm transition-all ${selectedReasons.includes(reason.id)
                                            ? "bg-black text-white shadow-none translate-x-[2px] translate-y-[2px]"
                                            : "bg-white hover:bg-gray-100 shadow-neo-sm"
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span
                                            className={`w-4 h-4 border-2 border-current flex items-center justify-center transition-colors ${selectedReasons.includes(reason.id)
                                                    ? "bg-white"
                                                    : ""
                                                }`}
                                        >
                                            {selectedReasons.includes(reason.id) && (
                                                <span className="text-black font-black text-xs">✓</span>
                                            )}
                                        </span>
                                        {reason.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Other Reason Input */}
                    {selectedReasons.includes("other") && (
                        <div>
                            <label className="font-black uppercase text-sm block mb-2">
                                Alasan lainnya:
                            </label>
                            <input
                                type="text"
                                value={otherReason}
                                onChange={(e) => setOtherReason(e.target.value)}
                                placeholder="Ceritakan alasan Anda..."
                                className="w-full border-2 border-black p-3 font-medium text-sm shadow-neo-sm focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                    )}

                    {/* Additional Feedback */}
                    <div>
                        <label className="font-black uppercase text-sm block mb-2">
                            Saran untuk kami (opsional):
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Apa yang bisa kami perbaiki?"
                            rows={3}
                            className="w-full border-2 border-black p-3 font-medium text-sm shadow-neo-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={selectedReasons.length === 0 || isSubmitting}
                        className={`w-full flex items-center justify-center gap-2 p-4 border-[3px] border-black font-black uppercase text-lg transition-all ${selectedReasons.length === 0
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-brand-lime text-black shadow-neo hover:bg-black hover:text-brand-lime active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                            } disabled:opacity-70`}
                    >
                        {isSubmitting ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Mengirim...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Kirim Survey
                            </>
                        )}
                    </button>

                    {selectedReasons.length === 0 && (
                        <p className="text-xs text-red-500 font-bold text-center">
                            Pilih minimal satu alasan untuk melanjutkan
                        </p>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-6 font-medium">
                    Data Anda akan dijaga kerahasiaannya dan hanya digunakan untuk peningkatan layanan.
                </p>
            </div>
        </div>
    );
}

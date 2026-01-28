"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useVenue } from "@/lib/venue-context";
import { getAtRiskMembers, AtRiskMember, sendWinbackPromo } from "@/lib/api/churn-prediction";
import { sendManualReminder } from "@/lib/api/reminders";
import { toast } from "sonner";
import {
    AlertTriangle,
    TrendingDown,
    MessageCircle,
    RefreshCw,
    Users,
    Calendar,
    Ticket,
    Flame,
    AlertCircle,
    Info,
    Gift,
} from "lucide-react";

// Neo-brutalist No Booking Icon Component
const NoBookingIcon = () => (
    <svg width="20" height="20" viewBox="0 0 64 64" fill="none" className="inline-block">
        <rect x="6" y="18" width="52" height="36" rx="2" fill="black" />
        <rect x="4" y="16" width="52" height="36" rx="2" fill="white" stroke="black" strokeWidth="3" />
        <rect x="4" y="16" width="52" height="12" rx="2" fill="#FFE066" stroke="black" strokeWidth="3" />
        <circle cx="16" cy="14" r="3" fill="white" stroke="black" strokeWidth="2" />
        <circle cx="48" cy="14" r="3" fill="white" stroke="black" strokeWidth="2" />
        <line x1="20" y1="36" x2="40" y2="52" stroke="black" strokeWidth="4" strokeLinecap="round" />
        <line x1="40" y1="36" x2="20" y2="52" stroke="black" strokeWidth="4" strokeLinecap="round" />
    </svg>
);

export function AtRiskMembers() {
    const { currentVenueId, currentVenue } = useVenue();
    const [members, setMembers] = useState<AtRiskMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sendingReminder, setSendingReminder] = useState<string | null>(null);
    const [sendingPromo, setSendingPromo] = useState<string | null>(null);

    const fetchAtRiskMembers = async () => {
        if (!currentVenueId) return;

        setIsLoading(true);
        try {
            const data = await getAtRiskMembers(currentVenueId);
            setMembers(data);
        } catch (error) {
            console.error("Failed to fetch at-risk members:", error);
            toast.error("Gagal memuat data member berisiko");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAtRiskMembers();
    }, [currentVenueId]);

    const handleSendReminder = async (member: AtRiskMember) => {
        if (!currentVenueId || !currentVenue) return;

        // Check if Fonnte token is configured
        if (!currentVenue.fonnteToken) {
            toast.custom((t) => (
                <div className="bg-yellow-400 border-[3px] border-black p-4 shadow-neo max-w-sm">
                    <div className="flex items-start gap-3">
                        <div className="bg-black text-yellow-400 p-2 border-2 border-black flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-black uppercase text-sm mb-1">Token Fonnte Belum Diatur!</h4>
                            <p className="text-xs text-black font-medium mb-3">
                                Silakan masukkan Token Fonnte di menu <b>Pengaturan → Operasional</b> untuk mengaktifkan fitur kirim WhatsApp otomatis.
                            </p>
                            <button
                                onClick={() => toast.dismiss(t)}
                                className="bg-black text-yellow-400 px-3 py-1 text-xs font-black uppercase border-2 border-black hover:bg-gray-800 transition-colors"
                            >
                                Mengerti
                            </button>
                        </div>
                    </div>
                </div>
            ), { duration: 8000 });
            return;
        }

        setSendingReminder(member.id);
        try {
            const result = await sendManualReminder(
                currentVenueId,
                member.id,
                member.name,
                member.phone,
                currentVenue.name,
                member.membershipExpiry || new Date().toISOString().split('T')[0],
                member.quotaRemaining
            );

            if (result.success) {
                toast.success(`Reminder terkirim ke ${member.name}`);
            } else {
                // Show Neo-brutalist error for other failures
                toast.custom((t) => (
                    <div className="bg-red-500 border-[3px] border-black p-4 shadow-neo max-w-sm">
                        <div className="flex items-start gap-3">
                            <div className="bg-black text-red-500 p-2 border-2 border-black flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-white uppercase text-sm mb-1">Gagal Kirim Reminder</h4>
                                <p className="text-xs text-white font-medium mb-3">
                                    {result.error || 'Terjadi kesalahan saat mengirim pesan.'}
                                </p>
                                <button
                                    onClick={() => toast.dismiss(t)}
                                    className="bg-black text-red-500 px-3 py-1 text-xs font-black uppercase border-2 border-black hover:bg-gray-800 transition-colors"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                ), { duration: 6000 });
            }
        } catch (error) {
            toast.error("Gagal mengirim reminder");
        } finally {
            setSendingReminder(null);
        }
    };

    const handleSendPromo = async (member: AtRiskMember) => {
        if (!currentVenueId || !currentVenue) return;

        // Check if Fonnte token is configured
        if (!currentVenue.fonnteToken) {
            toast.custom((t) => (
                <div className="bg-yellow-400 border-[3px] border-black p-4 shadow-neo max-w-sm">
                    <div className="flex items-start gap-3">
                        <div className="bg-black text-yellow-400 p-2 border-2 border-black flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-black uppercase text-sm mb-1">Token Fonnte Belum Diatur!</h4>
                            <p className="text-xs text-black font-medium mb-3">
                                Silakan masukkan Token Fonnte di menu <b>Pengaturan → Operasional</b> untuk mengaktifkan fitur kirim WhatsApp otomatis.
                            </p>
                            <button
                                onClick={() => toast.dismiss(t)}
                                className="bg-black text-yellow-400 px-3 py-1 text-xs font-black uppercase border-2 border-black hover:bg-gray-800 transition-colors"
                            >
                                Mengerti
                            </button>
                        </div>
                    </div>
                </div>
            ), { duration: 8000 });
            return;
        }

        setSendingPromo(member.id);
        try {
            const result = await sendWinbackPromo(
                currentVenueId,
                member,
                currentVenue.name
            );

            if (result.success) {
                toast.custom((t) => (
                    <div className="bg-green-500 border-[3px] border-black p-4 shadow-neo max-w-sm">
                        <div className="flex items-start gap-3">
                            <div className="bg-black text-green-500 p-2 border-2 border-black flex-shrink-0">
                                <Gift className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-white uppercase text-sm mb-1">Promo Terkirim! 🎉</h4>
                                <p className="text-xs text-white font-medium mb-1">
                                    Kode: <span className="font-black bg-white text-black px-2 py-0.5">{result.promoCode}</span>
                                </p>
                                <p className="text-xs text-white/80">
                                    Terkirim ke {member.name}
                                </p>
                                <button
                                    onClick={() => toast.dismiss(t)}
                                    className="mt-2 bg-black text-green-500 px-3 py-1 text-xs font-black uppercase border-2 border-black hover:bg-gray-800 transition-colors"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                ), { duration: 8000 });
            } else {
                toast.custom((t) => (
                    <div className="bg-red-500 border-[3px] border-black p-4 shadow-neo max-w-sm">
                        <div className="flex items-start gap-3">
                            <div className="bg-black text-red-500 p-2 border-2 border-black flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-white uppercase text-sm mb-1">Gagal Kirim Promo</h4>
                                <p className="text-xs text-white font-medium mb-3">
                                    {result.error || 'Terjadi kesalahan saat mengirim promo.'}
                                </p>
                                <button
                                    onClick={() => toast.dismiss(t)}
                                    className="bg-black text-red-500 px-3 py-1 text-xs font-black uppercase border-2 border-black hover:bg-gray-800 transition-colors"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                ), { duration: 6000 });
            }
        } catch (error) {
            toast.error("Gagal mengirim promo win-back");
        } finally {
            setSendingPromo(null);
        }
    };

    const getRiskBadgeStyles = (level: AtRiskMember['riskLevel']) => {
        switch (level) {
            case 'high':
                return 'bg-red-500 text-white border-black';
            case 'medium':
                return 'bg-yellow-400 text-black border-black';
            case 'low':
                return 'bg-blue-400 text-white border-black';
        }
    };

    const getRiskLabel = (level: AtRiskMember['riskLevel']) => {
        switch (level) {
            case 'high':
                return 'TINGGI';
            case 'medium':
                return 'SEDANG';
            case 'low':
                return 'RENDAH';
        }
    };

    const getRiskIcon = (level: AtRiskMember['riskLevel']) => {
        switch (level) {
            case 'high':
                return <Flame className="w-3 h-3" />;
            case 'medium':
                return <AlertCircle className="w-3 h-3" />;
            case 'low':
                return <Info className="w-3 h-3" />;
        }
    };

    const getTrendIcon = (trend: AtRiskMember['frequencyTrend']) => {
        switch (trend) {
            case 'decreasing':
                return <TrendingDown className="w-4 h-4 text-red-600" />;
            case 'increasing':
                return <TrendingDown className="w-4 h-4 text-green-600 rotate-180" />;
            default:
                return <span className="w-4 h-4 text-gray-500 font-bold">—</span>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="bg-white border-2 border-black p-4 shadow-neo flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="font-bold uppercase text-sm">Memuat data...</span>
                </div>
            </div>
        );
    }

    if (members.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-brand-lime border-[3px] border-black shadow-neo flex items-center justify-center mb-4 -rotate-3">
                    <Users className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black uppercase mb-2">
                    Semua Member Aktif! 🎉
                </h3>
                <p className="text-gray-600 max-w-md font-medium">
                    Tidak ada member yang berisiko churn saat ini.
                </p>
                <button
                    onClick={fetchAtRiskMembers}
                    className="mt-4 flex items-center gap-2 bg-white border-2 border-black px-4 py-2 font-bold text-sm uppercase shadow-neo-sm hover:bg-black hover:text-white transition-colors active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>
        );
    }

    const highCount = members.filter(m => m.riskLevel === 'high').length;
    const mediumCount = members.filter(m => m.riskLevel === 'medium').length;
    const lowCount = members.filter(m => m.riskLevel === 'low').length;

    return (
        <div className="space-y-4">
            {/* Neo-brutalist Stats Cards */}
            <div className="grid grid-cols-3 gap-2">
                {/* High Risk Card */}
                <div className="relative bg-red-500 border-[3px] border-black p-3 shadow-neo transform hover:-rotate-1 transition-transform">
                    <div className="text-3xl font-black text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        {highCount}
                    </div>
                    <div className="text-[10px] font-black text-white uppercase tracking-wide">
                        Risiko Tinggi
                    </div>
                </div>

                {/* Medium Risk Card */}
                <div className="relative bg-yellow-400 border-[3px] border-black p-3 shadow-neo transform hover:rotate-1 transition-transform">
                    <div className="text-3xl font-black text-black">
                        {mediumCount}
                    </div>
                    <div className="text-[10px] font-black text-black uppercase tracking-wide">
                        Risiko Sedang
                    </div>
                </div>

                {/* Low Risk Card */}
                <div className="relative bg-blue-500 border-[3px] border-black p-3 shadow-neo transform hover:-rotate-1 transition-transform">
                    <div className="text-3xl font-black text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        {lowCount}
                    </div>
                    <div className="text-[10px] font-black text-white uppercase tracking-wide">
                        Risiko Rendah
                    </div>
                </div>
            </div>

            {/* Refresh Button */}
            <div className="flex justify-end">
                <button
                    onClick={fetchAtRiskMembers}
                    disabled={isLoading}
                    className="flex items-center gap-2 text-xs font-bold uppercase text-gray-600 hover:text-black disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Members List */}
            <div className="space-y-3">
                {members.map((member) => (
                    <div
                        key={member.id}
                        className="bg-white border-[3px] border-black shadow-neo p-4"
                    >
                        <div className="flex items-start justify-between gap-4">
                            {/* Member Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-3">
                                    <h4 className="font-black text-lg uppercase truncate">
                                        {member.name}
                                    </h4>
                                    <span className={`text-[10px] font-black px-2 py-1 border-2 flex items-center gap-1 ${getRiskBadgeStyles(member.riskLevel)} shadow-[2px_2px_0px_0px_#000000]`}>
                                        {getRiskIcon(member.riskLevel)}
                                        {getRiskLabel(member.riskLevel)}
                                    </span>
                                </div>

                                {/* Stats Row */}
                                <div className="flex flex-wrap gap-3 text-xs font-bold text-gray-700 mb-3">
                                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 border-2 border-black">
                                        <Calendar className="w-3 h-3" />
                                        {member.lastBookingDate
                                            ? `${member.daysSinceLastBooking} hari lalu`
                                            : <><NoBookingIcon /> Belum booking</>}
                                    </span>
                                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 border-2 border-black">
                                        {getTrendIcon(member.frequencyTrend)}
                                        {member.bookingFrequency}/bln
                                    </span>
                                    {member.quotaRemaining > 0 && (
                                        <span className="flex items-center gap-1 bg-brand-lime px-2 py-1 border-2 border-black">
                                            <Ticket className="w-3 h-3" />
                                            {member.quotaRemaining}x sisa
                                        </span>
                                    )}
                                </div>

                                {/* Risk Reasons - Neo-brutalist tags */}
                                <div className="flex flex-wrap gap-1">
                                    {member.riskReasons.map((reason, idx) => (
                                        <div
                                            key={idx}
                                            className="text-[10px] font-bold uppercase bg-gray-900 text-white px-2 py-1 border-2 border-black transform -rotate-1 first:rotate-1"
                                        >
                                            {reason}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 flex-shrink-0">
                                <button
                                    onClick={() => handleSendPromo(member)}
                                    disabled={sendingPromo === member.id}
                                    className="flex items-center gap-2 bg-purple-500 text-white border-[3px] border-black px-3 py-2 text-xs font-black uppercase hover:bg-black hover:text-purple-400 transition-colors disabled:opacity-50 shadow-neo-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                                >
                                    {sendingPromo === member.id ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Gift className="w-4 h-4" />
                                    )}
                                    <span className="hidden sm:inline">Kirim Promo</span>
                                </button>
                                <button
                                    onClick={() => handleSendReminder(member)}
                                    disabled={sendingReminder === member.id}
                                    className="flex items-center gap-2 bg-brand-lime text-black border-[3px] border-black px-3 py-2 text-xs font-black uppercase hover:bg-black hover:text-brand-lime transition-colors disabled:opacity-50 shadow-neo-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                                >
                                    {sendingReminder === member.id ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <MessageCircle className="w-4 h-4" />
                                    )}
                                    <span className="hidden sm:inline">Reminder</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


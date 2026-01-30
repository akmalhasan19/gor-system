'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useSubscription } from '@/hooks/useSubscription';
import { PLAN_FEATURES, SubscriptionPlan } from '@/lib/constants/plans';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Crown, Sparkles, Zap, Rocket, Trophy, Gem, Check } from 'lucide-react';
import { toast } from 'sonner';

export function BillingSettings() {
    const venueId = useAppStore((s) => s.currentVenueId);
    const { plan, status, validUntil, isLoading, refresh } = useSubscription(venueId);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleSelectPlan = async (selectedPlan: SubscriptionPlan) => {
        if (!venueId) return;
        if (selectedPlan === plan) {
            toast.info('Anda sudah menggunakan paket ini.');
            return;
        }

        setIsUpdating(true);
        try {
            // Calculate subscription_valid_until (1 month from now)
            const validUntilDate = new Date();
            validUntilDate.setMonth(validUntilDate.getMonth() + 1);

            const { error } = await supabase
                .from('venues')
                .update({
                    subscription_plan: selectedPlan,
                    subscription_status: 'ACTIVE',
                    subscription_valid_until: validUntilDate.toISOString(),
                })
                .eq('id', venueId);

            if (error) throw error;

            toast.success(`Berhasil upgrade ke paket ${PLAN_FEATURES[selectedPlan].displayName}!`);
            await refresh();
        } catch (err) {
            console.error(err);
            toast.error('Gagal mengubah paket. Silakan coba lagi.');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    const planIcons: Record<SubscriptionPlan, React.ReactNode> = {
        STARTER: <Rocket className="w-8 h-8 text-black" />,
        PRO: <Trophy className="w-8 h-8 text-black" />,
        BUSINESS: <Gem className="w-8 h-8 text-black" />,
    };

    return (
        <div className="max-w-4xl">
            {/* Current Plan Section */}
            <div className="mb-8">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Langganan & Billing</h2>
                <p className="text-gray-500 font-bold mb-4">Kelola paket langganan dan fitur akses akun Anda.</p>

                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        {planIcons[plan]}
                        <div>
                            <p className="text-sm text-gray-600 uppercase tracking-wide font-bold">Paket Aktif</p>
                            <p className="text-2xl font-black">{PLAN_FEATURES[plan].displayName}</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600">
                        Status: <span className={`font-bold ${status === 'ACTIVE' ? 'text-green-600' : status === 'TRIAL' ? 'text-blue-600' : 'text-red-600'}`}>{status}</span>
                        {validUntil && (
                            <span className="ml-2">• Berlaku sampai: {validUntil.toLocaleDateString('id-ID')}</span>
                        )}
                    </p>
                </div>
            </div>

            {/* Plan Selection */}
            <h3 className="text-xl font-black uppercase mb-4">Pilih Paket</h3>
            <h3 className="text-xl font-black uppercase mb-4">Pilih Paket</h3>
            <div className="flex flex-col gap-6">
                {(Object.keys(PLAN_FEATURES) as SubscriptionPlan[]).map((planKey) => {
                    const planConfig = PLAN_FEATURES[planKey];
                    const isCurrentPlan = plan === planKey;
                    const baseStyle = {
                        STARTER: 'bg-white hover:bg-gray-50',
                        PRO: 'bg-brand-orange hover:bg-orange-400',
                        BUSINESS: 'bg-brand-lime hover:bg-lime-400',
                    }[planKey];

                    return (
                        <button
                            key={planKey}
                            onClick={() => handleSelectPlan(planKey)}
                            disabled={isCurrentPlan || isUpdating}
                            className={`relative border-[3px] border-black rounded-xl p-6 text-left transition-all group w-full
                                ${isCurrentPlan
                                    ? 'shadow-none bg-gray-100 border-gray-400 opacity-80 cursor-default'
                                    : `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${baseStyle}`
                                }
                            `}
                        >
                            <div className="flex flex-col sm:flex-row items-start gap-4">
                                {/* Icon & Status Row */}
                                <div className="w-full sm:w-auto flex justify-between items-start gap-4">
                                    <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                                        {planIcons[planKey]}
                                    </div>

                                    {/* Mobile Badge */}
                                    <div className="sm:hidden">
                                        {isCurrentPlan && (
                                            <div className="bg-black text-white px-3 py-1 rounded font-bold text-xs uppercase shadow-sm">
                                                Aktif
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 w-full">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                                        <h4 className="font-black text-2xl uppercase italic tracking-tight">{planConfig.displayName}</h4>
                                        <span className="font-black text-xl">
                                            Rp {planConfig.priceMonthly.toLocaleString('id-ID')}
                                            <span className="text-sm font-bold text-black/60 ml-1">/bln</span>
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-black/80 mb-3 leading-relaxed border-b-2 border-black/10 pb-3">
                                        {planConfig.description}
                                    </p>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase">
                                            <div className="w-1.5 h-1.5 bg-black rounded-full" />
                                            Maks. {planConfig.maxCourts === 999 ? 'Unlimited' : planConfig.maxCourts} Lapangan
                                        </div>
                                        {planConfig.features.length > 0 && planConfig.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-xs font-bold uppercase">
                                                <div className="w-1.5 h-1.5 bg-black rounded-full" />
                                                {feature.replace(/_/g, ' ')}
                                            </div>
                                        ))}
                                        {planConfig.features.length === 0 && (
                                            <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500">
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                                Fitur Dasar
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Desktop Badge / Action Indicator */}
                                <div className="hidden sm:flex flex-col items-end gap-2">
                                    {isCurrentPlan ? (
                                        <div className="bg-black text-white px-3 py-1 rounded font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                                            Paket Aktif
                                        </div>
                                    ) : (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white border-2 border-black px-3 py-1 rounded font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            Pilih
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <p className="text-xs text-gray-400 mt-6 text-center">
                * Pembayaran saat ini dilakukan secara manual. Hubungi admin untuk konfirmasi pembayaran.
            </p>
        </div>
    );
}

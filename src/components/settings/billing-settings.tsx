'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useSubscription } from '@/hooks/useSubscription';
import { PLAN_FEATURES, SubscriptionPlan } from '@/lib/constants/plans';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Crown, Sparkles, Zap } from 'lucide-react';
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
        STARTER: <Zap className="w-6 h-6 text-gray-500" />,
        PRO: <Crown className="w-6 h-6 text-amber-500" />,
        BUSINESS: <Sparkles className="w-6 h-6 text-purple-500" />,
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
            <div className="grid md:grid-cols-3 gap-4">
                {(Object.keys(PLAN_FEATURES) as SubscriptionPlan[]).map((planKey) => {
                    const planConfig = PLAN_FEATURES[planKey];
                    const isCurrentPlan = plan === planKey;
                    const isUpgrade =
                        (plan === 'STARTER' && (planKey === 'PRO' || planKey === 'BUSINESS')) ||
                        (plan === 'PRO' && planKey === 'BUSINESS');

                    return (
                        <div
                            key={planKey}
                            className={`relative border-2 rounded-xl p-5 transition-all ${isCurrentPlan
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 hover:border-gray-400'
                                }`}
                        >
                            {isCurrentPlan && (
                                <div className="absolute -top-3 left-4 bg-primary text-white text-xs font-bold uppercase px-2 py-0.5 rounded">
                                    Aktif
                                </div>
                            )}
                            <div className="flex items-center gap-2 mb-3">
                                {planIcons[planKey]}
                                <h4 className="text-lg font-black">{planConfig.displayName}</h4>
                            </div>
                            <p className="text-2xl font-black mb-1">
                                Rp {planConfig.priceMonthly.toLocaleString('id-ID')}
                                <span className="text-sm font-normal text-gray-500">/bulan</span>
                            </p>
                            <p className="text-sm text-gray-500 mb-4">{planConfig.description}</p>

                            <ul className="space-y-2 mb-5 text-sm">
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Maks. {planConfig.maxCourts === 999 ? 'Unlimited' : planConfig.maxCourts} Lapangan
                                </li>
                                {planConfig.features.length > 0 ? (
                                    planConfig.features.slice(0, 4).map((feat) => (
                                        <li key={feat} className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            {feat.replace(/_/g, ' ')}
                                        </li>
                                    ))
                                ) : (
                                    <li className="flex items-center gap-2 text-gray-400">
                                        <CheckCircle className="w-4 h-4 text-gray-300" />
                                        Fitur Dasar
                                    </li>
                                )}
                            </ul>

                            <button
                                onClick={() => handleSelectPlan(planKey)}
                                disabled={isCurrentPlan || isUpdating}
                                className={`w-full py-2.5 rounded-lg font-bold transition-all ${isCurrentPlan
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : isUpgrade
                                        ? 'bg-primary text-white hover:bg-primary/90'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {isCurrentPlan ? 'Paket Aktif' : isUpgrade ? 'Upgrade' : 'Pilih'}
                            </button>
                        </div>
                    );
                })}
            </div>

            <p className="text-xs text-gray-400 mt-6 text-center">
                * Pembayaran saat ini dilakukan secara manual. Hubungi admin untuk konfirmasi pembayaran.
            </p>
        </div>
    );
}

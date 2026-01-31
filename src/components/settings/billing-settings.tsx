import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useSubscription } from '@/hooks/useSubscription';
import { PLAN_FEATURES, SubscriptionPlan } from '@/lib/constants/plans';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Crown, Sparkles, Zap, Rocket, Trophy, Gem, Check, AlertTriangle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog } from "@/components/ui/alert-dialog";

export function BillingSettings() {
    const venueId = useAppStore((s) => s.currentVenueId);
    const { plan, status, validUntil, pendingPlan, pendingEffectiveDate, isLoading, refresh } = useSubscription(venueId);
    const [isUpdating, setIsUpdating] = useState(false);

    // Dialog State
    const [targetPlan, setTargetPlan] = useState<SubscriptionPlan | null>(null);
    const [changeType, setChangeType] = useState<'UPGRADE' | 'DOWNGRADE' | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleSelectPlan = (selectedPlan: SubscriptionPlan) => {
        if (!venueId || selectedPlan === plan) return;

        const currentPrice = PLAN_FEATURES[plan].priceMonthly;
        const newPrice = PLAN_FEATURES[selectedPlan].priceMonthly;

        if (newPrice > currentPrice) {
            setChangeType('UPGRADE');
        } else {
            setChangeType('DOWNGRADE');
        }
        setTargetPlan(selectedPlan);
        setIsDialogOpen(true);
    };

    const processChange = async () => {
        if (!venueId || !targetPlan || !changeType) return;

        setIsUpdating(true);
        try {
            if (changeType === 'UPGRADE') {
                // Upgrade: Immediate Effect
                const validUntilDate = new Date();
                validUntilDate.setMonth(validUntilDate.getMonth() + 1);

                const { error } = await supabase
                    .from('venues')
                    .update({
                        subscription_plan: targetPlan,
                        subscription_status: 'ACTIVE',
                        subscription_valid_until: validUntilDate.toISOString(),
                        // Clear any pending downgrades if upgrading
                        pending_subscription_plan: null,
                        pending_subscription_effective_date: null
                    })
                    .eq('id', venueId);

                if (error) throw error;
                toast.success(`Berhasil upgrade ke paket ${PLAN_FEATURES[targetPlan].displayName}!`);
            } else {
                // Downgrade: Scheduled for 1st of next month
                const now = new Date();
                const effectiveDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // 1st of next month

                const { error } = await supabase
                    .from('venues')
                    .update({
                        pending_subscription_plan: targetPlan,
                        pending_subscription_effective_date: effectiveDate.toISOString()
                    })
                    .eq('id', venueId);

                if (error) throw error;
                toast.success(`Perubahan paket dijadwalkan mulai tangal ${effectiveDate.toLocaleDateString('id-ID')}`);
            }

            await refresh();
        } catch (err) {
            console.error(err);
            toast.error('Gagal mengubah paket. Silakan coba lagi.');
        } finally {
            setIsUpdating(false);
            setIsDialogOpen(false);
            setTargetPlan(null);
            setChangeType(null);
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
        <div className="max-w-4xl space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Langganan & Billing</h2>
                <p className="text-gray-500 font-bold">Kelola paket langganan dan fitur akses akun Anda.</p>
            </div>

            {/* Pending Change Banner */}
            {pendingPlan && pendingEffectiveDate && (
                <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-xl flex items-start gap-3 shadow-neo">
                    <Calendar className="text-yellow-600 flex-shrink-0" />
                    <div>
                        <h4 className="font-black uppercase text-yellow-800">Perubahan Paket Terjadwal</h4>
                        <p className="text-sm font-bold text-yellow-700 mt-1">
                            Paket Anda akan berubah menjadi <span className="underline">{PLAN_FEATURES[pendingPlan].displayName}</span> pada tanggal {pendingEffectiveDate.toLocaleDateString('id-ID')}.
                        </p>
                    </div>
                </div>
            )}

            {/* Current Plan Card */}
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

            {/* Plan Selection */}
            <div>
                <h3 className="text-xl font-black uppercase mb-4">Pilih Paket</h3>
                <div className="flex flex-col gap-6">
                    {(Object.keys(PLAN_FEATURES) as SubscriptionPlan[]).map((planKey) => {
                        const planConfig = PLAN_FEATURES[planKey];
                        const isCurrentPlan = plan === planKey;
                        const isPending = pendingPlan === planKey;

                        const baseStyle = {
                            STARTER: 'bg-white hover:bg-gray-50',
                            PRO: 'bg-brand-orange hover:bg-orange-400',
                            BUSINESS: 'bg-brand-lime hover:bg-lime-400',
                        }[planKey];

                        return (
                            <button
                                key={planKey}
                                onClick={() => handleSelectPlan(planKey)}
                                disabled={isCurrentPlan || isPending || isUpdating}
                                className={`relative border-[3px] border-black rounded-xl p-6 text-left transition-all group w-full
                                    ${isCurrentPlan
                                        ? 'shadow-none bg-gray-100 border-gray-400 opacity-80 cursor-default'
                                        : isPending
                                            ? 'shadow-none bg-yellow-50 border-yellow-400 cursor-default'
                                            : `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${baseStyle}`
                                    }
                                `}
                            >
                                <div className="flex flex-col sm:flex-row items-start gap-4">
                                    {/* Icon */}
                                    <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                                        {planIcons[planKey]}
                                    </div>

                                    {/* Content */}
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

                                        {/* Capabilities */}
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs font-bold uppercase">
                                                <div className="w-1.5 h-1.5 bg-black rounded-full" />
                                                Maks. {planConfig.maxCourts === 999 ? 'Unlimited' : planConfig.maxCourts} Lapangan
                                            </div>
                                            {planConfig.features.length > 0 ? planConfig.features.map((feature, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-xs font-bold uppercase">
                                                    <div className="w-1.5 h-1.5 bg-black rounded-full" />
                                                    {feature.replace(/_/g, ' ')}
                                                </div>
                                            )) : (
                                                <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500">
                                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                                    Fitur Dasar
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="hidden sm:flex flex-col items-end gap-2">
                                        {isCurrentPlan && (
                                            <div className="bg-black text-white px-3 py-1 rounded font-bold text-xs uppercase shadow-sm">
                                                Paket Aktif
                                            </div>
                                        )}
                                        {isPending && (
                                            <div className="bg-yellow-400 text-yellow-900 border-2 border-yellow-600 px-3 py-1 rounded font-bold text-xs uppercase shadow-sm">
                                                Akan Datang
                                            </div>
                                        )}
                                        {!isCurrentPlan && !isPending && (
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
            </div>

            <p className="text-xs text-gray-400 mt-6 text-center">
                * Pembayaran saat ini dilakukan secara manual. Hubungi admin untuk konfirmasi pembayaran.
            </p>

            {/* Confirmation Dialog */}
            <AlertDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onConfirm={processChange}
                title={changeType === 'UPGRADE' ? 'Konfirmasi Upgrade Paket' : 'Konfirmasi Downgrade Paket'}
                description={
                    changeType === 'UPGRADE' ? (
                        <>
                            Anda akan melakukan upgrade ke paket <span className="text-black font-black">{targetPlan && PLAN_FEATURES[targetPlan].displayName}</span>. Tagihan baru akan segera berlaku. Lanjutkan ke pembayaran?
                        </>
                    ) : (
                        <>
                            Downgrade ke paket <span className="text-black font-black">{targetPlan && PLAN_FEATURES[targetPlan].displayName}</span> akan berlaku efektif mulai tanggal <b>1 bulan depan</b>.
                            <br /><br />
                            Anda masih bisa menikmati fitur paket saat ini sampai periode berakhir.
                        </>
                    )
                }
                confirmLabel={isUpdating ? 'Memproses...' : (changeType === 'UPGRADE' ? 'Ya, Upgrade Sekarang' : 'Ya, Jadwalkan')}
                cancelLabel="Batal"
                variant={changeType === 'UPGRADE' ? 'default' : 'danger'}
            />
        </div>
    );
}

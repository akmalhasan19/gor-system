'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Lock, Rocket, Trophy, Gem } from 'lucide-react';
import { toast } from 'sonner';
import { useVenue } from '@/lib/venue-context';
import {
    PLAN_FEATURES,
    SubscriptionPaymentChannel,
    SubscriptionPaymentMethod,
    SubscriptionPlan,
} from '@/lib/constants/plans';
import { useSubscription } from '@/hooks/useSubscription';
import { getCsrfHeaders } from '@/lib/hooks/use-csrf';
import { SubscriptionPaymentData, SubscriptionPaymentPanel } from '@/components/subscription/subscription-payment-panel';

function isLockedSubscription(status: string, validUntil: Date | null) {
    if (status === 'PAST_DUE' || status === 'CANCELED') return true;
    if (status === 'TRIAL') {
        if (!validUntil) return true;
        return new Date() > validUntil;
    }
    return false;
}

export default function SubscriptionLockPage() {
    const router = useRouter();
    const { currentVenueId } = useVenue();
    const { plan, status, validUntil, isLoading, refresh } = useSubscription(currentVenueId || null);

    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('PRO');
    const [paymentData, setPaymentData] = useState<SubscriptionPaymentData | null>(null);
    const [isCreatingPayment, setIsCreatingPayment] = useState(false);
    const [lockReason, setLockReason] = useState<string | null>(null);

    const locked = useMemo(() => isLockedSubscription(status, validUntil), [status, validUntil]);

    useEffect(() => {
        setSelectedPlan(plan === 'STARTER' ? 'PRO' : plan);
    }, [plan]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        setLockReason(params.get('reason'));
    }, []);

    const planIcons: Record<SubscriptionPlan, React.ReactNode> = {
        STARTER: <Rocket className="w-6 h-6" />,
        PRO: <Trophy className="w-6 h-6" />,
        BUSINESS: <Gem className="w-6 h-6" />,
    };

    const createPayment = async (
        method: SubscriptionPaymentMethod,
        paymentChannel?: SubscriptionPaymentChannel
    ) => {
        if (!currentVenueId) return;

        setIsCreatingPayment(true);
        try {
            const response = await fetch('/api/subscriptions/create-payment', {
                method: 'POST',
                headers: getCsrfHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    venueId: currentVenueId,
                    targetPlan: selectedPlan,
                    paymentMethod: method,
                    paymentChannel: method === 'VA' ? paymentChannel : undefined,
                }),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Gagal membuat invoice subscription');
            }

            setPaymentData(result.payment);
        } catch (error: unknown) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Gagal membuat invoice subscription');
        } finally {
            setIsCreatingPayment(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 mx-auto border-4 border-black border-t-transparent animate-spin rounded-full" />
                    <p className="mt-3 text-sm font-bold uppercase">Memuat status langganan...</p>
                </div>
            </div>
        );
    }

    if (!currentVenueId) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="max-w-md bg-white border-2 border-black p-6 text-center space-y-3 shadow-neo">
                    <p className="font-black uppercase">Venue tidak ditemukan</p>
                    <button
                        type="button"
                        onClick={() => router.push('/onboarding')}
                        className="border-2 border-black bg-black text-white px-4 py-2 text-sm font-black uppercase"
                    >
                        Ke Onboarding
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-lime p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white border-4 border-black p-6 shadow-neo-lg space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="border-2 border-black bg-black text-white p-2">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black uppercase">Akses Dibatasi</h1>
                            <p className="text-sm text-gray-700 mt-1">
                                Masa trial Anda sudah selesai atau status langganan tidak aktif. Silakan aktivasi paket untuk membuka semua fitur.
                            </p>
                            {lockReason === 'venue_deactivated' && (
                                <p className="text-sm text-red-700 mt-2 font-bold">
                                    Venue ini sedang dinonaktifkan oleh tim internal. Hubungi support untuk reaktivasi.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-bold uppercase">
                        <span className="border border-black bg-white px-2 py-1">Status: {status}</span>
                        <span className="border border-black bg-white px-2 py-1">Plan Saat Ini: {PLAN_FEATURES[plan].displayName}</span>
                        {validUntil && (
                            <span className="border border-black bg-white px-2 py-1">Valid Until: {validUntil.toLocaleDateString('id-ID')}</span>
                        )}
                    </div>

                    {!locked && (
                        <div className="border-2 border-green-400 bg-green-50 p-3 text-sm font-bold text-green-700 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Langganan sudah aktif. Anda bisa kembali ke dashboard.
                        </div>
                    )}

                    {!locked ? (
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard')}
                            className="border-2 border-black bg-black text-white px-4 py-2 text-sm font-black uppercase"
                        >
                            Kembali ke Dashboard
                        </button>
                    ) : (
                        <>
                            <div className="space-y-3">
                                <p className="text-sm font-black uppercase">Pilih Paket</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {(Object.keys(PLAN_FEATURES) as SubscriptionPlan[]).map((planKey) => {
                                        const cfg = PLAN_FEATURES[planKey];
                                        const selected = selectedPlan === planKey;

                                        return (
                                            <button
                                                key={planKey}
                                                type="button"
                                                onClick={() => setSelectedPlan(planKey)}
                                                className={`border-2 border-black p-4 text-left transition-all ${selected ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    {planIcons[planKey]}
                                                    <span className="font-black uppercase">{cfg.displayName}</span>
                                                </div>
                                                <p className="text-xs font-bold">Rp {cfg.priceMonthly.toLocaleString('id-ID')}/bulan</p>
                                                <p className="text-xs mt-1 opacity-80">Maks {cfg.maxCourts === 999 ? 'Unlimited' : cfg.maxCourts} lapangan</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <SubscriptionPaymentPanel
                                key={paymentData?.subscriptionPaymentId || `lock-${selectedPlan}`}
                                paymentData={paymentData}
                                isCreating={isCreatingPayment}
                                onCreatePayment={createPayment}
                                onPaid={async () => {
                                    await refresh();
                                    router.push('/dashboard');
                                }}
                                title={`Aktifkan Paket ${PLAN_FEATURES[selectedPlan].displayName}`}
                                subtitle="Setelah pembayaran sukses, akses sistem akan terbuka otomatis."
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}


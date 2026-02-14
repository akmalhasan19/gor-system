'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CreditCard, Clock3 } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface TrialNoticeBannerProps {
    venueId: string | null;
}

function formatRemaining(ms: number) {
    if (ms <= 0) return 'Trial sudah berakhir';

    const totalHours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    if (days <= 0) return `${hours} jam lagi`;
    return `${days} hari ${hours} jam lagi`;
}

export function TrialNoticeBanner({ venueId }: TrialNoticeBannerProps) {
    const { status, validUntil, isLoading } = useSubscription(venueId);
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60 * 1000);
        return () => clearInterval(timer);
    }, []);

    const remainingText = useMemo(() => {
        if (!validUntil) return 'Masa trial sedang berjalan';
        return formatRemaining(validUntil.getTime() - now.getTime());
    }, [validUntil, now]);

    if (isLoading || status !== 'TRIAL') {
        return null;
    }

    return (
        <div className="border-2 border-black bg-yellow-100 p-4 shadow-neo flex flex-col gap-3">
            <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 mt-0.5" />
                <div className="flex-1">
                    <p className="font-black uppercase text-sm">Anda sedang di masa Trial Starter</p>
                    <p className="text-sm text-gray-700 mt-1">
                        Upgrade sekarang agar akses fitur tetap aktif setelah trial selesai.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase">
                <span className="inline-flex items-center gap-1 border border-black bg-white px-2 py-1">
                    <Clock3 className="w-3.5 h-3.5" />
                    {remainingText}
                </span>
                <span className="inline-flex items-center gap-1 border border-black bg-white px-2 py-1">
                    Paket Trial: Starter
                </span>
            </div>

            <div className="flex flex-wrap gap-2">
                <Link
                    href="/settings?tab=billing"
                    className="inline-flex items-center gap-2 border-2 border-black bg-black text-white px-4 py-2 text-xs font-black uppercase hover:bg-brand-orange hover:text-black transition-colors"
                >
                    <CreditCard className="w-4 h-4" />
                    Upgrade Sekarang
                </Link>
            </div>
        </div>
    );
}


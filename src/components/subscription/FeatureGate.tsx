'use client';

import React from 'react';
import { FeatureName, getRequiredPlanForFeature, PLAN_FEATURES } from '@/lib/constants/plans';
import { useSubscription } from '@/hooks/useSubscription';
import { Lock } from 'lucide-react';

interface FeatureGateProps {
    feature: FeatureName;
    venueId: string | null;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    blurContent?: boolean;
}

/**
 * FeatureGate component - Controls access to features based on subscription plan.
 * 
 * Usage:
 * <FeatureGate feature="POS" venueId={venueId}>
 *   <POSComponent />
 * </FeatureGate>
 */
export function FeatureGate({
    feature,
    venueId,
    children,
    fallback,
    blurContent = true,
}: FeatureGateProps) {
    const { canUseFeature, plan, isLoading } = useSubscription(venueId);

    if (isLoading) {
        return null; // Or a loading skeleton
    }

    const hasAccess = canUseFeature(feature);

    if (hasAccess) {
        return <>{children}</>;
    }

    // User doesn't have access to this feature
    const requiredPlan = getRequiredPlanForFeature(feature);
    const requiredPlanConfig = PLAN_FEATURES[requiredPlan];

    if (fallback) {
        return <>{fallback}</>;
    }

    // Default fallback: Upgrade prompt
    if (blurContent) {
        return (
            <div className="relative">
                <div className="blur-sm pointer-events-none opacity-50">{children}</div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg">
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-2xl text-center max-w-sm mx-4">
                        <div className="w-12 h-12 mx-auto mb-4 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                            <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Fitur Premium</h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                            Fitur ini membutuhkan paket <span className="font-bold text-primary">{requiredPlanConfig.displayName}</span> atau lebih tinggi.
                        </p>
                        <p className="text-xs text-neutral-500 mb-4">
                            Paket Anda saat ini: <span className="font-medium">{PLAN_FEATURES[plan].displayName}</span>
                        </p>
                        <a
                            href="/settings/billing"
                            className="inline-block w-full py-2.5 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                        >
                            Upgrade Sekarang
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // Simple text fallback
    return (
        <div className="p-4 border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 rounded-lg text-center">
            <Lock className="w-5 h-5 mx-auto mb-2 text-amber-600" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
                Upgrade ke <span className="font-bold">{requiredPlanConfig.displayName}</span> untuk mengakses fitur ini.
            </p>
        </div>
    );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SubscriptionPlan, SubscriptionStatus, FeatureName, hasFeature } from '@/lib/constants/plans';

interface SubscriptionState {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    validUntil: Date | null;
    maxCourts: number;
    pendingPlan?: SubscriptionPlan | null;
    pendingEffectiveDate?: Date | null;
    isLoading: boolean;
    error: string | null;
}

interface UseSubscriptionReturn extends SubscriptionState {
    canUseFeature: (feature: FeatureName) => boolean;
    isPlanActive: () => boolean;
    refresh: () => Promise<void>;
}

export function useSubscription(venueId: string | null): UseSubscriptionReturn {
    const [state, setState] = useState<SubscriptionState>({
        plan: 'STARTER',
        status: 'TRIAL',
        validUntil: null,
        maxCourts: 3,
        isLoading: true,
        error: null,
    });

    const fetchSubscription = useCallback(async () => {
        if (!venueId) {
            setState(prev => ({ ...prev, isLoading: false }));
            return;
        }

        try {
            const { data, error } = await supabase
                .from('venues')
                .select('subscription_plan, subscription_status, subscription_valid_until, max_courts, pending_subscription_plan, pending_subscription_effective_date')
                .eq('id', venueId)
                .single();

            if (error) throw error;

            let currentPlan = (data?.subscription_plan as SubscriptionPlan) || 'STARTER';
            let pendingPlan = data?.pending_subscription_plan as SubscriptionPlan | null;
            let pendingDate = data?.pending_subscription_effective_date ? new Date(data.pending_subscription_effective_date) : null;

            // LAZY CHECK: Apply only scheduled downgrade for ACTIVE subscriptions.
            // Pending plans created by unpaid checkout must not auto-activate on client.
            if (data?.subscription_status === 'ACTIVE' && pendingPlan && pendingDate && new Date() >= pendingDate) {
                console.log("Applying pending subscription downgrade...", pendingPlan);

                // Update DB immediately
                const { error: updateError } = await supabase
                    .from('venues')
                    .update({
                        subscription_plan: pendingPlan,
                        pending_subscription_plan: null,
                        pending_subscription_effective_date: null
                    })
                    .eq('id', venueId);

                if (!updateError) {
                    currentPlan = pendingPlan; // Use new plan for state
                    pendingPlan = null;
                    pendingDate = null;
                    // Refresh not strictly needed if we update status locally efficiently, but good to be consistent
                } else {
                    console.error("Failed to apply lazy subscription update", updateError);
                }
            }

            setState({
                plan: currentPlan,
                status: (data?.subscription_status as SubscriptionStatus) || 'TRIAL',
                validUntil: data?.subscription_valid_until ? new Date(data.subscription_valid_until) : null,
                maxCourts: data?.max_courts || 3,
                pendingPlan: pendingPlan, // Add to state interface if needed, or just internal logic
                pendingEffectiveDate: pendingDate,
                isLoading: false,
                error: null,
            });
        } catch (err) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: err instanceof Error ? err.message : 'Failed to fetch subscription',
            }));
        }
    }, [venueId]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    const canUseFeature = useCallback(
        (feature: FeatureName): boolean => {
            return hasFeature(state.plan, feature);
        },
        [state.plan]
    );

    const isPlanActive = useCallback((): boolean => {
        if (state.status === 'CANCELED' || state.status === 'PAST_DUE') {
            return false;
        }
        if (state.validUntil && new Date() > state.validUntil) {
            return false;
        }
        return true;
    }, [state.status, state.validUntil]);

    return {
        ...state,
        canUseFeature,
        isPlanActive,
        refresh: fetchSubscription,
    };
}

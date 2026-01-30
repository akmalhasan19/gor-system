'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SubscriptionPlan, SubscriptionStatus, FeatureName, hasFeature } from '@/lib/constants/plans';

interface SubscriptionState {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    validUntil: Date | null;
    maxCourts: number;
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
                .select('subscription_plan, subscription_status, subscription_valid_until, max_courts')
                .eq('id', venueId)
                .single();

            if (error) throw error;

            setState({
                plan: (data?.subscription_plan as SubscriptionPlan) || 'STARTER',
                status: (data?.subscription_status as SubscriptionStatus) || 'TRIAL',
                validUntil: data?.subscription_valid_until ? new Date(data.subscription_valid_until) : null,
                maxCourts: data?.max_courts || 3,
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
    }, [venueId, supabase]);

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

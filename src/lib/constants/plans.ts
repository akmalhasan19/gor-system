// Plan feature configuration for Smash Partner Subscription System
// This file defines features and limits for each subscription tier.

export type SubscriptionPlan = 'STARTER' | 'PRO' | 'BUSINESS';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIAL';

export type FeatureName =
    | 'POS'
    | 'INVENTORY'
    | 'STAFF_REPORT'
    | 'WHATSAPP_NOTIF'
    | 'MULTI_STAFF'
    | 'ADVANCED_ANALYTICS'
    | 'EXPORT_DATA';

export interface PlanConfig {
    name: string;
    displayName: string;
    priceMonthly: number; // in IDR
    maxCourts: number;
    features: FeatureName[];
    description: string;
}

export const PLAN_FEATURES: Record<SubscriptionPlan, PlanConfig> = {
    STARTER: {
        name: 'STARTER',
        displayName: 'Starter',
        priceMonthly: 99000,
        maxCourts: 3,
        features: [],
        description: 'Untuk GOR kecil dengan 1-3 lapangan. Cocok untuk memulai.',
    },
    PRO: {
        name: 'PRO',
        displayName: 'Pro',
        priceMonthly: 299000,
        maxCourts: 8,
        features: ['POS', 'INVENTORY', 'STAFF_REPORT', 'WHATSAPP_NOTIF', 'EXPORT_DATA'],
        description: 'Untuk GOR menengah. Termasuk POS dan Inventory management.',
    },
    BUSINESS: {
        name: 'BUSINESS',
        displayName: 'Business',
        priceMonthly: 499000,
        maxCourts: 999, // Effectively unlimited
        features: ['POS', 'INVENTORY', 'STAFF_REPORT', 'WHATSAPP_NOTIF', 'MULTI_STAFF', 'ADVANCED_ANALYTICS', 'EXPORT_DATA'],
        description: 'Untuk GOR besar atau chain. Fitur lengkap tanpa batasan.',
    },
};

/**
 * Check if a given plan has access to a specific feature.
 */
export function hasFeature(plan: SubscriptionPlan, feature: FeatureName): boolean {
    return PLAN_FEATURES[plan].features.includes(feature);
}

/**
 * Get the required plan for a specific feature.
 */
export function getRequiredPlanForFeature(feature: FeatureName): SubscriptionPlan {
    if (PLAN_FEATURES.STARTER.features.includes(feature)) return 'STARTER';
    if (PLAN_FEATURES.PRO.features.includes(feature)) return 'PRO';
    return 'BUSINESS';
}

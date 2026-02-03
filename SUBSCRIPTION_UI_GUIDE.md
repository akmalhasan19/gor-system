# 🚀 Smash Partner Subscription UI Implementation Guide

**Target System:** Next.js (App Router), Tailwind CSS
**Style:** Neo-brutalism (Smash Design System)
**Dependencies Required:**
*   `lucide-react` (Icons)
*   `sonner` (Toasts)
*   `@radix-ui/react-alert-dialog` (Modal primitives)
*   `clsx` & `tailwind-merge` (for utility components)

---

## 1. Plan Configuration & Types
This file defines the pricing structure and feature set to keep them centralized.

**File:** `src/lib/constants/plans.ts`

```typescript
// src/lib/constants/plans.ts

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
        features: ['POS', 'INVENTORY', 'STAFF_REPORT', 'WHATSAPP_NOTIF', 'EXPORT_DATA'], // Customize features for your system
        description: 'Untuk GOR menengah. Termasuk POS dan Inventory management.',
    },
    BUSINESS: {
        name: 'BUSINESS',
        displayName: 'Business',
        priceMonthly: 499000,
        maxCourts: 999,
        features: ['POS', 'INVENTORY', 'STAFF_REPORT', 'WHATSAPP_NOTIF', 'MULTI_STAFF', 'ADVANCED_ANALYTICS', 'EXPORT_DATA'],
        description: 'Untuk GOR besar atau chain. Fitur lengkap tanpa batasan.',
    },
};

export function hasFeature(plan: SubscriptionPlan, feature: FeatureName): boolean {
    return PLAN_FEATURES[plan].features.includes(feature);
}
```

---

## 2. Reusable Neo-Brutalist Modal
Consistent modal design matching the "Smash" theme.

**File:** `src/components/ui/alert-dialog.tsx`

```tsx
"use client";

import React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

interface AlertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string | React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'default';
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = 'default'
}) => {
    return (
        <AlertDialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogPrimitive.Portal>
                <AlertDialogPrimitive.Overlay className="fixed inset-0 bg-black/50 z-[60] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <AlertDialogPrimitive.Content
                    className="fixed left-[50%] top-[50%] z-[60] translate-x-[-50%] translate-y-[-50%] bg-white border-2 border-black shadow-neo w-full max-w-sm flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                >
                    <div className="bg-black text-white p-3 flex justify-between items-center border-b-2 border-black">
                        <AlertDialogPrimitive.Title className="font-black text-sm uppercase">
                            {title}
                        </AlertDialogPrimitive.Title>
                        <AlertDialogPrimitive.Cancel className="hover:text-brand-orange font-bold text-sm">X</AlertDialogPrimitive.Cancel>
                    </div>

                    <div className="p-6">
                        <AlertDialogPrimitive.Description className="font-bold text-sm">
                            {description}
                        </AlertDialogPrimitive.Description>
                    </div>

                    <div className="p-3 border-t-2 border-black bg-gray-50 flex gap-2 justify-end">
                        <AlertDialogPrimitive.Cancel className="bg-white text-black font-bold py-2 px-4 text-xs uppercase hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all">
                            {cancelLabel}
                        </AlertDialogPrimitive.Cancel>
                        <AlertDialogPrimitive.Action
                            onClick={() => { onConfirm(); onClose(); }}
                            className={`font-black py-2 px-4 text-xs uppercase text-white border-2 border-black shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-brand-orange hover:text-black'}`}
                        >
                            {confirmLabel}
                        </AlertDialogPrimitive.Action>
                    </div>
                </AlertDialogPrimitive.Content>
            </AlertDialogPrimitive.Portal>
        </AlertDialogPrimitive.Root>
    );
};
```

---

## 3. Subscription Hook (Logic Abstraction)
*Note to AI Agent: Adapt the `fetchSubscription` logic to your backend/database project.*

**File:** `src/hooks/useSubscription.ts`

```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';
// import { supabase } from '@/lib/supabase'; // UNCOMMENT AND ADAPT
import { SubscriptionPlan, SubscriptionStatus, FeatureName, hasFeature } from '@/lib/constants/plans';

interface SubscriptionState {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    validUntil: Date | null;
    maxCourts: number;
    pendingPlan?: SubscriptionPlan | null;
    pendingEffectiveDate?: Date | null;
    isLoading: boolean;
}

export function useSubscription(venueId: string | null) {
    const [state, setState] = useState<SubscriptionState>({
        plan: 'STARTER',
        status: 'TRIAL',
        validUntil: null,
        maxCourts: 3,
        isLoading: true,
    });

    const fetchSubscription = useCallback(async () => {
        if (!venueId) return;
        
        // MOCK IMPLEMENTATION - REPLACE WITH REAL API CALL
        // const { data } = await supabase.from('venues').select('*').eq('id', venueId).single();
        
        setTimeout(() => {
            setState({
                plan: 'STARTER', // Replace with real data
                status: 'ACTIVE',
                validUntil: new Date('2025-12-31'),
                maxCourts: 3,
                isLoading: false,
                pendingPlan: null,
                pendingEffectiveDate: null
            });
        }, 1000);
    }, [venueId]);

    useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

    return {
        ...state,
        canUseFeature: (feature: FeatureName) => hasFeature(state.plan, feature),
        refresh: fetchSubscription,
    };
}
```

---

## 4. Main UI Component: Billing Settings
This is the main component displaying plan cards, upgrade/downgrade banners, and active status.

**File:** `src/components/settings/billing-settings.tsx`

```tsx
import React, { useState } from 'react';
// import { useAppStore } from '@/lib/store'; // Replace with your state management
import { useSubscription } from '@/hooks/useSubscription';
import { PLAN_FEATURES, SubscriptionPlan } from '@/lib/constants/plans';
import { Rocket, Trophy, Gem, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog } from "@/components/ui/alert-dialog"; // Ensure path is correct

export function BillingSettings() {
    // 1. GET ID: Replace this with how your project gets the active venue/user ID
    // const venueId = useAppStore((s) => s.currentVenueId);
    const venueId = "dummy-venue-id"; 

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

        setChangeType(newPrice > currentPrice ? 'UPGRADE' : 'DOWNGRADE');
        setTargetPlan(selectedPlan);
        setIsDialogOpen(true);
    };

    const processChange = async () => {
        if (!targetPlan) return;
        setIsUpdating(true);
        try {
            // TODO: CALL YOUR API HERE TO UPDATE SUBSCRIPTION
            await new Promise(r => setTimeout(r, 1000)); // Mock delay
            
            toast.success(`Berhasil memproses paket ${PLAN_FEATURES[targetPlan].displayName}`);
            await refresh();
        } catch (err) {
            toast.error('Gagal mengubah paket.');
        } finally {
            setIsUpdating(false);
            setIsDialogOpen(false);
            setTargetPlan(null);
        }
    };

    if (isLoading) return <div className="p-12 text-center font-bold">Loading Subscription...</div>;

    const planIcons: Record<SubscriptionPlan, React.ReactNode> = {
        STARTER: <Rocket className="w-8 h-8 text-black" />,
        PRO: <Trophy className="w-8 h-8 text-black" />,
        BUSINESS: <Gem className="w-8 h-8 text-black" />,
    };

    return (
        <div className="max-w-4xl space-y-8 p-4">
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
            <div className="bg-gradient-to-r from-lime-200/50 to-lime-100/30 border border-lime-500/50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                    {planIcons[plan]}
                    <div>
                        <p className="text-sm text-gray-600 uppercase tracking-wide font-bold">Paket Aktif</p>
                        <p className="text-2xl font-black">{PLAN_FEATURES[plan].displayName}</p>
                    </div>
                </div>
                <p className="text-sm text-gray-600">
                    Status: <span className={`font-bold ${status === 'ACTIVE' ? 'text-green-600' : status === 'TRIAL' ? 'text-blue-600' : 'text-red-600'}`}>{status}</span>
                    {validUntil && <span className="ml-2">• Berlaku sampai: {validUntil.toLocaleDateString('id-ID')}</span>}
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
                            PRO: 'bg-orange-400 hover:bg-orange-300', // Brand Orange Color
                            BUSINESS: 'bg-lime-400 hover:bg-lime-300', // Brand Lime Color
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
                                    {/* Icon Box */}
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

                                        {/* Features List */}
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs font-bold uppercase">
                                                <div className="w-1.5 h-1.5 bg-black rounded-full" />
                                                Maks. {planConfig.maxCourts === 999 ? 'Unlimited' : planConfig.maxCourts} Lapangan
                                            </div>
                                            {planConfig.features.map((feature, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-xs font-bold uppercase">
                                                    <div className="w-1.5 h-1.5 bg-black rounded-full" />
                                                    {feature.replace(/_/g, ' ')}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Status Badge */}
                                    <div className="hidden sm:flex flex-col items-end gap-2">
                                        {isCurrentPlan && <div className="bg-black text-white px-3 py-1 rounded font-bold text-xs uppercase shadow-sm">Paket Aktif</div>}
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

            {/* Confirmation Dialog */}
            <AlertDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onConfirm={processChange}
                title={changeType === 'UPGRADE' ? 'Konfirmasi Upgrade' : 'Konfirmasi Downgrade'}
                description={
                    changeType === 'UPGRADE' 
                        ? `Upgrade ke ${targetPlan && PLAN_FEATURES[targetPlan].displayName} akan berlaku segera. Lanjutkan pembayaran?`
                        : `Downgrade ke ${targetPlan && PLAN_FEATURES[targetPlan].displayName} akan berlaku mulai bulan depan.`
                }
                confirmLabel={isUpdating ? 'Memproses...' : (changeType === 'UPGRADE' ? 'Bayar & Upgrade' : 'Jadwalkan')}
                variant={changeType === 'UPGRADE' ? 'default' : 'danger'}
            />
        </div>
    );
}
```

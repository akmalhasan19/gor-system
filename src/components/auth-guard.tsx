'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVenue } from '@/lib/venue-context';
import { supabase } from '@/lib/supabase';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { currentVenueId, isLoading } = useVenue();
    const router = useRouter();

    useEffect(() => {
        // Only run checks if we're not loading the venue context
        if (!isLoading) {
            checkUserAndVenue();
        }
    }, [currentVenueId, isLoading]);

    const checkUserAndVenue = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login');
            return;
        }

        // 1. Check Phone Verification
        const isPhoneVerifiedMeta = user.user_metadata?.phone_verified === true;

        if (!isPhoneVerifiedMeta) {
            // Fallback to DB check on client side -> This is the new "Strict Check" moved from middleware
            const { data: verification } = await supabase
                .from('phone_verifications')
                .select('is_verified')
                .eq('user_id', user.id)
                .eq('is_verified', true)
                .single();

            if (!verification?.is_verified) {
                // Not verified in DB either -> Redirect to login/verify
                router.push('/login?verify_phone=true');
                return;
            } else {
                // User IS verified in DB but metadata is stale.
                // Optionally: We could refresh the session here to update metadata?
                // For now, we allow them through.
            }
        }

        // 2. Check Venue
        if (!currentVenueId) {
            // No venue found in context, redirect to onboarding
            router.push('/onboarding');
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin border-4 border-black border-t-brand-lime rounded-full" />
                    <p className="font-display font-bold uppercase text-sm animate-pulse">Memuat sistem...</p>
                </div>
            </div>
        );
    }

    // While not mandatory, we only render children if we have a venue (or while redirecting)
    // To prevent flashing empty dashboard content
    if (!currentVenueId) {
        return null;
    }

    return <>{children}</>;
}

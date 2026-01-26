'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VenueOnboarding } from '@/components/onboarding/venue-onboarding';
import { supabase } from '@/lib/supabase';

export default function OnboardingPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuthAndOnboarding();
    }, []);

    const checkAuthAndOnboarding = async () => {
        try {
            // Check if user is authenticated
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Not authenticated, redirect to login
                router.push('/login');
                return;
            }

            setIsAuthenticated(true);

            // Check if user has already completed onboarding
            const response = await fetch('/api/onboarding/status');
            const { hasCompletedOnboarding } = await response.json();

            if (hasCompletedOnboarding) {
                // Already completed, redirect to dashboard
                router.push('/');
            } else {
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error);
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-lime flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-black border-t-brand-orange animate-spin mx-auto mb-4" />
                    <p className="font-black uppercase text-lg">Memuat...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect to login
    }

    return <VenueOnboarding />;
}

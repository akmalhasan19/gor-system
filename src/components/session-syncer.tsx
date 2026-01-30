'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useVenue } from '@/lib/venue-context';
import { getCsrfHeaders } from '@/lib/hooks/use-csrf';

export function SessionSyncer() {
    const { currentVenueId } = useVenue();

    useEffect(() => {
        const syncSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user && currentVenueId) {
                // Check if metadata needs update
                if (user.user_metadata?.venue_id !== currentVenueId) {
                    console.log('🔄 Syncing session metadata...');

                    // We cannot update metadata directly from client correctly without a secure endpoint 
                    // IF we want to be strict, but actually supabase.auth.updateUser works for users updating their own data 
                    // IF allowed by config. 
                    // However, it's safer to have an API endpoint do it or just try here.
                    // Let's try the API route approach for security or just client side if allowed.
                    // For now, let's call an API route to be safe and cleaner.

                    try {
                        await fetch('/api/auth/sync-session', {
                            method: 'POST',
                            headers: getCsrfHeaders({ 'Content-Type': 'application/json' }),
                            body: JSON.stringify({ venueId: currentVenueId }),
                        });
                        console.log('✅ Session metadata synced');
                    } catch (error) {
                        console.error('❌ Failed to sync session:', error);
                    }
                }
            }
        };

        if (currentVenueId) {
            syncSession();
        }
    }, [currentVenueId]);

    return null;
}

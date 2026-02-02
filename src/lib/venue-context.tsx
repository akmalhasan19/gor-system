'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserVenue, Venue } from './api/venues';
import { supabase } from './supabase';

interface VenueContextType {
    currentVenueId: string;
    setCurrentVenueId: (id: string) => void;
    venues: Venue[];
    currentVenue: Venue | null;
    isLoading: boolean;
    refreshVenue: () => Promise<void>;
}

const VenueContext = createContext<VenueContextType | undefined>(undefined);

export function VenueProvider({ children }: { children: React.ReactNode }) {
    const [currentVenueId, setCurrentVenueId] = useState<string>('');
    const [venues, setVenues] = useState<Venue[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUserVenue();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                loadUserVenue();
            } else if (event === 'SIGNED_OUT') {
                setVenues([]);
                setCurrentVenueId('');
                setIsLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const loadUserVenue = async () => {
        try {
            // Get current user
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
                console.debug('No authenticated user');
                if (error) {
                    // Start fresh if the session is invalid (e.g. user deleted on server)
                    await supabase.auth.signOut();
                }
                setIsLoading(false);
                return;
            }

            // Get user's venue
            const userVenue = await getUserVenue(user.id);

            if (userVenue) {
                setVenues([userVenue]);
                setCurrentVenueId(userVenue.id);
            } else {
                // User has no venue yet (probably in onboarding)
                setVenues([]);
                setCurrentVenueId('');
            }
        } catch (error: any) {
            // Silently handle 406 errors - user likely hasn't completed onboarding yet
            if (error?.code === 'PGRST116' || error?.message?.includes('406')) {
                console.log('User has no venue yet (onboarding not completed)');
                setVenues([]);
                setCurrentVenueId('');
            } else {
                console.error('Failed to load user venue:', error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const currentVenue = venues.find(v => v.id === currentVenueId) || null;

    return (
        <VenueContext.Provider value={{
            currentVenueId,
            setCurrentVenueId,
            venues,
            currentVenue,
            isLoading,
            refreshVenue: loadUserVenue
        }}>
            {children}
        </VenueContext.Provider>
    );
}

export function useVenue() {
    const context = useContext(VenueContext);
    if (!context) throw new Error('useVenue must be used within VenueProvider');
    return context;
}

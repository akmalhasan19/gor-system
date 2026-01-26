'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getVenues, Venue } from './api/venues';

interface VenueContextType {
    currentVenueId: string;
    setCurrentVenueId: (id: string) => void;
    venues: Venue[];
    currentVenue: Venue | null;
    isLoading: boolean;
}

const VenueContext = createContext<VenueContextType | undefined>(undefined);

export function VenueProvider({ children }: { children: React.ReactNode }) {
    // Default to strict UUID if possible, or handle empty string
    const [currentVenueId, setCurrentVenueId] = useState<string>('');
    const [venues, setVenues] = useState<Venue[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadVenues();
    }, []);

    const loadVenues = async () => {
        try {
            const data = await getVenues();
            setVenues(data);

            // Set default venue if none selected
            if (data.length > 0 && !currentVenueId) {
                setCurrentVenueId(data[0].id);
            }
        } catch (error) {
            console.error('Failed to load venues:', error);
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
            isLoading
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

import { useEffect } from 'react';
import { supabase } from '../supabase';
import { useAppStore } from '../store';
import { useVenue } from '../venue-context';
import { toast } from 'sonner';
import { logger } from '../logger';

export function useRealtimeSubscription() {
    const {
        syncBookings, syncProducts, syncCustomers, syncTransactions, syncCourts,
        handleRealtimeBooking, handleRealtimeProduct, handleRealtimeCustomer, handleRealtimeCourt
    } = useAppStore();
    const { currentVenueId } = useVenue();

    useEffect(() => {
        if (!currentVenueId) return;

        logger.info('🔌 Initializing Realtime Subscriptions...');

        const channel = supabase
            .channel('db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `venue_id=eq.${currentVenueId}`
                },
                async (payload) => {
                    logger.debug('📅 Booking updated:', payload);
                    toast.info('Data Booking diperbarui');
                    handleRealtimeBooking(payload);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'products',
                    filter: `venue_id=eq.${currentVenueId}`
                },
                async (payload) => {
                    logger.debug('📦 Product updated:', payload);
                    handleRealtimeProduct(payload);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'customers',
                    filter: `venue_id=eq.${currentVenueId}`
                },
                async (payload) => {
                    logger.debug('👥 Customer updated:', payload);
                    handleRealtimeCustomer(payload);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                    filter: `venue_id=eq.${currentVenueId}`
                },
                async (payload) => {
                    logger.debug('💰 Transaction updated:', payload);
                    await syncTransactions(currentVenueId);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'courts',
                    filter: `venue_id=eq.${currentVenueId}`
                },
                async (payload) => {
                    logger.debug('🏸 Court updated:', payload);
                    handleRealtimeCourt(payload);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    logger.info('✅ Connected to Supabase Realtime');
                }
            });

        return () => {
            logger.info('🔌 Disconnecting Realtime...');
            supabase.removeChannel(channel);
        };
    }, [currentVenueId]); // Simplified dependencies to avoid re-renders
}

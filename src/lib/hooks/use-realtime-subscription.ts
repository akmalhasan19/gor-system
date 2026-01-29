import { useEffect } from 'react';
import { supabase } from '../supabase';
import { useAppStore } from '../store';
import { useVenue } from '../venue-context';
import { toast } from 'sonner';

export function useRealtimeSubscription() {
    const {
        syncBookings, syncProducts, syncCustomers, syncTransactions, syncCourts,
        handleRealtimeBooking, handleRealtimeProduct, handleRealtimeCustomer, handleRealtimeCourt
    } = useAppStore();
    const { currentVenueId } = useVenue();

    useEffect(() => {
        console.log('🔌 Initializing Realtime Subscriptions...');

        const channel = supabase
            .channel('db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                },
                async (payload) => {
                    console.log('📅 Booking updated:', payload);
                    toast.info('Data Booking diperbarui');
                    if (currentVenueId) {
                        handleRealtimeBooking(payload);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'products',
                },
                async (payload) => {
                    console.log('📦 Product updated:', payload);
                    if (currentVenueId) {
                        handleRealtimeProduct(payload);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'customers',
                },
                async (payload) => {
                    console.log('👥 Customer updated:', payload);
                    if (currentVenueId) {
                        handleRealtimeCustomer(payload);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                },
                async (payload) => {
                    console.log('💰 Transaction updated:', payload);
                    if (currentVenueId) {
                        await syncTransactions(currentVenueId);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'courts',
                },
                async (payload) => {
                    console.log('🏸 Court updated:', payload);
                    if (currentVenueId) {
                        handleRealtimeCourt(payload);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Connected to Supabase Realtime');
                }
            });

        return () => {
            console.log('🔌 Disconnecting Realtime...');
            supabase.removeChannel(channel);
        };
    }, [
        syncBookings, syncProducts, syncCustomers, syncTransactions, syncCourts,
        handleRealtimeBooking, handleRealtimeProduct, handleRealtimeCustomer, handleRealtimeCourt,
        currentVenueId
    ]);
}

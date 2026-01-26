import { useEffect } from 'react';
import { supabase } from '../supabase';
import { useAppStore } from '../store';
import { useVenue } from '../venue-context';
import { toast } from 'sonner';

export function useRealtimeSubscription() {
    const { syncBookings, syncProducts, syncCustomers, syncTransactions, syncCourts } = useAppStore();
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
                        await syncBookings(currentVenueId);
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
                    await syncProducts();
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
                    await syncCustomers();
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
                    await syncTransactions();
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
                        await syncCourts(currentVenueId);
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
    }, [syncBookings, syncProducts, syncCustomers, syncTransactions, syncCourts, currentVenueId]);
}

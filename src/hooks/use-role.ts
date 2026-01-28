"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useVenue } from '@/lib/venue-context';
import { AppRole, PERMISSIONS, Permission } from '@/types/role';

export function useUserRole() {
    const { currentVenueId } = useVenue();
    const [role, setRole] = useState<AppRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function fetchRole() {
            if (!currentVenueId) {
                if (isMounted) setIsLoading(false);
                return;
            }

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    if (isMounted) {
                        setRole(null);
                        setIsLoading(false);
                    }
                    return;
                }

                const { data, error } = await supabase
                    .from('user_venues')
                    .select('role')
                    .eq('user_id', user.id)
                    .eq('venue_id', currentVenueId)
                    .single();

                if (error) {
                    console.error('Error fetching role:', error);
                }

                if (isMounted) {
                    if (data) {
                        setRole(data.role as AppRole);
                    } else {
                        setRole(null);
                    }
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error in useUserRole:', error);
                if (isMounted) setIsLoading(false);
            }
        }

        fetchRole();

        return () => {
            isMounted = false;
        };
    }, [currentVenueId]);

    const hasPermission = (permission: Permission) => {
        if (!role) return false;
        // @ts-ignore - Check if role exists in the permission array
        return PERMISSIONS[permission]?.includes(role) ?? false;
    };

    return { role, isLoading, hasPermission };
}

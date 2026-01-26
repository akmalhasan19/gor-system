import { supabase } from '../supabase';

export interface Venue {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    operatingHoursStart: number;
    operatingHoursEnd: number;
    isActive: boolean;
}

export async function getVenues(): Promise<Venue[]> {
    const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        address: row.address,
        phone: row.phone,
        email: row.email,
        operatingHoursStart: row.operating_hours_start,
        operatingHoursEnd: row.operating_hours_end,
        isActive: row.is_active,
    }));
}

export async function getVenueById(id: string): Promise<Venue | null> {
    const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;

    return {
        id: data.id,
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        operatingHoursStart: data.operating_hours_start,
        operatingHoursEnd: data.operating_hours_end,
        isActive: data.is_active,
    };
}

export async function createVenue(venue: Omit<Venue, 'id'>): Promise<Venue> {
    const { data, error } = await supabase
        .from('venues')
        .insert({
            name: venue.name,
            address: venue.address,
            phone: venue.phone,
            email: venue.email,
            operating_hours_start: venue.operatingHoursStart,
            operating_hours_end: venue.operatingHoursEnd,
            is_active: venue.isActive,
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        operatingHoursStart: data.operating_hours_start,
        operatingHoursEnd: data.operating_hours_end,
        isActive: data.is_active,
    };
}

export async function updateVenue(id: string, updates: Partial<Venue>): Promise<void> {
    const dbUpdates: any = { updated_at: new Date().toISOString() };

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.operatingHoursStart !== undefined)
        dbUpdates.operating_hours_start = updates.operatingHoursStart;
    if (updates.operatingHoursEnd !== undefined)
        dbUpdates.operating_hours_end = updates.operatingHoursEnd;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { error } = await supabase
        .from('venues')
        .update(dbUpdates)
        .eq('id', id);

    if (error) throw error;
}

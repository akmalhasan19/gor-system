import { supabase } from '../supabase';

export interface Court {
    id: string;
    venueId: string;
    name: string;
    courtNumber: number;
    isActive: boolean;
    hourlyRate: number;
    notes?: string;
}

const VENUE_ID = '00000000-0000-0000-0000-000000000001';

export async function getCourts(): Promise<Court[]> {
    const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('venue_id', VENUE_ID)
        .eq('is_active', true)
        .order('court_number', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
        id: row.id,
        venueId: row.venue_id,
        name: row.name,
        courtNumber: row.court_number,
        isActive: row.is_active,
        hourlyRate: row.hourly_rate,
        notes: row.notes,
    }));
}

export async function createCourt(court: Omit<Court, 'id' | 'venueId'>): Promise<Court> {
    const { data, error } = await supabase
        .from('courts')
        .insert({
            venue_id: VENUE_ID,
            name: court.name,
            court_number: court.courtNumber,
            is_active: court.isActive,
            hourly_rate: court.hourlyRate,
            notes: court.notes,
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        venueId: data.venue_id,
        name: data.name,
        courtNumber: data.court_number,
        isActive: data.is_active,
        hourlyRate: data.hourly_rate,
        notes: data.notes,
    };
}

export async function updateCourt(id: string, updates: Partial<Court>): Promise<void> {
    const dbUpdates: any = { updated_at: new Date().toISOString() };

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.courtNumber !== undefined) dbUpdates.court_number = updates.courtNumber;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    const { error } = await supabase
        .from('courts')
        .update(dbUpdates)
        .eq('id', id);

    if (error) throw error;
}

export async function deleteCourt(id: string): Promise<void> {
    // Soft delete by setting is_active to false
    const { error } = await supabase
        .from('courts')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
}

import { supabase } from '../supabase';

export interface Court {
    id: string;
    venueId: string;
    name: string;
    courtNumber: number;
    isActive: boolean;
    hourlyRate: number;
    memberHourlyRate?: number;
    photoUrl?: string; // URL to the court image
    courtType?: string; // Type of court surface
    notes?: string;
}

export async function getCourts(venueId: string): Promise<Court[]> {
    const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('venue_id', venueId)
        .eq('is_active', true)
        .order('court_number', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
        id: row.id,
        venueId: row.venue_id,
        name: row.name,
        courtNumber: Number(row.court_number) || 1,
        isActive: row.is_active,
        hourlyRate: Number(row.hourly_rate) || 0,  // Supabase DECIMAL returns string
        memberHourlyRate: Number(row.member_hourly_rate) || undefined,
        photoUrl: row.photo_url,
        courtType: row.court_type,
        notes: row.notes,
    }));
}

export async function createCourt(
    venueId: string,
    court: Omit<Court, 'id' | 'venueId'>
): Promise<Court> {
    const { data, error } = await supabase
        .from('courts')
        .insert({
            venue_id: venueId,
            name: court.name,
            court_number: court.courtNumber,
            is_active: court.isActive,
            hourly_rate: court.hourlyRate,
            member_hourly_rate: court.memberHourlyRate,
            photo_url: court.photoUrl,
            court_type: court.courtType,
            notes: court.notes,
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        venueId: data.venue_id,
        name: data.name,
        courtNumber: Number(data.court_number) || 1,
        isActive: data.is_active,
        hourlyRate: Number(data.hourly_rate) || 0,  // Supabase DECIMAL returns string
        memberHourlyRate: Number(data.member_hourly_rate) || undefined,
        photoUrl: data.photo_url,
        courtType: data.court_type,
        notes: data.notes,
    };
}

/**
 * Bulk create multiple courts for a venue during onboarding
 * Generates courts named "Lapangan 1", "Lapangan 2", etc.
 */
export async function createMultipleCourts(
    venueId: string,
    count: number,
    hourlyRate: number = 50000
): Promise<Court[]> {
    const courtsToCreate = [];

    for (let i = 1; i <= count; i++) {
        courtsToCreate.push({
            venue_id: venueId,
            name: `Lapangan ${i}`,
            court_number: i,
            is_active: true,
            hourly_rate: hourlyRate,
        });
    }

    const { data, error } = await supabase
        .from('courts')
        .insert(courtsToCreate)
        .select();

    if (error) throw error;

    return (data || []).map(row => ({
        id: row.id,
        venueId: row.venue_id,
        name: row.name,
        courtNumber: Number(row.court_number) || 1,
        isActive: row.is_active,
        hourlyRate: Number(row.hourly_rate) || 0,  // Supabase DECIMAL returns string
        memberHourlyRate: Number(row.member_hourly_rate) || undefined,
        photoUrl: row.photo_url,
        courtType: row.court_type,
        notes: row.notes,
    }));
}

export async function updateCourt(id: string, updates: Partial<Court>): Promise<void> {
    const dbUpdates: any = { updated_at: new Date().toISOString() };

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.courtNumber !== undefined) dbUpdates.court_number = updates.courtNumber;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate;
    if (updates.memberHourlyRate !== undefined) dbUpdates.member_hourly_rate = updates.memberHourlyRate;
    if (updates.photoUrl !== undefined) dbUpdates.photo_url = updates.photoUrl;
    if (updates.courtType !== undefined) dbUpdates.court_type = updates.courtType;
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


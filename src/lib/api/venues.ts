import { supabase } from '../supabase';

export interface UserVenue {
    id: string;
    userId: string;
    venueId: string;
    role: 'owner' | 'manager' | 'staff';
    createdAt: string;
}

export interface WinbackConfiguration {
    enabled?: boolean;
    promo_code_prefix?: string;
    promo_code_suffix_length?: number;
    default_discount_percent?: number;
    validity_days?: number;
    auto_send_enabled?: boolean;
    message_template?: string;
}

import { DepositPolicy } from '../constants';

export interface Venue {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    operatingHoursStart: number;
    operatingHoursEnd: number;
    isActive: boolean;
    // Operational Settings
    bookingTolerance?: number; // minutes
    overtimePolicy?: 'allow' | 'charge' | 'strict';
    waNotificationTime?: string; // "HH:MM"
    fonnteToken?: string;
    waTemplateReminder?: string;
    waDeviceId?: string;
    waStatus?: 'connected' | 'disconnected' | 'scanned';
    // Win-back Promo Configuration
    winbackConfiguration?: WinbackConfiguration;
    // Deposit Policy
    depositPolicy?: DepositPolicy;
    photo_url?: string;
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
        bookingTolerance: row.booking_tolerance,
        overtimePolicy: row.overtime_policy,
        waNotificationTime: row.wa_notification_time,
        fonnteToken: row.fonnte_token,
        waTemplateReminder: row.wa_template_reminder,
        waDeviceId: row.wa_device_id,
        waStatus: row.wa_status,
        winbackConfiguration: row.winback_configuration,
        depositPolicy: row.deposit_policy,
        photo_url: row.photo_url,
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
        bookingTolerance: data.booking_tolerance,
        overtimePolicy: data.overtime_policy,
        waNotificationTime: data.wa_notification_time,
        fonnteToken: data.fonnte_token,
        waTemplateReminder: data.wa_template_reminder,
        waDeviceId: data.wa_device_id,
        waStatus: data.wa_status,
        winbackConfiguration: data.winback_configuration,
        depositPolicy: data.deposit_policy,
        photo_url: data.photo_url,
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
            booking_tolerance: venue.bookingTolerance,
            overtime_policy: venue.overtimePolicy,
            wa_notification_time: venue.waNotificationTime,
            fonnte_token: venue.fonnteToken,
            wa_template_reminder: venue.waTemplateReminder,
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
        bookingTolerance: data.booking_tolerance,
        overtimePolicy: data.overtime_policy,
        waNotificationTime: data.wa_notification_time,
        fonnteToken: data.fonnte_token,
        waTemplateReminder: data.wa_template_reminder,
        depositPolicy: data.deposit_policy,
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

    // Operational Updates
    if (updates.bookingTolerance !== undefined) dbUpdates.booking_tolerance = updates.bookingTolerance;
    if (updates.overtimePolicy !== undefined) dbUpdates.overtime_policy = updates.overtimePolicy;
    if (updates.waNotificationTime !== undefined) dbUpdates.wa_notification_time = updates.waNotificationTime;
    if (updates.fonnteToken !== undefined) dbUpdates.fonnte_token = updates.fonnteToken;
    if (updates.waTemplateReminder !== undefined) dbUpdates.wa_template_reminder = updates.waTemplateReminder;
    if (updates.waDeviceId !== undefined) dbUpdates.wa_device_id = updates.waDeviceId;
    if (updates.waStatus !== undefined) dbUpdates.wa_status = updates.waStatus;
    if (updates.winbackConfiguration !== undefined) dbUpdates.winback_configuration = updates.winbackConfiguration;
    if (updates.depositPolicy !== undefined) dbUpdates.deposit_policy = updates.depositPolicy;
    if (updates.photo_url !== undefined) dbUpdates.photo_url = updates.photo_url;

    const { error } = await supabase
        .from('venues')
        .update(dbUpdates)
        .eq('id', id);

    if (error) throw error;
}

export async function createVenueWithOwner(
    userId: string,
    venueData: {
        name: string;
        address?: string;
        phone?: string;
        email?: string;
        operatingHoursStart: number;
        operatingHoursEnd: number;
    }
): Promise<Venue> {
    // Create the venue first
    const { data: venueRow, error: venueError } = await supabase
        .from('venues')
        .insert({
            name: venueData.name,
            address: venueData.address,
            phone: venueData.phone,
            email: venueData.email,
            operating_hours_start: venueData.operatingHoursStart,
            operating_hours_end: venueData.operatingHoursEnd,
            is_active: true,
            // Defaults
            booking_tolerance: 15,
            wa_notification_time: '07:00'
        })
        .select()
        .single();

    if (venueError) throw venueError;

    // Create the user-venue association
    const { error: associationError } = await supabase
        .from('user_venues')
        .insert({
            user_id: userId,
            venue_id: venueRow.id,
            role: 'owner',
        });

    if (associationError) {
        // Rollback: delete the venue if association fails
        await supabase.from('venues').delete().eq('id', venueRow.id);
        throw associationError;
    }

    return {
        id: venueRow.id,
        name: venueRow.name,
        address: venueRow.address,
        phone: venueRow.phone,
        email: venueRow.email,
        operatingHoursStart: venueRow.operating_hours_start,
        operatingHoursEnd: venueRow.operating_hours_end,
        isActive: venueRow.is_active,
        bookingTolerance: venueRow.booking_tolerance,
        overtimePolicy: venueRow.overtime_policy,
        waNotificationTime: venueRow.wa_notification_time,
    };
}

export async function getUserVenue(userId: string): Promise<Venue | null> {
    const { data, error } = await supabase
        .from('user_venues')
        .select(`
            venue_id,
            venues (
                id,
                name,
                address,
                phone,
                email,
                operating_hours_start,
                operating_hours_end,
                is_active,
                booking_tolerance,
                overtime_policy,
                wa_notification_time,
                fonnte_token,
                wa_template_reminder,
                deposit_policy,
                wa_device_id,
                wa_device_id,
                wa_status,
                photo_url
            )
        `)
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

    if (error || !data) return null;

    const venue = data.venues as any;
    if (!venue) return null;

    return {
        id: venue.id,
        name: venue.name,
        address: venue.address,
        phone: venue.phone,
        email: venue.email,
        operatingHoursStart: venue.operating_hours_start,
        operatingHoursEnd: venue.operating_hours_end,
        isActive: venue.is_active,
        bookingTolerance: venue.booking_tolerance,
        overtimePolicy: venue.overtime_policy,
        waNotificationTime: venue.wa_notification_time,
        fonnteToken: venue.fonnte_token,
        waTemplateReminder: venue.wa_template_reminder,
        waDeviceId: venue.wa_device_id,
        waStatus: venue.wa_status,
        winbackConfiguration: venue.winback_configuration,
        depositPolicy: venue.deposit_policy,
        photo_url: venue.photo_url,
    };
}

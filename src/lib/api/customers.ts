import { supabase } from '../supabase';
import { Customer } from '../constants';

export async function getCustomers(venueId: string): Promise<Customer[]> {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('venue_id', venueId)
        .eq('is_deleted', false) // Filter active only
        .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        isMember: row.is_member,
        quota: row.quota,
        membershipExpiry: row.membership_expiry,
        photo_url: row.photo_url,
        isDeleted: row.is_deleted,
        deletedAt: row.deleted_at
    }));
}

export async function createCustomer(venueId: string, customer: Omit<Customer, 'id'>): Promise<Customer> {
    const { data, error } = await supabase
        .from('customers')
        .insert({
            venue_id: venueId,
            name: customer.name,
            phone: customer.phone,
            is_member: customer.isMember,
            quota: customer.quota || 0,
            membership_expiry: customer.membershipExpiry || null,
            photo_url: customer.photo_url || null,
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        name: data.name,
        phone: data.phone,
        isMember: data.is_member,
        quota: data.quota,
        membershipExpiry: data.membership_expiry,
        photo_url: data.photo_url,
    };
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
    const dbUpdates: any = {};

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.isMember !== undefined) dbUpdates.is_member = updates.isMember;
    if (updates.quota !== undefined) dbUpdates.quota = updates.quota;
    if (updates.membershipExpiry !== undefined) dbUpdates.membership_expiry = updates.membershipExpiry;
    if (updates.photo_url !== undefined) dbUpdates.photo_url = updates.photo_url;

    const { error } = await supabase
        .from('customers')
        .update(dbUpdates)
        .eq('id', id);

    if (error) throw error;
}

export async function decrementQuota(id: string): Promise<void> {
    // Fetch current quota
    const { data, error: fetchError } = await supabase
        .from('customers')
        .select('quota')
        .eq('id', id)
        .single();

    if (fetchError) throw fetchError;

    const newQuota = Math.max(0, (data?.quota || 0) - 1);

    const { error } = await supabase
        .from('customers')
        .update({ quota: newQuota })
        .eq('id', id);

    if (error) throw error;
}

export async function deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase
        .from('customers')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw error;
}

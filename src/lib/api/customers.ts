import { supabase } from '../supabase';
import { Customer } from '../constants';

const VENUE_ID = '00000000-0000-0000-0000-000000000001';

export async function getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('venue_id', VENUE_ID)
        .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        isMember: row.is_member,
        quota: row.quota,
        membershipExpiry: row.membership_expiry,
    }));
}

export async function createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    const { data, error } = await supabase
        .from('customers')
        .insert({
            venue_id: VENUE_ID,
            name: customer.name,
            phone: customer.phone,
            is_member: customer.isMember,
            quota: customer.quota || 0,
            membership_expiry: customer.membershipExpiry || null,
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
    };
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
    const dbUpdates: any = {};

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.isMember !== undefined) dbUpdates.is_member = updates.isMember;
    if (updates.quota !== undefined) dbUpdates.quota = updates.quota;
    if (updates.membershipExpiry !== undefined) dbUpdates.membership_expiry = updates.membershipExpiry;

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

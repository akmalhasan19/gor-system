import { createClient } from '@/lib/supabase/client';

export interface ShiftExpense {
    id: string;
    venue_id: string;
    shift_id: string;
    amount: number;
    category: string;
    description: string | null;
    created_at: string;
    created_by: string | null;
}

export async function createExpense(
    venueId: string,
    shiftId: string,
    data: { amount: number; category: string; description?: string }
): Promise<ShiftExpense> {
    const supabase = createClient();

    const { data: expense, error } = await supabase
        .from('shift_expenses')
        .insert({
            venue_id: venueId,
            shift_id: shiftId,
            amount: data.amount,
            category: data.category,
            description: data.description || null
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating expense:', error);
        throw error;
    }

    return expense;
}

export async function getDailyExpenses(venueId: string, date: string): Promise<ShiftExpense[]> {
    const supabase = createClient();

    // Filter by created_at date (in UTC or adjust as needed, here simple date string match if possible, 
    // but easier to filter via range)
    const startDate = `${date}T00:00:00`;
    const endDate = `${date}T23:59:59.999`;

    const { data: expenses, error } = await supabase
        .from('shift_expenses')
        .select('*')
        .eq('venue_id', venueId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    if (error) {
        console.error('Error fetching daily expenses:', error);
        throw error;
    }

    return expenses || [];
}

export async function getShiftExpenses(shiftId: string): Promise<ShiftExpense[]> {
    const supabase = createClient();

    const { data: expenses, error } = await supabase
        .from('shift_expenses')
        .select('*')
        .eq('shift_id', shiftId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching shift expenses:', error);
        throw error;
    }

    return expenses || [];
}

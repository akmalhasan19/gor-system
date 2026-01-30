import { supabase } from '../supabase';
import { Transaction, CartItem } from '../constants';

export async function createTransaction(
    venueId: string,
    items: CartItem[],
    paidAmount: number,
    paymentMethod: string,
    status: 'PAID' | 'PARTIAL' | 'UNPAID'
): Promise<Transaction> {
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Start a transaction
    const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
            venue_id: venueId,
            total_amount: totalAmount,
            paid_amount: paidAmount,
            payment_method: paymentMethod,
            status: status,
        })
        .select()
        .single();

    if (transactionError) throw transactionError;

    // Insert transaction items
    const itemsToInsert = items.map(item => ({
        transaction_id: transactionData.id,
        reference_id: item.referenceId || null,
        type: item.type,
        name: item.name,
        quantity: item.quantity,
        price: item.price, // Map to price column, NOT price_at_moment if schema differs, but let's check schema again. Schema has price.
        subtotal: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    // Update product stock
    for (const item of items) {
        if (item.type === 'PRODUCT' && item.referenceId) {
            const { data: product } = await supabase
                .from('products')
                .select('stock_quantity')
                .eq('id', item.referenceId)
                .single();

            if (product) {
                await supabase
                    .from('products')
                    .update({ stock_quantity: product.stock_quantity - item.quantity })
                    .eq('id', item.referenceId);
            }
        }

        // Update booking status
        if (item.type === 'BOOKING' && item.referenceId) {
            const newStatus = status === 'PAID' ? 'LUNAS' : (status === 'PARTIAL' ? 'DP' : 'BELUM_BAYAR');

            await supabase
                .from('bookings')
                .update({
                    status: newStatus,
                    paid_amount: status === 'PAID' ? item.price : paidAmount
                })
                .eq('id', item.referenceId);
        }
    }

    return {
        id: transactionData.id,
        date: transactionData.created_at,
        items: items,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        changeAmount: paidAmount >= totalAmount ? paidAmount - totalAmount : 0,
        paymentMethod: paymentMethod as any,
        status: status,
        cashierName: 'Admin',
    };
}

export async function getTransactions(venueId: string, limit: number = 50): Promise<Transaction[]> {
    const { data, error } = await supabase
        .from('transactions')
        .select(`
            *,
            transaction_items (*)
        `)
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;

    return (data || []).map(row => ({
        id: row.id,
        date: row.created_at,
        items: (row.transaction_items || []).map((item: any) => ({
            id: item.id,
            type: item.type,
            name: item.name,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 0,
            referenceId: item.reference_id,
        })),
        totalAmount: Number(row.total_amount) || 0, // Supabase DECIMAL returns string
        paidAmount: Number(row.paid_amount) || 0,   // Supabase DECIMAL returns string
        changeAmount: Number(row.paid_amount) >= Number(row.total_amount)
            ? Number(row.paid_amount) - Number(row.total_amount)
            : 0,
        paymentMethod: row.payment_method as any,
        status: row.status,
        cashierName: 'Admin',
    }));
}

export async function getTransactionsRange(venueId: string, startDate: string, endDate: string): Promise<Transaction[]> {
    const { data, error } = await supabase
        .from('transactions')
        .select(`
            *,
            transaction_items (*)
        `)
        .eq('venue_id', venueId)
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
        id: row.id,
        date: row.created_at,
        items: (row.transaction_items || []).map((item: any) => ({
            id: item.id,
            type: item.type,
            name: item.name,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 0,
            referenceId: item.reference_id,
        })),
        totalAmount: Number(row.total_amount) || 0, // Supabase DECIMAL returns string
        paidAmount: Number(row.paid_amount) || 0,   // Supabase DECIMAL returns string
        changeAmount: Number(row.paid_amount) >= Number(row.total_amount)
            ? Number(row.paid_amount) - Number(row.total_amount)
            : 0,
        paymentMethod: row.payment_method as any,
        status: row.status,
        cashierName: 'Admin',
    }));
}

export async function getDailyReport(venueId: string, date?: string): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    cashAmount: number;
    transferAmount: number;
}> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('venue_id', venueId)
        .gte('created_at', `${targetDate}T00:00:00`)
        .lt('created_at', `${targetDate}T23:59:59`);

    if (error) throw error;

    const totalRevenue = (data || []).reduce((sum, t) => sum + Number(t.total_amount), 0);
    const cashAmount = (data || []).filter(t => t.payment_method === 'cash' || t.payment_method === 'CASH').reduce((sum, t) => sum + Number(t.paid_amount), 0);
    const transferAmount = (data || []).filter(t => t.payment_method === 'transfer' || t.payment_method === 'TRANSFER').reduce((sum, t) => sum + Number(t.paid_amount), 0);

    return {
        totalRevenue,
        totalTransactions: (data || []).length,
        cashAmount,
        transferAmount,
    };
}

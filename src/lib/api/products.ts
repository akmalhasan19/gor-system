import { supabase } from '../supabase';
import { Product } from '../constants';

const VENUE_ID = '00000000-0000-0000-0000-000000000001';

export async function getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('venue_id', VENUE_ID)
        .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        price: row.selling_price,
        stock: row.stock_quantity,
        category: row.type,
    }));
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const { data, error } = await supabase
        .from('products')
        .insert({
            venue_id: VENUE_ID,
            name: product.name,
            selling_price: product.price,
            stock_quantity: product.stock,
            type: product.category,
            cost_price: 0, // Can be added later
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        name: data.name,
        price: data.selling_price,
        stock: data.stock_quantity,
        category: data.type,
    };
}

export async function updateStock(id: string, newStock: number): Promise<void> {
    const { error } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', id);

    if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

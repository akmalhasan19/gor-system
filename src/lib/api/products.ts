import { supabase } from '../supabase';
import { Product } from '../constants';

export async function getProducts(venueId: string): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('venue_id', venueId)
        .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        price: Number(row.price),
        stock: Number(row.stock),
        category: row.category,
        image_url: row.image_url,
    }));
}

export async function createProduct(venueId: string, product: Omit<Product, 'id'>): Promise<Product> {
    // DEBUG: Log the price being sent
    console.log('Creating product with price:', product.price, 'Type:', typeof product.price);

    const insertData = {
        venue_id: venueId,
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category,
        image_url: product.image_url,
    };

    console.log('Insert data:', JSON.stringify(insertData, null, 2));

    const { data, error } = await supabase
        .from('products')
        .insert(insertData)
        .select()
        .single();

    if (error) throw error;

    console.log('Returned data from Supabase:', JSON.stringify(data, null, 2));

    return {
        id: data.id,
        name: data.name,
        price: Number(data.price),
        stock: Number(data.stock),
        category: data.category,
        image_url: data.image_url,
    };
}

export async function updateStock(id: string, newStock: number): Promise<void> {
    const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
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

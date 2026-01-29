import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

console.log('Supabase Client Init:', { supabaseUrl, hasKey: !!supabaseAnonKey });
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// For future use: Database types will be generated from Supabase
export type Database = {
    public: {
        Tables: {
            venues: any;
            courts: any;
            products: any;
            customers: any;
            bookings: any;
            transactions: any;
            transaction_items: any;
        };
    };
};

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a Supabase client with the service role key for admin access
// This bypasses RLS, which is efficient for public "Read Only" where we explicitly control the query
// OR we can use the anon key if we configured "Public" RLS policies.
// Implemented: "Public can view active courts" policy exists.
// So anon key is fine. But wait, env vars usually only expose anon key to client.
// Server-side we can use service role or anon. 
// Using anon key + RLS is safer. using service_role bypasses everything.
// Let's use standard client creation (anon) and rely on RLS "Public can view...".

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('courts')
            .select(`
                id,
                name,
                court_number,
                hourly_rate,
                is_active,
                notes,
                photo_url,
                venues (
                    id,
                    name,
                    address
                )
            `)
            .eq('is_active', true)
            .order('court_number', { ascending: true });

        if (error) {
            console.error('Error fetching courts:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

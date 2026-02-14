import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Next.js 15+ params are promises? Or standard dynamic routes. Usually { params } is synchronous in < 15, async in 15. The package.json says "next": "16.1.4". Params are async in Next 15+.
) {
    try {
        const { id } = await params;

        const { data, error } = await supabase
            .from('venues')
            .select('*, courts(*)')
            .eq('id', id)
            .eq('is_active', true)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
            }
            console.error('Error fetching venue:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error: unknown) {
        console.error('Internal Server Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

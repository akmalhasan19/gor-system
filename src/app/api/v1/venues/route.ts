import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase with Service Role Key to bypass RLS
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type VenueWithCourtsCount = {
    courts?: Array<{ count: number }>;
    [key: string]: unknown;
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const isActive = searchParams.get('is_active');
        const sort = searchParams.get('sort'); // e.g., 'created_at' or '-created_at'

        // Calculate pagination range
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('venues')
            .select('*, courts(count)', { count: 'exact' });

        // Filtering
        if (isActive !== null) {
            query = query.eq('is_active', isActive === 'true');
        } else {
            query = query.eq('is_active', true);
        }

        // Sorting
        if (sort) {
            const isDesc = sort.startsWith('-');
            const column = isDesc ? sort.substring(1) : sort;
            query = query.order(column, { ascending: !isDesc });
        } else {
            // Default sort
            query = query.order('name', { ascending: true });
        }

        // Pagination
        const { data, count, error } = await query.range(from, to);

        if (error) {
            console.error('Error fetching venues:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform data to flatten courts count
        const formattedData = data?.map((venue: VenueWithCourtsCount) => ({
            ...venue,
            courts_count: venue.courts?.[0]?.count || 0,
            courts: undefined // Remove the raw courts object
        }));

        return NextResponse.json({
            data: formattedData,
            meta: {
                total: count,
                page,
                limit,
                last_page: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error: unknown) {
        console.error('Internal Server Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

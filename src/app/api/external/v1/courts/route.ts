import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api-auth';

// Reuse the same logic as public, but protected by API Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    // 1. Verify API Key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
        return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 });
    }

    const isValid = await validateApiKey(apiKey);
    if (!isValid) {
        return NextResponse.json({ error: 'Invalid or inactive API Key' }, { status: 403 });
    }

    // 2. Fetch Data
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

        const validData = (data || []).map((court: any) => ({
            id: court.id,
            name: court.name,
            court_number: court.court_number,
            hourly_rate: court.hourly_rate,
            is_active: court.is_active,
            // Map notes to description, fallback to default
            description: court.notes || "Lantai Karpet Vinyl Standar Internasional, Pencahayaan LED 500 Lux, Atap Tinggi Sirkulasi Udara Baik.",
            // Add static/placeholder photo_url
            photo_url: [
                `https://placehold.co/600x400?text=${encodeURIComponent(court.name)}`
            ],
            venue: court.venues
        }));

        return NextResponse.json({
            data: validData,
            meta: {
                timestamp: new Date().toISOString(),
                source: 'Smash Partner External API'
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

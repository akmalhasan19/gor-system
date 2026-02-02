
import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api-auth';
import { getVenueById } from '@/lib/api/venues';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
        return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 });
    }

    const isValid = await validateApiKey(apiKey);
    if (!isValid) {
        return NextResponse.json({ error: 'Invalid or inactive API Key' }, { status: 403 });
    }

    try {
        const venue = await getVenueById(id);

        if (!venue) {
            return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
        }

        // Mocking/Adding missing fields based on requirements
        // "facilities": ["Toilet", "Musholla", "Parkir Luas", "Kantin"]
        // "photos": []

        // Try to fetch facilities if table exists, otherwise mock
        const facilities = ["Toilet", "Musholla", "Parkir Luas", "Kantin", "Wifi", "Locker"];
        const photos = [
            `https://placehold.co/600x400?text=${encodeURIComponent(venue.name + ' Main')}`,
            `https://placehold.co/600x400?text=${encodeURIComponent(venue.name + ' Lobby')}`
        ];

        // Construct response
        const responseData = {
            id: venue.id,
            name: venue.name,
            address: venue.address || "Alamat belum diatur",
            maps_url: `https://maps.google.com/?q=${encodeURIComponent(venue.name + " " + (venue.address || ""))}`, // Dynamic Google Maps Link
            description: "GOR Badminton standar internasional dengan lantai karpet dan pencahayaan standar BWF.", // Default Description
            start_hour: String(venue.operatingHoursStart).padStart(2, '0') + ":00",
            end_hour: String(venue.operatingHoursEnd).padStart(2, '0') + ":00",
            facilities: facilities,
            photos: photos
        };

        return NextResponse.json(responseData);

    } catch (err: any) {
        console.error('External Get Venue Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

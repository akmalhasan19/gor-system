import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value;
                    },
                    set() { },
                    remove() { },
                },
            }
        );

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { venueId } = body;

        if (!venueId) {
            return NextResponse.json({ success: false, error: 'Venue ID required' }, { status: 400 });
        }

        // Verify that the user actually belongs to this venue to prevent spoofing
        const { data: userVenue } = await supabase
            .from('user_venues')
            .select('role')
            .eq('user_id', user.id)
            .eq('venue_id', venueId)
            .single();

        if (!userVenue) {
            return NextResponse.json({ success: false, error: 'Invalid venue for user' }, { status: 403 });
        }

        // Update metadata
        const { error: updateError } = await supabase.auth.updateUser({
            data: { venue_id: venueId }
        });

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, message: 'Session synced' });
    } catch (error: any) {
        console.error('Session sync error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
    try {
        // Create Supabase client with cookies
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

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - User not authenticated' },
                { status: 401 }
            );
        }

        // Check if user has a venue association
        const { data: userVenue, error: venueError } = await supabase
            .from('user_venues')
            .select('venue_id')
            .eq('user_id', user.id)
            .limit(1)
            .single();

        if (venueError || !userVenue?.venue_id) {
            return NextResponse.json({
                success: true,
                hasCompletedOnboarding: false,
            });
        }

        return NextResponse.json({
            success: true,
            hasCompletedOnboarding: true,
            venueId: userVenue.venue_id,
        });

    } catch (error: any) {
        console.error('Onboarding status check error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to check onboarding status' },
            { status: 500 }
        );
    }
}

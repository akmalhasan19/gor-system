import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createMultipleCourts } from '@/lib/api/courts';
import { validateRequest, OnboardingSubmitSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
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

        // Check if user already has a venue (prevent duplicate onboarding)
        const { data: existingVenue } = await supabase
            .from('user_venues')
            .select('venue_id')
            .eq('user_id', user.id)
            .limit(1)
            .single();

        if (existingVenue?.venue_id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'User has already completed onboarding',
                    venueId: existingVenue.venue_id
                },
                { status: 400 }
            );
        }

        // Parse and validate request body with Zod
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid JSON in request body' },
                { status: 400 }
            );
        }

        const validation = validateRequest(OnboardingSubmitSchema, body);
        if (!validation.success) return validation.error;

        const {
            venueName,
            address,
            phone,
            courtsCount,
            operatingHoursStart,
            operatingHoursEnd,
            hourlyRatePerCourt,
        } = validation.data;


        // Create venue directly with authenticated client
        const { data: venueRow, error: venueError } = await supabase
            .from('venues')
            .insert({
                name: venueName,
                address: address || null,
                phone: phone || null,
                operating_hours_start: operatingHoursStart || 8,
                operating_hours_end: operatingHoursEnd || 23,
                is_active: true,
            })
            .select()
            .single();

        if (venueError) {
            console.error('Venue creation error:', venueError);
            throw new Error('Failed to create venue: ' + venueError.message);
        }

        // Create the user-venue association with authenticated client
        // This will use auth.uid() from the current session
        const { error: associationError } = await supabase
            .from('user_venues')
            .insert({
                user_id: user.id,
                venue_id: venueRow.id,
                role: 'owner',
            });

        if (associationError) {
            console.error('User-venue association error:', associationError);
            // Rollback: delete the venue if association fails
            await supabase.from('venues').delete().eq('id', venueRow.id);
            throw new Error('Failed to create user-venue association: ' + associationError.message);
        }

        // Create courts for the venue using the API function with authenticated client
        // We need to pass the supabase client to avoid RLS issues
        const courtsToCreate = [];
        for (let i = 1; i <= courtsCount; i++) {
            courtsToCreate.push({
                venue_id: venueRow.id,
                name: `Lapangan ${i}`,
                court_number: i,
                is_active: true,
                hourly_rate: hourlyRatePerCourt,
            });
        }

        const { error: courtsError } = await supabase
            .from('courts')
            .insert(courtsToCreate);

        if (courtsError) {
            console.error('Courts creation error:', courtsError);
            // Continue anyway - courts can be added later
        }

        // Update user metadata with venue_id for middleware optimization
        const { error: metadataError } = await supabase.auth.updateUser({
            data: {
                venue_id: venueRow.id
            }
        });

        if (metadataError) {
            console.warn('Failed to update user metadata with venue_id:', metadataError);
        }

        return NextResponse.json({
            success: true,
            venueId: venueRow.id,
            message: 'Venue created successfully',
        });

    } catch (error: any) {
        console.error('Onboarding submission error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create venue' },
            { status: 500 }
        );
    }
}

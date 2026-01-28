import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API endpoint for recording QR check-in events
 * Called by the public /verify page when a member scans their QR
 * This is a PUBLIC endpoint (no auth required)
 */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { memberId, memberName, date, venueId } = body;

        if (!memberId || !date) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Use upsert to avoid duplicates for the same member on the same date
        const { data, error } = await supabase
            .from('qr_checkins')
            .upsert({
                member_id: memberId,
                member_name: memberName || 'Unknown',
                check_in_date: date,
                venue_id: venueId || null,
                scanned_at: new Date().toISOString()
            }, {
                onConflict: 'member_id,check_in_date'
            })
            .select()
            .single();

        if (error) {
            console.error('Error recording check-in:', error);
            // If table doesn't exist, still return success for graceful degradation
            if (error.code === '42P01') { // PGSQL table not found
                return NextResponse.json({
                    success: true,
                    message: 'Check-in recorded (no persistence)',
                    fallback: true
                });
            }
            return NextResponse.json(
                { error: 'Failed to record check-in' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            checkIn: data
        });

    } catch (error) {
        console.error('Check-in API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const date = searchParams.get('date');

    if (!memberId || !date) {
        return NextResponse.json(
            { error: 'Missing memberId or date' },
            { status: 400 }
        );
    }

    try {
        const { data, error } = await supabase
            .from('qr_checkins')
            .select('*')
            .eq('member_id', memberId)
            .eq('check_in_date', date)
            .single();

        if (error && error.code !== 'PGRST116') { // Not found is OK
            // If table doesn't exist, return not found gracefully
            if (error.code === '42P01') {
                return NextResponse.json({ found: false, tableNotExist: true });
            }
            throw error;
        }

        return NextResponse.json({
            found: !!data,
            checkIn: data
        });
    } catch (error) {
        console.error('Check-in lookup error:', error);
        return NextResponse.json(
            { error: 'Failed to lookup check-in' },
            { status: 500 }
        );
    }
}

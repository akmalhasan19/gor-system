import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase with Service Role Key to bypass RLS
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/partner-invites/mark-used
 * Mark an invite token as used after successful registration.
 * Called internally after user completes registration.
 * 
 * Request body: { token: string }
 * Response: { success: true }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({
                success: false,
                error: 'Token is required'
            }, { status: 400 });
        }

        // Update the invite status to used
        const { error } = await supabase
            .from('partner_invites')
            .update({
                status: 'used',
                used_at: new Date().toISOString()
            })
            .eq('token', token)
            .eq('status', 'pending');

        if (error) {
            console.error('Error marking invite as used:', error);
            return NextResponse.json({
                success: false,
                error: 'Failed to update invite status'
            }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Mark invite used error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

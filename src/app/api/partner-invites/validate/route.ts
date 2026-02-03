import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase with Service Role Key to bypass RLS
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/partner-invites/validate?token=xxx
 * Validate an invite token before showing registration form.
 * This is an internal API (not v1) for the registration page.
 * 
 * Response: 
 *   Valid: { valid: true, email: string, partner_name: string }
 *   Invalid: { valid: false, error: string }
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({
                valid: false,
                error: 'Token is required'
            }, { status: 400 });
        }

        // Find the invite by token
        const { data: invite, error } = await supabase
            .from('partner_invites')
            .select('id, email, partner_name, status, expires_at')
            .eq('token', token)
            .single();

        if (error || !invite) {
            return NextResponse.json({
                valid: false,
                error: 'Link undangan tidak ditemukan'
            });
        }

        // Check if already used
        if (invite.status === 'used') {
            return NextResponse.json({
                valid: false,
                error: 'Link undangan sudah pernah digunakan'
            });
        }

        // Check if expired
        const isExpired = new Date(invite.expires_at) < new Date();
        if (isExpired || invite.status === 'expired') {
            // Update status to expired if not already
            if (invite.status !== 'expired') {
                await supabase
                    .from('partner_invites')
                    .update({ status: 'expired' })
                    .eq('id', invite.id);
            }

            return NextResponse.json({
                valid: false,
                error: 'Link undangan sudah kadaluarsa'
            });
        }

        // Token is valid
        return NextResponse.json({
            valid: true,
            email: invite.email,
            partner_name: invite.partner_name,
            expires_at: invite.expires_at
        });

    } catch (error: any) {
        console.error('Invite validation error:', error);
        return NextResponse.json({
            valid: false,
            error: 'Terjadi kesalahan saat validasi'
        }, { status: 500 });
    }
}

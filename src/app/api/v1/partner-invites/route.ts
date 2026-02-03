import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Initialize Supabase with Service Role Key to bypass RLS
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Token expiration: 7 days
const TOKEN_EXPIRY_DAYS = 7;

/**
 * POST /api/v1/partner-invites
 * Generate an invite token for a partner registration.
 * Called by Website Booking when admin approves a partner application.
 * 
 * Request body: { email: string, partner_name?: string }
 * Response: { success: true, invite_url: string, token: string, expires_at: string }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, partner_name } = body;

        // Validate required fields
        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email is required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Check if there's already a pending invite for this email
        const { data: existingInvite } = await supabase
            .from('partner_invites')
            .select('id, token, expires_at')
            .eq('email', email.toLowerCase())
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString())
            .single();

        if (existingInvite) {
            // Return existing valid invite
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
            const inviteUrl = `${baseUrl}/register?token=${existingInvite.token}`;

            return NextResponse.json({
                success: true,
                invite_url: inviteUrl,
                token: existingInvite.token,
                expires_at: existingInvite.expires_at,
                message: 'Existing invite token returned (still valid)'
            });
        }

        // Generate a secure random token
        const token = randomBytes(32).toString('hex');

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

        // Insert invite record
        const { data: invite, error } = await supabase
            .from('partner_invites')
            .insert({
                token,
                email: email.toLowerCase(),
                partner_name: partner_name || null,
                status: 'pending',
                expires_at: expiresAt.toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating invite:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to create invite' },
                { status: 500 }
            );
        }

        // Generate the invite URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const inviteUrl = `${baseUrl}/register?token=${token}`;

        return NextResponse.json({
            success: true,
            invite_url: inviteUrl,
            token: token,
            expires_at: invite.expires_at
        }, { status: 201 });

    } catch (error: any) {
        console.error('Partner invite creation error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/v1/partner-invites?email=xxx
 * Check invite status for an email (optional utility endpoint)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email query parameter is required' },
                { status: 400 }
            );
        }

        const { data: invite, error } = await supabase
            .from('partner_invites')
            .select('id, email, partner_name, status, expires_at, created_at, used_at')
            .eq('email', email.toLowerCase())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !invite) {
            return NextResponse.json({
                success: true,
                has_invite: false,
                message: 'No invite found for this email'
            });
        }

        const isExpired = new Date(invite.expires_at) < new Date();
        const isValid = invite.status === 'pending' && !isExpired;

        return NextResponse.json({
            success: true,
            has_invite: true,
            invite: {
                ...invite,
                is_valid: isValid,
                is_expired: isExpired
            }
        });

    } catch (error: any) {
        console.error('Partner invite check error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

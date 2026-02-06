import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateRequest, AdminSignupSchema } from '@/lib/validation';

// This route uses the service role key to bypass email confirmation
// Only for admin registration during development
export async function POST(request: NextRequest) {
    // ----------------------------------------------------------------------
    // 🚨 SECURITY: Admin Signup via Invite Token
    // This route uses invite token validation instead of exposed headers
    // Disabled by default in production unless explicitly enabled
    // ----------------------------------------------------------------------

    const IS_DEV = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

    // Rule 1: Check if admin signup is enabled in production
    if (!IS_DEV && process.env.ADMIN_SIGNUP_ENABLED !== 'true') {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    try {
        // Parse and validate request body
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid JSON in request body' },
                { status: 400 }
            );
        }

        const validation = validateRequest(AdminSignupSchema, body);
        if (!validation.success) return validation.error;

        const { email, password, inviteToken } = validation.data;

        // Rule 2: Validate invite token (replaces header secret check)
        if (!inviteToken) {
            return NextResponse.json(
                { success: false, error: 'Invite token is required' },
                { status: 400 }
            );
        }

        // Create Supabase Admin client for invite validation
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            return NextResponse.json(
                { success: false, error: 'Server configuration error: Missing service role key' },
                { status: 500 }
            );
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Validate invite token and check it matches the email
        const { data: invite, error: inviteError } = await supabaseAdmin
            .from('partner_invites')
            .select('*')
            .eq('token', inviteToken)
            .eq('email', email)
            .single();

        if (inviteError || !invite) {
            console.error('Invalid invite token:', inviteError);
            return NextResponse.json(
                { success: false, error: 'Invalid or expired invite token' },
                { status: 401 }
            );
        }

        // Check if invite has already been used
        if (invite.used_at) {
            return NextResponse.json(
                { success: false, error: 'Invite token has already been used' },
                { status: 401 }
            );
        }

        // Check if invite has expired
        const expiresAt = new Date(invite.expires_at);
        if (expiresAt < new Date()) {
            return NextResponse.json(
                { success: false, error: 'Invite token has expired' },
                { status: 401 }
            );
        }

        // Rule 3: Production requires stronger passwords
        if (!IS_DEV && password.length < 12) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 12 characters in production' },
                { status: 400 }
            );
        }

        // Create user with admin privileges (bypasses email confirmation)
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                phone_verified: false,
                created_via_admin_route: true
            }
        });

        if (createError) {
            console.error('Error creating user - Full error:', JSON.stringify(createError, null, 2));
            console.error('Error creating user - Message:', createError.message);
            console.error('Error creating user - Code:', (createError as any).code);
            console.error('Error creating user - Status:', (createError as any).status);
            return NextResponse.json(
                { success: false, error: createError.message },
                { status: 400 }
            );
        }

        // Return success with user data
        return NextResponse.json({
            success: true,
            user: {
                id: createData.user.id,
                email: createData.user.email,
            },
            message: 'User created successfully with confirmed email'
        });

    } catch (error: any) {
        console.error('Error in admin signup:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

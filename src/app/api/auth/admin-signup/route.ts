import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This route uses the service role key to bypass email confirmation
// Only for admin registration during development
export async function POST(request: NextRequest) {
    // ----------------------------------------------------------------------
    // 🚨 SECURITY LOCKDOWN
    // This route is a potential backdoor. We strictly limit its availability.
    // 1. CRITICAL: Strictly disable in Production unless a specific override secret is present.
    // 2. AUTH: Require a specific header key even in Development/Override mode.
    // ----------------------------------------------------------------------

    const IS_DEV = process.env.NODE_ENV === 'development';
    const MASTER_SECRET = process.env.ADMIN_SIGNUP_SECRET; // Must be set in .env to use in Prod

    // Check Header
    const requestSecret = request.headers.get('x-admin-secret-key');

    // Rule 1: If in Production AND no Master Secret is set in Env, completely disable (404).
    if (!IS_DEV && !MASTER_SECRET) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    // Rule 2: If we are here, we are either in Dev or have a Master Secret configured.
    // Now verify the request provided the correct secret.
    // In Dev, we can fallback to a default if no env is set, for developer convenience (BUT verify header exists).

    const requiredKey = MASTER_SECRET || 'smash-dev-admin-2026';

    if (requestSecret !== requiredKey) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized: Invalid Admin Secret Key' },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Validate password strength
        if (password.length < 8) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // Create Supabase Admin client with service role
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

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
            console.error('Error creating user:', createError);
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

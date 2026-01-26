import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validateTOTPToken } from '@/lib/totp-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code, accountName } = body;

        if (!code || !accountName) {
            return NextResponse.json(
                { success: false, error: 'Code and account name are required' },
                { status: 400 }
            );
        }

        // Validate code format (6 digits)
        if (!/^\d{6}$/.test(code)) {
            return NextResponse.json(
                { success: false, error: 'Invalid code format. Must be 6 digits.' },
                { status: 400 }
            );
        }

        // Create Supabase client
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options });
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: '', ...options });
                    },
                },
            }
        );

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Get pending verification for user
        const { data: verification, error: fetchError } = await supabase
            .from('phone_verifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_verified', false)
            .single();

        if (fetchError || !verification) {
            return NextResponse.json(
                { success: false, error: 'No pending verification found. Please start again.' },
                { status: 404 }
            );
        }

        // Check if expired
        if (new Date(verification.expires_at) < new Date()) {
            return NextResponse.json(
                { success: false, error: 'Verification has expired. Please start again.' },
                { status: 400 }
            );
        }

        // Check attempts
        if (verification.attempts >= verification.max_attempts) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Too many failed attempts. Please start again.',
                    attemptsRemaining: 0
                },
                { status: 400 }
            );
        }

        // Validate TOTP code
        const { valid } = validateTOTPToken(verification.totp_secret, code, accountName);

        if (!valid) {
            // Increment attempts
            const newAttempts = verification.attempts + 1;
            await supabase
                .from('phone_verifications')
                .update({
                    attempts: newAttempts,
                    updated_at: new Date().toISOString()
                })
                .eq('id', verification.id);

            const attemptsRemaining = verification.max_attempts - newAttempts;
            return NextResponse.json(
                {
                    success: false,
                    error: `Invalid code. ${attemptsRemaining} attempts remaining.`,
                    attemptsRemaining
                },
                { status: 400 }
            );
        }

        // Mark as verified
        const { error: updateError } = await supabase
            .from('phone_verifications')
            .update({
                is_verified: true,
                verified_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', verification.id);

        if (updateError) {
            console.error('Failed to update verification:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to complete verification' },
                { status: 500 }
            );
        }

        // Update user metadata with verified phone
        const { error: metadataError } = await supabase.auth.updateUser({
            data: {
                phone: verification.phone_number,
                phone_verified: true,
                phone_verified_at: new Date().toISOString()
            }
        });

        if (metadataError) {
            console.warn('Failed to update user metadata:', metadataError);
            // Don't fail the verification, the phone is verified in our table
        }

        return NextResponse.json({
            success: true,
            verified: true,
            message: 'Phone number verified successfully'
        });
    } catch (error) {
        console.error('Error in phone verification verify:', error);
        return NextResponse.json(
            { success: false, error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

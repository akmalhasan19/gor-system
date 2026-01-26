import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    try {
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

        // Check user metadata first (fastest)
        if (user.user_metadata?.phone_verified === true) {
            return NextResponse.json({
                success: true,
                isVerified: true,
                phoneNumber: user.user_metadata.phone,
                verifiedAt: user.user_metadata.phone_verified_at
            });
        }

        // Check database for verification record
        const { data: verification, error: fetchError } = await supabase
            .from('phone_verifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_verified', true)
            .order('verified_at', { ascending: false })
            .limit(1)
            .single();

        if (fetchError || !verification) {
            return NextResponse.json({
                success: true,
                isVerified: false,
                hasPendingVerification: false
            });
        }

        return NextResponse.json({
            success: true,
            isVerified: true,
            phoneNumber: verification.phone_number,
            verifiedAt: verification.verified_at
        });
    } catch (error) {
        console.error('Error checking verification status:', error);
        return NextResponse.json(
            { success: false, error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

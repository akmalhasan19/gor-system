import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
    generateTOTPSecret,
    generateTOTPQRCode,
    formatPhoneNumber,
    isValidPhoneNumber,
    getTOTPUri
} from '@/lib/totp-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phoneNumber, accountName, countryCode = '+62' } = body;

        if (!phoneNumber || !accountName) {
            return NextResponse.json(
                { success: false, error: 'Phone number and account name are required' },
                { status: 400 }
            );
        }

        // Format and validate phone number
        const formattedPhone = formatPhoneNumber(phoneNumber, countryCode);
        if (!isValidPhoneNumber(formattedPhone)) {
            return NextResponse.json(
                { success: false, error: 'Invalid phone number format' },
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

        // Check rate limiting
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        const { data: rateLimitData } = await supabase
            .from('phone_verification_rate_limits')
            .select('request_count')
            .eq('phone_number', formattedPhone)
            .gte('window_start', oneHourAgo.toISOString())
            .single();

        if (rateLimitData && rateLimitData.request_count >= 3) {
            return NextResponse.json(
                { success: false, error: 'Too many verification attempts. Please try again later.' },
                { status: 429 }
            );
        }

        // Delete any existing pending verification for this user
        await supabase
            .from('phone_verifications')
            .delete()
            .eq('user_id', user.id)
            .eq('is_verified', false);

        // Generate new TOTP secret
        const totpSecret = generateTOTPSecret();

        // Calculate expiry (24 hours for initial setup)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Create verification record
        const { data: verificationData, error: insertError } = await supabase
            .from('phone_verifications')
            .insert({
                user_id: user.id,
                phone_number: formattedPhone,
                country_code: countryCode,
                totp_secret: totpSecret,
                verification_type: 'totp',
                expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

        if (insertError) {
            console.error('Failed to create verification record:', insertError);
            return NextResponse.json(
                { success: false, error: 'Failed to initiate verification' },
                { status: 500 }
            );
        }

        // Generate QR code for authenticator app
        const qrCode = await generateTOTPQRCode(totpSecret, accountName);
        const totpUri = getTOTPUri(totpSecret, accountName);

        // Record rate limit attempt
        if (rateLimitData) {
            await supabase
                .from('phone_verification_rate_limits')
                .update({ request_count: rateLimitData.request_count + 1 })
                .eq('phone_number', formattedPhone)
                .gte('window_start', oneHourAgo.toISOString());
        } else {
            await supabase
                .from('phone_verification_rate_limits')
                .insert({
                    phone_number: formattedPhone,
                    request_count: 1,
                    window_start: new Date().toISOString()
                });
        }

        return NextResponse.json({
            success: true,
            verificationId: verificationData.id,
            qrCode,
            totpUri,
            secret: totpSecret, // For manual entry
        });
    } catch (error) {
        console.error('Error in phone verification initiate:', error);
        return NextResponse.json(
            { success: false, error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

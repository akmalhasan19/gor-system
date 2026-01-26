import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Protect admin routes
    // Allow /login, /public, /_next, /favicon.ico, /api/public, /api/phone-verification, /api/auth
    const isPublicRoute =
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/onboarding') ||
        request.nextUrl.pathname.startsWith('/public') ||
        request.nextUrl.pathname.startsWith('/api/public') ||
        request.nextUrl.pathname.startsWith('/api/phone-verification') ||
        request.nextUrl.pathname.startsWith('/api/onboarding') ||
        request.nextUrl.pathname.startsWith('/api/auth');

    const isSystemRoute =
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/static') ||
        request.nextUrl.pathname.includes('.'); // files like favicon.ico, images

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Redirect unauthenticated users to login (except for public/system routes)
    if (!isPublicRoute && !isSystemRoute) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Check phone verification status for authenticated users
        // Skip this check for API routes to avoid infinite loops
        if (!request.nextUrl.pathname.startsWith('/api')) {
            const isPhoneVerified = user.user_metadata?.phone_verified === true;

            if (!isPhoneVerified) {
                // Check database for verification (user_metadata might not be synced yet)
                const { data: verification } = await supabase
                    .from('phone_verifications')
                    .select('is_verified')
                    .eq('user_id', user.id)
                    .eq('is_verified', true)
                    .limit(1)
                    .single();

                if (!verification?.is_verified) {
                    // Redirect to login page for phone verification
                    // Add query param to indicate verification is needed
                    const loginUrl = new URL('/login', request.url);
                    loginUrl.searchParams.set('verify_phone', 'true');
                    return NextResponse.redirect(loginUrl);
                }
            }

            // Check if user has completed onboarding
            // Skip for /onboarding route itself and API routes
            if (!request.nextUrl.pathname.startsWith('/onboarding')) {
                const { data: userVenue } = await supabase
                    .from('user_venues')
                    .select('venue_id')
                    .eq('user_id', user.id)
                    .limit(1)
                    .single();

                if (!userVenue?.venue_id) {
                    // User has no venue, redirect to onboarding
                    return NextResponse.redirect(new URL('/onboarding', request.url));
                }
            }
        }
    }

    // If user is logged in and tries to access /onboarding but already completed it, redirect to dashboard
    if (user && request.nextUrl.pathname.startsWith('/onboarding') && !request.nextUrl.pathname.startsWith('/api')) {
        const { data: userVenue } = await supabase
            .from('user_venues')
            .select('venue_id')
            .eq('user_id', user.id)
            .limit(1)
            .single();

        if (userVenue?.venue_id) {
            // User already has a venue, redirect to dashboard
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // If user is logged in with verified phone and tries to access login, redirect to dashboard
    if (user && request.nextUrl.pathname.startsWith('/login')) {
        const isPhoneVerified = user.user_metadata?.phone_verified === true;

        // Only redirect if phone is verified, otherwise they need to complete verification
        if (isPhoneVerified) {
            // Double-check with database
            const { data: verification } = await supabase
                .from('phone_verifications')
                .select('is_verified')
                .eq('user_id', user.id)
                .eq('is_verified', true)
                .limit(1)
                .single();

            if (verification?.is_verified) {
                return NextResponse.redirect(new URL('/', request.url));
            }
        }

        // Check if verification is pending and bypass login redirect
        const verifyPhone = request.nextUrl.searchParams.get('verify_phone');
        if (!verifyPhone) {
            // Check if user needs verification
            const { data: pendingVerification } = await supabase
                .from('phone_verifications')
                .select('is_verified')
                .eq('user_id', user.id)
                .eq('is_verified', true)
                .limit(1)
                .single();

            if (pendingVerification?.is_verified) {
                return NextResponse.redirect(new URL('/', request.url));
            }
        }
    }

    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

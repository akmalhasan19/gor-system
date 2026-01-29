import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { RateLimiter } from '@/lib/rate-limit';

// Global Re-usable Rate Limiter (In-Memory)
// Note: In serverless, this Map is reset on cold start, but effective for high-traffic spikes on warm instances.
const limiter = new RateLimiter({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500, // Max 500 unique IPs per minute
});

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Protect admin routes
    // Allow /login, /public, /verify, /_next, /favicon.ico, /api/public, /api/phone-verification, /api/auth
    const isPublicRoute =
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/onboarding') ||
        request.nextUrl.pathname.startsWith('/public') ||
        request.nextUrl.pathname.startsWith('/verify') ||
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
                // Optimization: Skip DB check in middleware to reduce latency.
                // We rely on AuthGuard (client-side) to check DB if metadata is missing.
                // Or if we really want to enforce it for legacy users without blocking middleware,
                // we assume "not verified" only if we are STRICT, but here we perform optimistic allow 
                // and let the Client Guard catch it.

                // However, for strict security, if metadata SAYS false (explicitly), we might redirect.
                // But undefined means "maybe legacy".
                if (user.user_metadata?.phone_verified === false) {
                    const loginUrl = new URL('/login', request.url);
                    loginUrl.searchParams.set('verify_phone', 'true');
                    return NextResponse.redirect(loginUrl);
                }

                // If undefined, pass through to AuthGuard
            }

            // Check if user has completed onboarding
            // Skip for /onboarding route itself and API routes
            if (!request.nextUrl.pathname.startsWith('/onboarding')) {
                const venueId = user.user_metadata?.venue_id;

                if (!venueId) {
                    // No database query here.
                    // We trust SessionSyncer/AuthGuard on client to handle this edge case (legacy users).
                    // This allows 0ms IO latency in middleware for 99% of requests.
                    // If we really want to be strict, we could redirect to a /sync-session page, 
                    // but falling through to the app (which will redirect to onboarding/login) is cleaner.

                    // Actually, if we don't have venueId in metadata, we should likely let them pass 
                    // and let AuthGuard catch it, OR redirect to onboarding if we want to be strict.
                    // But without DB check, we can't be sure if they REALLY need onboarding or just need a sync.
                    // So we pass them through.
                }
            }
        }
    }

    // If user is logged in and tries to access /onboarding but already completed it
    if (user && request.nextUrl.pathname.startsWith('/onboarding') && !request.nextUrl.pathname.startsWith('/api')) {
        const venueId = user.user_metadata?.venue_id;
        if (venueId) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        // If no venueId in metadata, we let them view onboarding. 
        // If they actually HAVE a venue but just no metadata, the onboarding form will detect "User already has venue"
        // or our SessionSyncer will fix it eventually.
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

    // --- RATE LIMITING (API Routes Only) ---
    if (request.nextUrl.pathname.startsWith('/api')) {
        const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
        try {
            const { success, limit, remaining, reset } = await limiter.check(20, ip); // 20 requests per minute
            response.headers.set('X-RateLimit-Limit', limit.toString());
            response.headers.set('X-RateLimit-Remaining', remaining.toString());
            response.headers.set('X-RateLimit-Reset', reset.toString());

            if (!success) {
                return new NextResponse('Too Many Requests', {
                    status: 429,
                    headers: response.headers
                });
            }
        } catch (error) {
            console.error('Rate limit error:', error);
            // Fail open if rate limiter fails
        }
    }

    return response
}


export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

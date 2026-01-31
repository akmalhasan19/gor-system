import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { RateLimiter } from '@/lib/rate-limit';
import { generateCsrfToken, verifyCsrfToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/csrf';

// Routes that should be excluded from CSRF protection
const CSRF_EXEMPT_ROUTES = [
    '/api/webhooks/', // Webhooks have their own authentication
    '/api/public/',   // Public endpoints (read-only)
    '/api/cron/',     // Cron jobs (often internal or simple key auth)
];

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
        request.nextUrl.pathname.startsWith('/forgot-password') ||
        request.nextUrl.pathname.startsWith('/reset-password') ||
        request.nextUrl.pathname.startsWith('/onboarding') ||
        request.nextUrl.pathname.startsWith('/public') ||
        request.nextUrl.pathname.startsWith('/verify') ||
        request.nextUrl.pathname.startsWith('/api/public') ||
        request.nextUrl.pathname.startsWith('/api/phone-verification') ||
        request.nextUrl.pathname.startsWith('/api/onboarding') ||
        request.nextUrl.pathname.startsWith('/api/webhooks') ||
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

        if (isPhoneVerified) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Optimization: We no longer do a blocking DB check here for "pending" verification.
        // We rely on the client-side AuthGuard to catch edge cases where metadata is stale.
        // If a user is truly verified but metadata says false, they might see the login page for a moment
        // before AuthGuard redirects them, OR they can just log in again and we update metadata.
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

        // --- CSRF PROTECTION (State-changing API requests) ---
        const isStateChangingMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
        const isExemptRoute = CSRF_EXEMPT_ROUTES.some(route =>
            request.nextUrl.pathname.startsWith(route)
        );

        if (isStateChangingMethod && !isExemptRoute) {
            const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
            const headerToken = request.headers.get(CSRF_HEADER_NAME);

            // Validate both tokens exist and match
            if (!cookieToken || !headerToken) {
                console.warn('CSRF token missing', {
                    path: request.nextUrl.pathname,
                    hasCookie: !!cookieToken,
                    hasHeader: !!headerToken
                });
                return new NextResponse(
                    JSON.stringify({ error: 'CSRF token missing' }),
                    {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            if (cookieToken !== headerToken || !verifyCsrfToken(cookieToken)) {
                console.warn('CSRF token validation failed', {
                    path: request.nextUrl.pathname
                });
                return new NextResponse(
                    JSON.stringify({ error: 'CSRF token invalid' }),
                    {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }
        }
    }

    // --- CSRF TOKEN GENERATION (For authenticated page requests) ---
    // Generate new CSRF token on page loads (not API, not static files)
    if (!request.nextUrl.pathname.startsWith('/api') && !isSystemRoute && user) {
        const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

        // Only generate if no valid token exists
        if (!existingToken || !verifyCsrfToken(existingToken)) {
            const csrfToken = generateCsrfToken();
            response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
                httpOnly: false, // Must be readable by JavaScript
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 60 * 60 * 24, // 24 hours
            });
        }
    }

    return response
}


export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

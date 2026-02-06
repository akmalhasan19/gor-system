import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { apiRateLimiter, externalApiRateLimiter, isUpstashConfigured, fallbackLimiter } from '@/lib/rate-limit';
import { generateCsrfToken, verifyCsrfToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/csrf';
import { jwtVerify } from 'jose';

// Routes that should be excluded from CSRF protection
const CSRF_EXEMPT_ROUTES = [
    '/api/webhooks/', // Webhooks have their own authentication
    '/api/public/',   // Public endpoints (read-only)
    '/api/cron/',     // Cron jobs (often internal or simple key auth)
    '/api/auth/admin-signup', // Header-based authentication
    '/api/v1/',       // External API (JWT authenticated)
];

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // --- 1. EXTERNAL API v1 PROTECTION (JWT + CORS) ---
    if (request.nextUrl.pathname.startsWith('/api/v1')) {
        // A. CORS Check
        const origin = request.headers.get('origin');
        const allowedOrigin = process.env.WEBSITE_SMASH_URL;

        // Handle Preflight locally effectively or just let browser handle failure if headers missing
        // For simplicity in middleware, we usually handle actual logic. 
        // We will set CORS headers on the response.
        if (origin && allowedOrigin && origin !== allowedOrigin) {
            return new NextResponse(JSON.stringify({ error: 'CORS policy violation' }), { status: 403 });
        }

        // B. JWT Authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new NextResponse(JSON.stringify({ error: 'Missing or invalid Authorization header' }), { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const secret = new TextEncoder().encode(process.env.API_JWT_SECRET);

        try {
            await jwtVerify(token, secret);
            // Token is valid, proceed.
        } catch (err) {
            console.error('JWT Verification failed:', err);
            return new NextResponse(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401 });
        }

        // C. Rate Limiting for API v1 (Distributed via Upstash Redis)
        const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
        try {
            if (isUpstashConfigured()) {
                const { success, limit, remaining, reset } = await externalApiRateLimiter.limit(ip);
                if (!success) {
                    return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), { status: 429 });
                }
            } else {
                // Fallback for dev environments without Redis
                const { success } = await fallbackLimiter.check(60, ip);
                if (!success) {
                    return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), { status: 429 });
                }
            }
        } catch (error) {
            console.error('Rate limit error:', error);
            // Fail open - allow request if rate limiting fails
        }

        // Add CORS headers to success response (needed for browser fetch)
        if (allowedOrigin) {
            response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }

        return response;
    }

    // Protect admin routes
    // Allow /login, /public, /verify, /_next, /favicon.ico, /api/public, /api/phone-verification, /api/auth
    const isPublicRoute =
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/forgot-password') ||
        request.nextUrl.pathname.startsWith('/reset-password') ||
        request.nextUrl.pathname.startsWith('/register') ||
        request.nextUrl.pathname.startsWith('/onboarding') ||
        request.nextUrl.pathname.startsWith('/public') ||
        request.nextUrl.pathname.startsWith('/verify') ||
        request.nextUrl.pathname.startsWith('/api/public') ||
        request.nextUrl.pathname.startsWith('/api/phone-verification') ||
        request.nextUrl.pathname.startsWith('/api/onboarding') ||
        request.nextUrl.pathname.startsWith('/api/partner-invites') ||
        request.nextUrl.pathname.startsWith('/api/webhooks') ||
        request.nextUrl.pathname.startsWith('/api/cron') ||  // Allow cron jobs
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
                if (user.user_metadata?.phone_verified === false) {
                    const loginUrl = new URL('/login', request.url);
                    loginUrl.searchParams.set('verify_phone', 'true');
                    return NextResponse.redirect(loginUrl);
                }
            }

            // Check if user has completed onboarding
            // Skip for /onboarding route itself and API routes
            if (!request.nextUrl.pathname.startsWith('/onboarding')) {
                const venueId = user.user_metadata?.venue_id;

                if (!venueId) {
                    // Pass through
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
    }

    // If user is logged in with verified phone and tries to access login, redirect to dashboard
    if (user && request.nextUrl.pathname.startsWith('/login')) {
        const isPhoneVerified = user.user_metadata?.phone_verified === true;

        if (isPhoneVerified) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // --- RATE LIMITING (Other API Routes via Distributed Redis) ---
    if (request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.startsWith('/api/v1')) {
        const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
        try {
            if (isUpstashConfigured()) {
                const { success, limit, remaining, reset } = await apiRateLimiter.limit(ip);
                response.headers.set('X-RateLimit-Limit', limit.toString());
                response.headers.set('X-RateLimit-Remaining', remaining.toString());
                response.headers.set('X-RateLimit-Reset', reset.toString());

                if (!success) {
                    return new NextResponse('Too Many Requests', {
                        status: 429,
                        headers: response.headers
                    });
                }
            } else {
                // Fallback for dev environments without Redis
                const { success, limit, remaining, reset } = await fallbackLimiter.check(20, ip);
                response.headers.set('X-RateLimit-Limit', limit.toString());
                response.headers.set('X-RateLimit-Remaining', remaining.toString());
                response.headers.set('X-RateLimit-Reset', reset.toString());

                if (!success) {
                    return new NextResponse('Too Many Requests', {
                        status: 429,
                        headers: response.headers
                    });
                }
            }
        } catch (error) {
            console.error('Rate limit error:', error);
            // Fail open - allow request if rate limiting fails
        }

        // --- CSRF PROTECTION (State-changing API requests) ---
        const isStateChangingMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
        const isExemptRoute = CSRF_EXEMPT_ROUTES.some(route =>
            request.nextUrl.pathname.startsWith(route)
        );

        if (isStateChangingMethod && !isExemptRoute) {
            const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
            const headerToken = request.headers.get(CSRF_HEADER_NAME);

            if (!cookieToken || !headerToken) {
                return new NextResponse(
                    JSON.stringify({ error: 'CSRF token missing' }),
                    {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            if (cookieToken !== headerToken || !verifyCsrfToken(cookieToken)) {
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

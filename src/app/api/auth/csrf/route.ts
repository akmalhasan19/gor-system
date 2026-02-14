import { NextResponse } from 'next/server';
import { CSRF_COOKIE_NAME, generateCsrfToken } from '@/lib/csrf';

export async function GET() {
    const token = generateCsrfToken();

    const response = NextResponse.json({
        success: true,
        token,
    });

    response.cookies.set(CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24,
    });

    return response;
}

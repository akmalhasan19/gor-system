'use client';

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/csrf';

/**
 * Get CSRF token from cookies
 * @returns CSRF token string or empty string if not found
 */
export function getCsrfToken(): string {
    if (typeof document === 'undefined') return '';

    const cookies = document.cookie.split('; ');
    const csrfCookie = cookies.find(row => row.startsWith(`${CSRF_COOKIE_NAME}=`));
    return csrfCookie?.split('=')[1] || '';
}

/**
 * Get headers object with CSRF token included
 * @param additionalHeaders - Additional headers to merge
 * @returns Headers object with CSRF token
 */
export function getCsrfHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    return {
        ...additionalHeaders,
        [CSRF_HEADER_NAME]: getCsrfToken(),
    };
}

/**
 * Fetch wrapper that automatically includes CSRF token
 * @param url - URL to fetch
 * @param options - Fetch options
 * @returns Fetch response
 */
export async function fetchWithCsrf(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const headers = new Headers(options.headers);
    headers.set(CSRF_HEADER_NAME, getCsrfToken());

    return fetch(url, {
        ...options,
        headers,
    });
}

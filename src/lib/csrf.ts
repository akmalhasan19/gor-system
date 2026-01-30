import { createHmac, randomBytes } from 'crypto';

/**
 * CSRF Token Utility
 * 
 * Generates and validates CSRF tokens using HMAC-SHA256 signatures.
 * Tokens are in format: `{random_value}.{signature}`
 */

const SECRET = process.env.CSRF_SECRET || 'csrf-dev-secret-change-in-production-min-32-chars';

/**
 * Generate a new CSRF token
 * @returns Signed CSRF token string
 */
export function generateCsrfToken(): string {
    const token = randomBytes(32).toString('hex');
    const signature = createHmac('sha256', SECRET)
        .update(token)
        .digest('hex');
    return `${token}.${signature}`;
}

/**
 * Verify a CSRF token's signature
 * @param token - The token to verify (format: value.signature)
 * @returns true if valid, false otherwise
 */
export function verifyCsrfToken(token: string): boolean {
    if (!token || typeof token !== 'string') return false;

    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [value, signature] = parts;
    if (!value || !signature) return false;

    const expectedSignature = createHmac('sha256', SECRET)
        .update(value)
        .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) return false;

    let result = 0;
    for (let i = 0; i < signature.length; i++) {
        result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    return result === 0;
}

/**
 * Cookie name for CSRF token
 */
export const CSRF_COOKIE_NAME = 'csrf-token';

/**
 * Header name for CSRF token
 */
export const CSRF_HEADER_NAME = 'x-csrf-token';

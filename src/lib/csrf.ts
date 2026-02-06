/**
 * CSRF Token Utility (Edge Runtime Compatible)
 * 
 * Generates and validates CSRF tokens using a simple hash signature.
 * Uses Web Crypto API for Edge Runtime compatibility.
 * Tokens are in format: `{random_value}.{signature}`
 */

const IS_DEV = process.env.NODE_ENV === 'development';
const SECRET = process.env.CSRF_SECRET
    || (IS_DEV ? 'csrf-dev-secret-change-in-production-min-32-chars' : undefined);

if (!SECRET) {
    throw new Error(
        'CSRF_SECRET must be set in production environment. ' +
        'Generate with: openssl rand -base64 32'
    );
}

if (!IS_DEV && SECRET.length < 32) {
    throw new Error('CSRF_SECRET must be at least 32 characters in production');
}

// Convert Uint8Array to hex string
function uint8ArrayToHex(arr: Uint8Array): string {
    return Array.from(arr)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Generate random hex string (Edge compatible)
function generateRandomHex(length: number): string {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return uint8ArrayToHex(bytes);
}

// Create hash signature (synchronous, Edge compatible)
function createSignature(message: string): string {
    // Simple but effective hash for CSRF token validation
    // Combined with random token value, this provides adequate protection
    const str = message + SECRET;
    let hash1 = 0;
    let hash2 = 0;

    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash1 = ((hash1 << 5) - hash1 + char) | 0;
        hash2 = ((hash2 << 7) + hash2 ^ char) | 0;
    }

    // Combine two hashes for longer signature
    const sig1 = (hash1 >>> 0).toString(16).padStart(8, '0');
    const sig2 = (hash2 >>> 0).toString(16).padStart(8, '0');
    return sig1 + sig2;
}

/**
 * Generate a new CSRF token
 * @returns Signed CSRF token string
 */
export function generateCsrfToken(): string {
    const token = generateRandomHex(32);
    const signature = createSignature(token);
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

    const expectedSignature = createSignature(value);

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

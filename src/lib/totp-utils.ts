import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

/**
 * TOTP Utilities for Phone Verification
 * Uses RFC 6238 compliant TOTP generation and validation
 */

const TOTP_ISSUER = 'SmashPartner';
const TOTP_ALGORITHM = 'SHA1';
const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30; // 30 seconds

/**
 * Generate a new TOTP secret for a user
 */
export function generateTOTPSecret(): string {
    const secret = new OTPAuth.Secret({ size: 20 });
    return secret.base32;
}

/**
 * Create a TOTP instance from a secret
 */
export function createTOTP(secret: string, accountName: string): OTPAuth.TOTP {
    return new OTPAuth.TOTP({
        issuer: TOTP_ISSUER,
        label: accountName,
        algorithm: TOTP_ALGORITHM,
        digits: TOTP_DIGITS,
        period: TOTP_PERIOD,
        secret: OTPAuth.Secret.fromBase32(secret),
    });
}

/**
 * Generate the current OTP token from a secret
 */
export function generateTOTPToken(secret: string, accountName: string): string {
    const totp = createTOTP(secret, accountName);
    return totp.generate();
}

/**
 * Validate a TOTP token
 * Returns the delta (window offset) if valid, null if invalid
 * Allows a window of ±1 period (total 3 valid codes at any time)
 */
export function validateTOTPToken(
    secret: string,
    token: string,
    accountName: string
): { valid: boolean; delta: number | null } {
    const totp = createTOTP(secret, accountName);

    // Allow 1 period before and after current time (handles clock skew)
    const delta = totp.validate({ token, window: 1 });

    return {
        valid: delta !== null,
        delta,
    };
}

/**
 * Generate a QR code data URL for the TOTP secret
 * This can be scanned by Google Authenticator, Authy, etc.
 */
export async function generateTOTPQRCode(
    secret: string,
    accountName: string
): Promise<string> {
    const totp = createTOTP(secret, accountName);
    const uri = totp.toString();

    try {
        const qrCodeDataUrl = await QRCode.toDataURL(uri, {
            width: 256,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });
        return qrCodeDataUrl;
    } catch (error) {
        console.error('Failed to generate QR code:', error);
        throw new Error('Failed to generate QR code');
    }
}

/**
 * Get the TOTP URI for manual entry
 */
export function getTOTPUri(secret: string, accountName: string): string {
    const totp = createTOTP(secret, accountName);
    return totp.toString();
}

/**
 * Format phone number to E.164 format
 * Supports Indonesian (+62) and international numbers
 */
export function formatPhoneNumber(phone: string, countryCode: string = '+62'): string {
    // Remove all non-digit characters except leading +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // If starts with 0, replace with country code
    if (cleaned.startsWith('0')) {
        cleaned = countryCode + cleaned.substring(1);
    }

    // If doesn't start with +, add country code
    if (!cleaned.startsWith('+')) {
        cleaned = countryCode + cleaned;
    }

    return cleaned;
}

/**
 * Validate phone number format
 * Returns true if valid E.164 format
 */
export function isValidPhoneNumber(phone: string): boolean {
    // E.164 format: + followed by 1-15 digits
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
}

/**
 * Validate Indonesian phone number
 */
export function isValidIndonesianPhone(phone: string): boolean {
    const formatted = formatPhoneNumber(phone);
    // Indonesian numbers: +62 followed by 9-12 digits
    const idRegex = /^\+62[0-9]{9,12}$/;
    return idRegex.test(formatted);
}

/**
 * Generate a random 6-digit OTP code (for SMS fallback)
 */
export function generateOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP code for secure storage
 * Uses simple hash for OTP (short-lived, doesn't need bcrypt)
 */
export async function hashOTPCode(code: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify OTP code against hash
 */
export async function verifyOTPCode(code: string, hash: string): Promise<boolean> {
    const codeHash = await hashOTPCode(code);
    return codeHash === hash;
}

import QRCode from 'qrcode';

/**
 * QR Code Generator Utilities for Member Verification
 * Generates unique QR codes per member per day with SHA-256 signature
 */

// Secret salt for signature generation (should be in env vars for production)
const QR_SECRET_SALT = process.env.NEXT_PUBLIC_QR_SECRET || 'smashpartner-qr-secret-2026';

interface QRPayload {
    memberId: string;
    name: string;
    date: string; // YYYY-MM-DD format
    signature: string;
}

/**
 * Generate SHA-256 hash using Web Crypto API
 */
async function sha256(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate signature for QR data
 */
async function generateSignature(memberId: string, date: string): Promise<string> {
    const payload = `${memberId}:${date}:${QR_SECRET_SALT}`;
    const fullHash = await sha256(payload);
    // Return first 16 characters for shorter QR code
    return fullHash.substring(0, 16);
}

/**
 * Get today's date in YYYY-MM-DD format (local time)
 */
export function getTodayDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

/**
 * Encode payload to Base64 (URL safe)
 */
function encodePayload(payload: QRPayload): string {
    const jsonStr = JSON.stringify(payload);
    // Use btoa for base64 encoding (supported in browser)
    return btoa(jsonStr);
}

/**
 * Decode payload from Base64
 */
function decodePayload(token: string): QRPayload | null {
    try {
        const jsonStr = atob(token);
        return JSON.parse(jsonStr);
    } catch {
        return null;
    }
}

/**
 * Generate QR URL for a member
 * Returns a full URL pointing to the verification page
 */
export async function generateMemberQRData(memberId: string, name: string, date?: string): Promise<string> {
    const qrDate = date || getTodayDate();
    const signature = await generateSignature(memberId, qrDate);

    const payload: QRPayload = {
        memberId,
        name,
        date: qrDate,
        signature
    };

    const token = encodePayload(payload);

    // Use window.location.origin if available (client-side), otherwise relative path (handled by QRCode lib usually)
    // fallback for SSR or initial render where window might be undefined
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    return `${origin}/verify?data=${token}`;
}

/**
 * Validate QR data payload
 * Handles both full URL (extracts 'data' param) and raw JSON (legacy support)
 */
export async function validateMemberQRData(inputData: string): Promise<{
    valid: boolean;
    memberId?: string;
    error?: string;
    payload?: any;
}> {
    let payload: QRPayload | null = null;

    try {
        // 1. Try to parse as URL
        if (inputData.includes('data=')) {
            const url = new URL(inputData);
            const token = url.searchParams.get('data');
            if (token) {
                payload = decodePayload(token);
            }
        }
        // 2. Try to decode raw base64 (if passed directly)
        else if (!inputData.startsWith('{')) {
            payload = decodePayload(inputData);
        }

        // 3. Try to parse as raw JSON (legacy)
        if (!payload) {
            payload = JSON.parse(inputData);
        }

        if (!payload) throw new Error("Invalid format");

        // Check required fields
        if (!payload.memberId || !payload.date || !payload.signature) {
            return { valid: false, error: 'QR tidak valid - format salah' };
        }

        // Check date (must be today)
        const today = getTodayDate();
        if (payload.date !== today) {
            return { valid: false, error: 'QR sudah kadaluarsa (Hanya berlaku hari ini)', payload };
        }

        // Verify signature
        const expectedSignature = await generateSignature(payload.memberId, payload.date);
        if (payload.signature !== expectedSignature) {
            return { valid: false, error: 'QR tidak valid - signature salah' };
        }

        return { valid: true, memberId: payload.memberId, payload };
    } catch (e) {
        return { valid: false, error: 'QR tidak valid - gagal membaca data' };
    }
}

/**
 * Generate QR code as data URL for a member
 */
export async function generateMemberQRCode(memberId: string, name: string): Promise<string> {
    const qrUrl = await generateMemberQRData(memberId, name);

    try {
        const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
            errorCorrectionLevel: 'M'
        });
        return qrCodeDataUrl;
    } catch (error) {
        console.error('Failed to generate QR code:', error);
        throw new Error('Gagal membuat QR code');
    }
}

/**
 * Check if QR data looks like a SmashPartner QR
 */
export function isSmashPartnerQR(data: string): boolean {
    return data.includes('/verify?data=') || (data.startsWith('{') && data.includes('memberId'));
}

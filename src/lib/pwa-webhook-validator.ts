/**
 * PWA Webhook Signature Validator
 * 
 * Provides cryptographic verification of PWA sync webhook payloads using HMAC-SHA256.
 * Similar to Xendit webhook validation but for internal PWA-to-Partner sync.
 */

import crypto from 'crypto';

/**
 * Generates HMAC-SHA256 signature for a payload.
 * Use this on the PWA side to sign outgoing webhooks.
 * 
 * @param payload - The JSON payload as a string
 * @param secret - The shared webhook secret
 * @returns Hex-encoded HMAC signature
 */
export function generatePwaSignature(payload: string, secret: string): string {
    return crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
}

/**
 * Verifies the HMAC-SHA256 signature of a PWA webhook payload.
 * Uses timing-safe comparison to prevent timing attacks.
 * 
 * @param rawBody - The raw request body as a string
 * @param signature - The signature from the x-pwa-signature header
 * @param secret - The shared webhook secret (PWA_WEBHOOK_SECRET)
 * @returns true if signature is valid, false otherwise
 */
export function verifyPwaSignature(
    rawBody: string,
    signature: string,
    secret: string
): boolean {
    try {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');

        // Use timing-safe comparison to prevent timing attacks
        const signatureBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);

        // Buffers must be same length for timingSafeEqual
        if (signatureBuffer.length !== expectedBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    } catch (error) {
        console.error('[PWA Webhook] Error verifying signature:', error);
        return false;
    }
}

/**
 * Complete PWA webhook verification result
 */
export interface PwaWebhookVerificationResult {
    valid: boolean;
    error?: string;
}

/**
 * Verifies a PWA webhook request
 * 
 * @param rawBody - The raw request body
 * @param signature - The x-pwa-signature header value
 * @param secret - The PWA_WEBHOOK_SECRET env var
 * @returns Verification result with valid flag and optional error message
 */
export function verifyPwaWebhook(
    rawBody: string,
    signature: string | null,
    secret: string
): PwaWebhookVerificationResult {
    // Check if secret is configured
    if (!secret) {
        console.error('[PWA Webhook] PWA_WEBHOOK_SECRET not configured');
        return { valid: false, error: 'Webhook secret not configured' };
    }

    // Verify signature exists
    if (!signature) {
        return { valid: false, error: 'Missing x-pwa-signature header' };
    }

    // Verify signature
    if (!verifyPwaSignature(rawBody, signature, secret)) {
        return { valid: false, error: 'Invalid webhook signature' };
    }

    return { valid: true };
}

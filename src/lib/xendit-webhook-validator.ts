/**
 * Xendit Webhook Signature Validator
 * 
 * Provides cryptographic verification of Xendit webhook payloads using HMAC-SHA256.
 * Includes replay attack protection via timestamp validation.
 */

import crypto from 'crypto';

/**
 * Verifies the HMAC-SHA256 signature of a Xendit webhook payload.
 * Uses timing-safe comparison to prevent timing attacks.
 * 
 * @param rawBody - The raw request body as a string
 * @param signature - The signature from the x-callback-signature header
 * @param secret - The webhook secret from Xendit dashboard
 * @returns true if signature is valid, false otherwise
 */
export function verifyXenditSignature(
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
        console.error('Error verifying Xendit signature:', error);
        return false;
    }
}

/**
 * Validates that a webhook timestamp is within an acceptable window.
 * Prevents replay attacks by rejecting old webhooks.
 * 
 * @param webhookTimestamp - The timestamp from the webhook payload
 * @param maxAgeMs - Maximum allowed age in milliseconds (default: 5 minutes)
 * @returns true if timestamp is within acceptable window, false otherwise
 */
export function isWebhookTimestampValid(
    webhookTimestamp: string | Date | undefined,
    maxAgeMs: number = 5 * 60 * 1000 // 5 minutes
): boolean {
    if (!webhookTimestamp) {
        // If no timestamp is provided, skip this check
        // Some webhook types may not have a timestamp
        return true;
    }

    try {
        const timestamp = new Date(webhookTimestamp);
        const now = new Date();
        const age = now.getTime() - timestamp.getTime();

        // Reject if too old
        if (age > maxAgeMs) {
            console.warn(`Webhook timestamp too old: ${age}ms (max: ${maxAgeMs}ms)`);
            return false;
        }

        // Also reject if timestamp is in the future (clock skew tolerance: 1 minute)
        if (age < -60000) {
            console.warn('Webhook timestamp is in the future');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error validating webhook timestamp:', error);
        return false;
    }
}

/**
 * Complete webhook verification: signature + timestamp
 */
export interface WebhookVerificationResult {
    valid: boolean;
    error?: string;
}

export function verifyXenditWebhook(
    rawBody: string,
    signature: string | null,
    secret: string,
    timestamp?: string | Date
): WebhookVerificationResult {
    // Check if signature verification is enabled
    if (!secret) {
        console.warn('XENDIT_WEBHOOK_SECRET not configured, skipping signature verification');
        return { valid: true };
    }

    // Verify signature
    if (!signature) {
        return { valid: false, error: 'Missing x-callback-signature header' };
    }

    if (!verifyXenditSignature(rawBody, signature, secret)) {
        return { valid: false, error: 'Invalid webhook signature' };
    }

    // Verify timestamp (replay attack protection)
    if (!isWebhookTimestampValid(timestamp)) {
        return { valid: false, error: 'Webhook timestamp expired (possible replay attack)' };
    }

    return { valid: true };
}

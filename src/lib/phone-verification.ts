import { supabase } from './supabase';
import {
    generateTOTPSecret,
    generateTOTPQRCode,
    validateTOTPToken,
    formatPhoneNumber,
    isValidPhoneNumber,
    getTOTPUri
} from './totp-utils';

/**
 * Phone Verification Service
 * Handles TOTP-based phone verification for registration
 */

export interface PhoneVerificationRecord {
    id: string;
    userId: string;
    phoneNumber: string;
    countryCode: string;
    totpSecret: string | null;
    verificationType: 'totp' | 'sms' | 'manual';
    attempts: number;
    maxAttempts: number;
    isVerified: boolean;
    expiresAt: string;
    verifiedAt: string | null;
}

export interface InitiateVerificationResult {
    success: boolean;
    verificationId?: string;
    qrCode?: string;
    totpUri?: string;
    secret?: string; // Only for display to user
    error?: string;
}

export interface VerifyCodeResult {
    success: boolean;
    verified?: boolean;
    error?: string;
    attemptsRemaining?: number;
}

/**
 * Initiate phone verification for a user
 * Creates a TOTP secret and returns QR code for authenticator app
 */
export async function initiatePhoneVerification(
    userId: string,
    phoneNumber: string,
    accountName: string,
    countryCode: string = '+62'
): Promise<InitiateVerificationResult> {
    try {
        // Format and validate phone number
        const formattedPhone = formatPhoneNumber(phoneNumber, countryCode);
        if (!isValidPhoneNumber(formattedPhone)) {
            return { success: false, error: 'Invalid phone number format' };
        }

        // Check rate limiting
        const isRateLimited = await checkRateLimit(formattedPhone);
        if (isRateLimited) {
            return { success: false, error: 'Too many verification attempts. Please try again later.' };
        }

        // Check if user already has a pending verification
        const { data: existingVerification } = await supabase
            .from('phone_verifications')
            .select('*')
            .eq('user_id', userId)
            .eq('is_verified', false)
            .single();

        if (existingVerification) {
            // Delete existing pending verification
            await supabase
                .from('phone_verifications')
                .delete()
                .eq('id', existingVerification.id);
        }

        // Generate new TOTP secret
        const totpSecret = generateTOTPSecret();

        // Calculate expiry (24 hours for initial setup)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Create verification record
        const { data, error } = await supabase
            .from('phone_verifications')
            .insert({
                user_id: userId,
                phone_number: formattedPhone,
                country_code: countryCode,
                totp_secret: totpSecret,
                verification_type: 'totp',
                expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to create verification record:', error);
            return { success: false, error: 'Failed to initiate verification' };
        }

        // Generate QR code for authenticator app
        const qrCode = await generateTOTPQRCode(totpSecret, accountName);
        const totpUri = getTOTPUri(totpSecret, accountName);

        // Record rate limit
        await recordRateLimitAttempt(formattedPhone);

        return {
            success: true,
            verificationId: data.id,
            qrCode,
            totpUri,
            secret: totpSecret, // Display to user for manual entry
        };
    } catch (error) {
        console.error('Error initiating phone verification:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Verify a TOTP code submitted by the user
 */
export async function verifyTOTPCode(
    userId: string,
    code: string,
    accountName: string
): Promise<VerifyCodeResult> {
    try {
        // Get pending verification for user
        const { data: verification, error: fetchError } = await supabase
            .from('phone_verifications')
            .select('*')
            .eq('user_id', userId)
            .eq('is_verified', false)
            .single();

        if (fetchError || !verification) {
            return { success: false, error: 'No pending verification found' };
        }

        // Check if expired
        if (new Date(verification.expires_at) < new Date()) {
            return { success: false, error: 'Verification has expired. Please start again.' };
        }

        // Check attempts
        if (verification.attempts >= verification.max_attempts) {
            return {
                success: false,
                error: 'Too many failed attempts. Please start again.',
                attemptsRemaining: 0
            };
        }

        // Validate TOTP code
        const { valid } = validateTOTPToken(verification.totp_secret, code, accountName);

        if (!valid) {
            // Increment attempts
            await supabase
                .from('phone_verifications')
                .update({
                    attempts: verification.attempts + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', verification.id);

            const attemptsRemaining = verification.max_attempts - verification.attempts - 1;
            return {
                success: false,
                error: `Invalid code. ${attemptsRemaining} attempts remaining.`,
                attemptsRemaining
            };
        }

        // Mark as verified
        const { error: updateError } = await supabase
            .from('phone_verifications')
            .update({
                is_verified: true,
                verified_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', verification.id);

        if (updateError) {
            console.error('Failed to update verification:', updateError);
            return { success: false, error: 'Failed to complete verification' };
        }

        // Update user metadata with verified phone
        await updateUserPhoneMetadata(userId, verification.phone_number);

        return { success: true, verified: true };
    } catch (error) {
        console.error('Error verifying TOTP code:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Update user metadata with verified phone number
 */
async function updateUserPhoneMetadata(userId: string, phoneNumber: string): Promise<void> {
    try {
        const { error } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
                phone: phoneNumber,
                phone_verified: true,
                phone_verified_at: new Date().toISOString()
            }
        });

        if (error) {
            // Fallback: Try updating through the user's own session
            // This won't work for admin operations, but log it
            console.warn('Admin update failed, metadata may not be updated:', error);
        }
    } catch (error) {
        console.error('Error updating user metadata:', error);
    }
}

/**
 * Check if phone number is verified for a user
 */
export async function isPhoneVerified(userId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('phone_verifications')
        .select('is_verified')
        .eq('user_id', userId)
        .eq('is_verified', true)
        .limit(1);

    if (error || !data || data.length === 0) {
        return false;
    }

    return true;
}

/**
 * Get verification status for a user
 */
export async function getVerificationStatus(userId: string): Promise<{
    hasVerification: boolean;
    isVerified: boolean;
    phoneNumber?: string;
    expiresAt?: string;
}> {
    const { data, error } = await supabase
        .from('phone_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) {
        return { hasVerification: false, isVerified: false };
    }

    return {
        hasVerification: true,
        isVerified: data.is_verified,
        phoneNumber: data.phone_number,
        expiresAt: data.expires_at
    };
}

/**
 * Check rate limiting for phone verification requests
 */
async function checkRateLimit(phoneNumber: string): Promise<boolean> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data, error } = await supabase
        .from('phone_verification_rate_limits')
        .select('request_count')
        .eq('phone_number', phoneNumber)
        .gte('window_start', oneHourAgo.toISOString())
        .single();

    if (error || !data) {
        return false; // No rate limit record, allow request
    }

    // Allow max 3 requests per hour
    return data.request_count >= 3;
}

/**
 * Record a rate limit attempt
 */
async function recordRateLimitAttempt(phoneNumber: string): Promise<void> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Check for existing record in current window
    const { data: existing } = await supabase
        .from('phone_verification_rate_limits')
        .select('*')
        .eq('phone_number', phoneNumber)
        .gte('window_start', oneHourAgo.toISOString())
        .single();

    if (existing) {
        // Increment existing record
        await supabase
            .from('phone_verification_rate_limits')
            .update({ request_count: existing.request_count + 1 })
            .eq('id', existing.id);
    } else {
        // Create new record
        await supabase
            .from('phone_verification_rate_limits')
            .insert({
                phone_number: phoneNumber,
                request_count: 1,
                window_start: new Date().toISOString()
            });
    }
}

/**
 * Cancel pending verification
 */
export async function cancelVerification(userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('phone_verifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_verified', false);

    return !error;
}

import { supabase } from './supabase';

/**
 * Password Reset Utilities
 * Handles forgot password flow with Supabase Auth
 */

/**
 * Send password reset email
 * Note: Always returns success to prevent email enumeration
 */
export async function sendPasswordResetEmail(email: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            console.error('Password reset error:', error);
            // Don't expose whether email exists or not
        }

        // Always return success to prevent email enumeration
        return { success: true };
    } catch (error) {
        console.error('Password reset error:', error);
        return { success: true }; // Still return success for security
    }
}

/**
 * Update user password
 * Must be called after user clicks reset link (has valid session)
 */
export async function updatePassword(newPassword: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) {
            console.error('Update password error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Update password error:', error);
        return { success: false, error: error.message || 'Failed to update password' };
    }
}

/**
 * Check if current user has phone verified
 */
export async function checkPhoneVerified(): Promise<{
    isVerified: boolean;
    totpSecret?: string;
    error?: string;
}> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { isVerified: false, error: 'Not authenticated' };
        }

        const isVerified = user.user_metadata?.phone_verified === true;

        if (isVerified) {
            // Get TOTP secret from phone_verifications table
            const { data: verification } = await supabase
                .from('phone_verifications')
                .select('totp_secret')
                .eq('user_id', user.id)
                .eq('is_verified', true)
                .single();

            return {
                isVerified: true,
                totpSecret: verification?.totp_secret,
            };
        }

        return { isVerified: false };
    } catch (error: any) {
        console.error('Check phone verified error:', error);
        return { isVerified: false, error: error.message };
    }
}

/**
 * Validate password requirements
 */
export function validatePassword(password: string): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password minimal 8 karakter');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password harus mengandung huruf kecil');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password harus mengandung huruf besar');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password harus mengandung angka');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Sign out all sessions (for security after password change)
 */
export async function signOutAllSessions(): Promise<void> {
    try {
        await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

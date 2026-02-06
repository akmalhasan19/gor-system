/**
 * Environment Variables Validator
 * Validates required environment variables on app startup
 * Fails fast if critical secrets are missing in production
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const REQUIRED_SECRETS = {
    // Critical secrets (must exist in production)
    critical: [
        'SUPABASE_SERVICE_ROLE_KEY',
        'XENDIT_SECRET_KEY',
        'CSRF_SECRET',
        'QR_SECRET',
    ],

    // Recommended but not blocking
    recommended: [
        'XENDIT_WEBHOOK_SECRET',
        'PWA_WEBHOOK_SECRET',
        'API_JWT_SECRET',
        'FONNTE_API_KEY',
    ]
};

export function validateEnvironment() {
    if (!IS_PRODUCTION) {
        console.log('⚙️  Development mode - skipping strict env validation');
        return;
    }

    const missing: string[] = [];
    const weak: string[] = [];

    // Check critical secrets
    for (const key of REQUIRED_SECRETS.critical) {
        const value = process.env[key];
        if (!value) {
            missing.push(key);
        } else if (value.length < 32) {
            weak.push(key);
        }
    }

    // Check recommended secrets (warning only)
    for (const key of REQUIRED_SECRETS.recommended) {
        if (!process.env[key]) {
            console.warn(`⚠️  Recommended secret ${key} is not set`);
        }
    }

    if (missing.length > 0) {
        const errorMsg = [
            '❌ Missing required secrets in production:',
            ...missing.map(key => `   - ${key}`),
            '',
            'Please set these in your Vercel environment variables.',
            'Generate secrets with: openssl rand -base64 32'
        ].join('\n');

        throw new Error(errorMsg);
    }

    if (weak.length > 0) {
        const errorMsg = [
            '❌ Weak secrets detected (< 32 chars):',
            ...weak.map(key => `   - ${key}`),
            '',
            'Generate strong secrets with: openssl rand -base64 32'
        ].join('\n');

        throw new Error(errorMsg);
    }

    console.log('✅ All required environment variables validated');
}

const { SignJWT } = require('jose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Manually load env since dotenv might fail if path issues
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function generateToken() {
    const secret = process.env.API_JWT_SECRET;
    if (!secret) {
        console.error('Error: API_JWT_SECRET is not set in .env.local');
        // Try to read file directly to debug
        try {
            const content = fs.readFileSync(envPath, 'utf8');
            console.log('Env file content length:', content.length);
            const match = content.match(/API_JWT_SECRET=(.+)/);
            if (match) {
                console.log('Found secret in file manually:', match[1].substring(0, 5) + '...');
                // Use manual match if dotenv failed
                process.env.API_JWT_SECRET = match[1].trim();
                return generateTokenWithSecret(match[1].trim());
            }
        } catch (e) {
            console.error('Could not read .env.local:', e.message);
        }
        process.exit(1);
    }
    return generateTokenWithSecret(secret);
}

async function generateTokenWithSecret(secret) {
    const secretKey = new TextEncoder().encode(secret);

    const token = await new SignJWT({
        'urn:smash:partner': true,
        role: 'service_account',
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer('pwa-smash-system')
        .setAudience('partner-website')
        .setExpirationTime('10y')
        .sign(secretKey);

    console.log('\n--- NEW SERVICE ACCOUNT TOKEN ---');
    console.log(token);
    console.log('---------------------------------');
}

generateToken().catch(console.error);

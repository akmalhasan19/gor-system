import { SignJWT } from 'jose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function generateToken() {
    const secret = process.env.API_JWT_SECRET;
    if (!secret) {
        console.error('Error: API_JWT_SECRET is not set in .env.local');
        process.exit(1);
    }

    const secretKey = new TextEncoder().encode(secret);

    const token = await new SignJWT({
        'urn:smash:partner': true,
        role: 'service_account',
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer('pwa-smash-system')
        .setAudience('partner-website')
        .setExpirationTime('10y') // Long-lived token for service account
        .sign(secretKey);

    console.log('\n--- NEW SERVICE ACCOUNT TOKEN ---');
    console.log(token);
    console.log('---------------------------------');
}

generateToken().catch(console.error);

require('dotenv').config({ path: '.env' });
const { SignJWT } = require('jose');
const crypto = require('crypto');

const secretKey = process.env.API_JWT_SECRET;

if (!secretKey) {
    console.error('Error: API_JWT_SECRET is not set in .env');
    process.exit(1);
}

async function generateToken() {
    const secret = new TextEncoder().encode(secretKey);
    const alg = 'HS256';

    const jwt = await new SignJWT({ 'urn:example:claim': true })
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setIssuer('urn:example:issuer')
        .setAudience('urn:example:audience')
        .setExpirationTime('1y') // Long expiry for simplicity in M2M
        .sign(secret);

    console.log('------------------------------------------------');
    console.log('🔐 GENERATED JWT TOKEN (Valid for 1 year)');
    console.log('------------------------------------------------');
    console.log(jwt);
    console.log('------------------------------------------------');
    console.log('Use this token in the Authorization header:');
    console.log(`Authorization: Bearer ${jwt}`);
}

generateToken().catch(console.error);

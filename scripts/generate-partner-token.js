const { SignJWT } = require('jose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.error('Error: .env file not found at', envPath);
    process.exit(1);
}

const secretKey = process.env.API_JWT_SECRET;

if (!secretKey) {
    console.error('Error: API_JWT_SECRET is not defined in .env');
    process.exit(1);
}

async function generateToken() {
    const secret = new TextEncoder().encode(secretKey);
    const alg = 'HS256';

    const jwt = await new SignJWT({
        'urn:smash:partner': true,
        'role': 'service_account'
    })
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setIssuer('pwa-smash-system')
        .setAudience('partner-website')
        .setExpirationTime('10y') // Valid for 10 years (long lived for server-to-server)
        .sign(secret);

    console.log('\n✅ JWT Token Generated Successfully:');
    console.log('---------------------------------------------------');
    console.log(jwt);
    console.log('---------------------------------------------------');
    console.log(`\n📋 Add this to your Partner Website .env as SMASH_API_TOKEN`);
}

generateToken().catch(err => {
    console.error('Failed to generate token:', err);
});

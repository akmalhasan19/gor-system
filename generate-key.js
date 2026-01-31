const crypto = require('crypto');

function generateNewApiKey() {
    const prefix = 'sk_live_';
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const apiKey = `${prefix}${randomBytes}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    return { apiKey, keyHash };
}

const { apiKey, keyHash } = generateNewApiKey();

console.log('--- NEW API KEY ---');
console.log('API Key (Give this to the client):', apiKey);
console.log('Key Hash (Insert this into DB):', keyHash);
console.log('SQL Command:');
console.log(`INSERT INTO public.api_keys (key_hash, name, description) VALUES ('${keyHash}', 'Test Client', 'Generated via script');`);

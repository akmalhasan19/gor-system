
const https = require('https');

const data = JSON.stringify({
    external_id: "test_connection",
    status: "PENDING",
    amount: 10000
});

const options = {
    hostname: 'smash-partner.vercel.app',
    port: 443,
    path: '/api/webhooks/xendit',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'x-callback-token': 'test_token_invalid' // Intentionally invalid to trigger expected 401
    }
};

console.log('Testing connection to: https://smash-partner.vercel.app/api/webhooks/xendit');

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();

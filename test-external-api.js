const axios = require('axios');


const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ENDPOINT = `${API_URL}/api/external/v1/courts`;
const API_KEY = 'sk_live_test_12345';

async function testApi() {
    console.log('Testing External API...');
    console.log('Endpoint:', ENDPOINT);

    try {
        const response = await axios.get(ENDPOINT, {
            headers: {
                'x-api-key': API_KEY
            }
        });

        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));

        if (response.status === 200 && response.data.data) {
            console.log('✅ TEST PASSED: API returned data.');
        } else {
            console.log('❌ TEST FAILED: Unexpected response format.');
        }

    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', error.response.status, error.response.data);
        } else {
            console.error('❌ Network Error:', error.message);
        }
    }
}

testApi();

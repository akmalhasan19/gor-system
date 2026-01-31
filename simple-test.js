// Simple test script using native fetch
async function test() {
    const url = 'http://localhost:3000/api/external/v1/courts';
    const apiKey = 'sk_live_test_12345';
    
    console.log('Fetching:', url);
    try {
        const res = await fetch(url, {
            headers: { 'x-api-key': apiKey }
        });
        
        console.log('Status:', res.status);
        if (res.ok) {
            const json = await res.json();
            console.log('Success! Data count:', json.data ? json.data.length : 'N/A');
        } else {
            console.log('Failed:', await res.text());
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

test();

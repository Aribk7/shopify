require('dotenv').config({ path: '.env.local' });
async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;
    
    // Attempt 1: generationConfig.aspectRatio
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: 'a beautiful landscape' }] }],
            generationConfig: {
                aspectRatio: '16:9'
            }
        })
    });
    console.log('Test 1:', res.status, (await res.text()).substring(0, 300));

    // Attempt 2: parameters object in root
    const res2 = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: 'a beautiful landscape' }] }],
            parameters: {
                aspectRatio: '16:9'
            }
        })
    });
    console.log('Test 2:', res2.status, (await res2.text()).substring(0, 300));
}
test();

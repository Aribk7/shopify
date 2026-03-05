require('dotenv').config({ path: '.env.local' });
async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;
    
    // Testing parameter structure from Imagen API documentation
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: 'a beautiful landscape' }] }],
            toolConfig: {
                functionCallingConfig: {
                    aspectRatio: "16:9"
                }
            }
        })
    });
    console.log('Test 4:', res.status, (await res.text()).substring(0, 300));
}
test();

require('dotenv').config({ path: '.env.local' });
async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: 'a beautiful landscape' }] }],
            generationConfig: {
                responseModalities: ['IMAGE'],
            }
        })
    });
    console.log('generateContent status:', res.status, (await res.text()).substring(0, 300));
}
test();

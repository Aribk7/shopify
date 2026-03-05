require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:predict?key=${apiKey}`;
    const url2 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;
    
    // Test generateContent
    const res = await fetch(url2, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: "a beautiful landscape" }] }],
            generationConfig: {
                // responseModalities: ['TEXT', 'IMAGE'],
                temperature: 1,
            },
        }),
    });
    
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
}
test();

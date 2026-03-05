require('dotenv').config({ path: '.env.local' });
async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;
    
    // Attempt 6: using Google AI Studio image format
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
             contents: [{ parts: [{ text: 'a beautiful landscape' }] }],
             generationConfig: {
                 // The Gemini 2.0 image generation API allowed specifying aspect ratio?
             }
        })
    });
}

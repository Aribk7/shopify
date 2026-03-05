require('dotenv').config({ path: '.env.local' });
async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:predict?key=${apiKey}`;
    
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            instances: [
                {
                    prompt: "A beautiful landscape"
                }
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: "16:9"
            }
        })
    });
    console.log('predict status:', res.status, (await res.text()).substring(0, 300));
}
test();

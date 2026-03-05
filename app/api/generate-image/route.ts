import { NextRequest, NextResponse } from 'next/server'

const ASPECT_MAP: Record<string, string> = {
    '1:1': 'square format (1:1)',
    '4:5': 'portrait format (4:5), ideal for Instagram feed',
    '9:16': 'vertical format (9:16), ideal for Stories and Reels',
    '16:9': 'wide horizontal format (16:9), ideal for banners',
}

async function expandPrompt(
    userPrompt: string,
    style: string,
    aspect: string,
    apiKey: string,
    referenceImage?: string
): Promise<string> {
    const aspectDesc = ASPECT_MAP[aspect] || 'square format'
    const systemInstruction = `You are an expert AI image prompt engineer specializing in high-quality advertising creative for health and supplement brands.
Your job is to take a simple image description (and optionally a reference image) and expand it into a richly detailed, professional image generation prompt.

Rules:
- Be extremely specific about lighting, composition, colors, textures, and mood
- Describe the subject with precise physical details
- Include camera/lens details (e.g. "shot on Sony A7R V, 85mm f/1.4")
- Include post-processing style (e.g. "subtle color grading, warm golden tones")
- Make it feel premium, editorial, and advertising-quality
- Keep the prompt to 3-5 sentences maximum — dense and specific
- Do NOT include any explanation or commentary, just the prompt itself
- CRITICAL: The image MUST NOT contain any text, letters, words, or typography whatsoever.
- ABSOLUTELY NO CAPTIONS, SUBTITLES, OR GRAPHIC DESIGN ELEMENTS. 
- Unless the user explicitly asks for "text" or a specific "caption" or "word" to be written, ensure the output is 100% purely visual without a single character of text.
- DO NOT generate any mock-ups with placeholder text, logos with names, or labels on bottles/packaging. Show products as unbranded or with generic, text-free shapes.
- If the user has NOT provided specific text to include, the generated prompt MUST NOT include any words like "typography", "text", "label", "caption", "lettering", or "logo".`

    const userMessage = `Expand this into a detailed image generation prompt:
"${userPrompt}"

Style: ${style}
Format: ${aspectDesc}
${referenceImage ? 'Reference Image provided: Use the visual style and composition from the reference image.' : ''}

Output only the expanded prompt, nothing else.`

    const parts: any[] = [{ text: userMessage }]
    if (referenceImage) {
        // If we have a reference image, we can use it to inform the prompt expansion too
        // Extract base64 and mime type
        const match = referenceImage.match(/^data:(image\/[a-zA-Z]*);base64,(.*)$/)
        if (match) {
            parts.push({
                inlineData: {
                    mimeType: match[1],
                    data: match[2]
                }
            })
        }
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents: [{ parts }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
            }),
        }
    )

    if (!response.ok) {
        // If prompt expansion fails, return the original prompt
        return `${userPrompt}. Style: ${style}. Format: ${aspectDesc}. High quality, detailed, professional ad creative.`
    }

    const data = await response.json()
    let expanded = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    // Ensure aspect ratio instruction is appended to the final prompt
    if (expanded) {
        expanded = `${expanded} Aspect ratio: ${aspect}.`
    } else {
        expanded = `${userPrompt}. Style: ${style}. Format: ${aspectDesc}. Aspect ratio: ${aspect}. High quality, detailed, professional ad creative.`
    }

    return expanded
}

export async function POST(request: NextRequest) {
    try {
        const { prompt, style = 'Photorealistic', aspectRatio = '1:1', referenceImage } = await request.json()

        if (!prompt || !prompt.trim()) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
        }

        // Step 1: Expand the user prompt into a detailed image generation brief
        const expandedPrompt = await expandPrompt(prompt.trim(), style, aspectRatio, apiKey, referenceImage)
        console.log('Expanded prompt:', expandedPrompt)

        // Step 2: Generate the image with the amplified prompt
        // We include the reference image in the main generation call as well if available
        const generationParts: any[] = [{ text: expandedPrompt }]
        if (referenceImage) {
            const match = referenceImage.match(/^data:(image\/[a-zA-Z]*);base64,(.*)$/)
            if (match) {
                generationParts.push({
                    inlineData: {
                        mimeType: match[1],
                        data: match[2]
                    }
                })
            }
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: generationParts }],
                    generationConfig: {
                        temperature: 1,
                    },
                }),
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Gemini image gen error:', errorText)
            return NextResponse.json(
                { error: 'Failed to generate image', details: errorText },
                { status: response.status }
            )
        }

        const data = await response.json()
        const parts = data.candidates?.[0]?.content?.parts || []

        for (const part of parts) {
            if (part.inlineData) {
                return NextResponse.json({
                    imageBase64: part.inlineData.data,
                    mimeType: part.inlineData.mimeType || 'image/png',
                    expandedPrompt, // Return the expanded prompt so UI can show it
                })
            }
        }

        console.error('No image in response parts:', JSON.stringify(parts))
        return NextResponse.json({ error: 'No image data in API response' }, { status: 500 })
    } catch (error) {
        console.error('Image generation error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

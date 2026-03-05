import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { audioBase64, mimeType } = await request.json()

        if (!audioBase64) {
            return NextResponse.json({ error: 'Audio data is required' }, { status: 400 })
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
        }

        const systemInstruction = `You are an expert transcriber. Transcribe the following audio precisely. 
Return ONLY the transcribed text. Do not include any timestamps, speaker labels, or conversational filler unless they are critical to the meaning. 
If the audio is a marketing script or advertisement, capture the tone and exact wording perfectly.`

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    contents: [{
                        parts: [
                            {
                                inlineData: {
                                    mimeType: mimeType || 'audio/mp3',
                                    data: audioBase64
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 2000,
                    },
                }),
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Gemini transcription error:', errorText)
            return NextResponse.json(
                { error: 'Failed to transcribe audio', details: errorText },
                { status: response.status }
            )
        }

        const data = await response.json()
        const transcription = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

        if (!transcription) {
            return NextResponse.json({ error: 'No transcription generated' }, { status: 500 })
        }

        return NextResponse.json({ transcription })
    } catch (error) {
        console.error('Transcription API error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

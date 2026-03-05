import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding } from '@/lib/embeddings'
import { queryVectorStore } from '@/lib/pinecone'

export async function POST(request: NextRequest) {
    try {
        const { messages, brandContext, isResiliaMode } = await request.json()

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
        }

        const lastMessage = messages[messages.length - 1].content

        // 1. Get RAG context
        let ragContext = ''
        try {
            const queryEmbedding = await generateEmbedding(lastMessage)
            const filter = isResiliaMode ? { brand: 'resilia' } : undefined
            const relevantChunks = await queryVectorStore(queryEmbedding, 5, filter)

            if (relevantChunks.length > 0) {
                ragContext = `\n\n=== RELEVANT CONTEXT FROM KNOWLEDGE BASE ===\n${relevantChunks.join('\n\n---\n\n')}\n`
            }
        } catch (error) {
            console.error('Chat RAG error:', error)
        }

        // 2. Build system prompt
        const systemPrompt = `You are "Oil of Oregano AI", a specialized brand assistant and marketing strategist. 
Your goal is to help the user brainstorm angles, understand product benefits, and refine marketing copy based on the provided context.

${brandContext ? `\n=== UPLOADED BRAND CONTEXT ===\n${brandContext}\n` : ''}
${ragContext}

${isResiliaMode ? `\n=== RESILIA MODE ACTIVE ===
You are an expert on Resilia Oil of Oregano. Use the specialized strategic knowledge provided in the context to answer questions accurately. 
Focus on:
- Biofilm penetration
- 85% Carvacrol strength
- The "Oregano Kills, Black Seed Heals" mechanism
- Awareness level mapping\n` : ''}

Always be helpful, professional, and grounded in the facts provided. If you don't know something based on the context, say so.`

        const apiKey = process.env.XAI_API_KEY
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'grok-4-fast-reasoning',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages
                ],
                temperature: 0.7,
            }),
        })

        if (!response.ok) {
            const errorData = await response.text()
            throw new Error(`xAI Error: ${errorData}`)
        }

        const data = await response.json()
        return NextResponse.json({
            content: data.choices[0].message.content
        })

    } catch (error) {
        console.error('Chat API Error:', error)
        return NextResponse.json(
            { error: 'Failed to process chat', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding } from '@/lib/embeddings'
import { getPineconeIndex } from '@/lib/pinecone'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
    try {
        const { text, brand } = await request.json()

        if (!text || !brand) {
            return NextResponse.json({ error: 'Text and brand are required' }, { status: 400 })
        }

        console.log(`Vectorizing document for brand: ${brand}`)

        // Simple chunking logic (by paragraph or fixed size)
        // For Resilia, let's do ~1000 character chunks with some overlap
        const chunkSize = 1000
        const overlap = 200
        const chunks: string[] = []

        for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
            chunks.push(text.slice(i, i + chunkSize))
            if (i + chunkSize >= text.length) break
        }

        console.log(`Split into ${chunks.length} chunks. Generating embeddings...`)

        const pineconeIndex = getPineconeIndex()
        const vectors = []

        for (const chunk of chunks) {
            const embedding = await generateEmbedding(chunk)
            vectors.push({
                id: uuidv4(),
                values: embedding,
                metadata: {
                    content: chunk,
                    brand: brand,
                    type: 'brand-context',
                    timestamp: new Date().toISOString()
                }
            })
        }

        // Upsert in batches of 100
        for (let i = 0; i < vectors.length; i += 100) {
            const batch = vectors.slice(i, i + 100)
            await pineconeIndex.upsert(batch)
        }

        return NextResponse.json({
            success: true,
            chunkCount: chunks.length,
            message: `Successfully vectorized ${chunks.length} chunks for ${brand}`
        })

    } catch (error) {
        console.error('Vectorization Error:', error)
        return NextResponse.json(
            { error: 'Internal server error during vectorization', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

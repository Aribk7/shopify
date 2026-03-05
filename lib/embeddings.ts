import OpenAI from 'openai'

let openaiClient: OpenAI | null = null

function getOpenAI() {
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })
    }
    return openaiClient
}

/**
 * Generates an embedding for the given text using OpenAI's text-embedding-3-small model.
 * @param text The text to embed
 * @returns An array of numbers representing the embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const openai = getOpenAI()
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text.replace(/\n/g, ' '),
            encoding_format: 'float',
            dimensions: 512,
        })

        return response.data[0].embedding
    } catch (error) {
        console.error('Error generating embedding:', error)
        throw error
    }
}

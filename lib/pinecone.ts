import { Pinecone } from '@pinecone-database/pinecone'

let pcIndex: any = null

export function getPineconeIndex() {
    if (!pcIndex) {
        const pc = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!,
        })
        pcIndex = pc.index(process.env.PINECONE_INDEX!, process.env.PINECONE_HOST)
    }
    return pcIndex
}

/**
 * Searches the Pinecone index for relevant chunks based on a query embedding.
 * @param embedding The query vector
 * @param topK Number of results to return
 * @param filter Optional metadata filter
 * @returns Array of metadata (content) from the matches
 */
export async function queryVectorStore(embedding: number[], topK: number = 5, filter?: any) {
    try {
        const pineconeIndex = getPineconeIndex()
        const queryResponse = await pineconeIndex.query({
            vector: embedding,
            topK,
            filter,
            includeMetadata: true,
        })

        return queryResponse.matches.map((match: any) => match.metadata?.content as string).filter(Boolean)
    } catch (error) {
        console.error('Error querying Pinecone:', error)
        return []
    }
}

/**
 * Upserts vectors to Pinecone.
 * @param vectors Array of vectors to upsert
 */
export async function upsertVectors(vectors: any[]) {
    try {
        const pineconeIndex = getPineconeIndex()
        await pineconeIndex.upsert(vectors)
    } catch (error) {
        console.error('Error upserting vectors to Pinecone:', error)
        throw error
    }
}

/**
 * Deletes all vectors from the index.
 */
export async function deleteAllVectors() {
    try {
        const pineconeIndex = getPineconeIndex()
        await pineconeIndex.deleteAll()
        console.log('Successfully deleted all vectors from Pinecone index.')
    } catch (error) {
        console.error('Error deleting vectors from Pinecone:', error)
        throw error
    }
}

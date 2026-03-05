import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
import { generateEmbedding } from '../lib/embeddings'
import { getPineconeIndex, deleteAllVectors } from '../lib/pinecone'
import { v4 as uuidv4 } from 'uuid'

/**
 * Script to vectorize a specific file with a brand tag
 */
async function vectorizeFile(filePath: string, brand: string) {
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`)
        return
    }

    const content = fs.readFileSync(filePath, 'utf-8').trim()
    if (!content) return

    console.log(`Vectorizing ${path.basename(filePath)} for brand: ${brand}...`)

    // Chunking for large documents (like the 20-page guide)
    const chunkSize = 1500
    const overlap = 300
    const chunks: string[] = []

    for (let i = 0; i < content.length; i += (chunkSize - overlap)) {
        chunks.push(content.slice(i, i + chunkSize))
        if (i + chunkSize >= content.length) break
    }

    console.log(`Split into ${chunks.length} chunks.`)

    const pineconeIndex = getPineconeIndex()

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        try {
            const embedding = await generateEmbedding(chunk)
            await pineconeIndex.upsert({
                records: [{
                    id: `${brand}-${uuidv4()}`,
                    values: embedding,
                    metadata: {
                        filename: path.basename(filePath),
                        content: chunk,
                        brand: brand,
                        type: 'strategic-guide',
                        chunkIndex: i
                    }
                }]
            })
            console.log(`Upserted chunk ${i + 1}/${chunks.length}`)
        } catch (error) {
            console.error(`Failed chunk ${i}:`, error)
        }
    }
}

// Ensure UUID is installed
// npm install uuid
// npm install --save-dev @types/uuid

// To run: npx tsx scripts/vectorize.ts
const targetFile = path.join(process.cwd(), 'scripts', 'resilia.txt')
vectorizeFile(targetFile, 'resilia').catch(console.error)
// vectorizeAll().catch(console.error)

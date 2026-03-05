import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const inputFile = path.join(__dirname, 'static-ads', 'hello.txt')
const outputDir = path.join(__dirname, 'static-ads')

const content = fs.readFileSync(inputFile, 'utf-8')

// Match both ## LFS N and # LFS N headers (but not ### etc)
const headerRegex = /^#{1,2} LFS (\d+) — (.+)$/mg

const headers = [...content.matchAll(headerRegex)]
console.log(`Found ${headers.length} LFS scripts`)

headers.forEach((match, i) => {
    const num = String(i + 1).padStart(2, '0')
    const lfsNum = match[1]
    const title = match[2].trim()

    // Find position of this header
    const start = match.index
    // Find position of next header (or end of file)
    const nextMatch = headers[i + 1]
    const end = nextMatch ? nextMatch.index : content.length

    const sectionContent = content.slice(start, end).trim()
    const filename = `lfs-${num}.txt`
    const filepath = path.join(outputDir, filename)
    fs.writeFileSync(filepath, sectionContent)
    console.log(`✅ Written: ${filename} — LFS ${lfsNum}: ${title.substring(0, 40)}... (${sectionContent.length} chars)`)
})

console.log('\nDone! All scripts split.')

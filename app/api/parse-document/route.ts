import { NextRequest, NextResponse } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse')

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Check file type
        const type = file.type
        const validTypes = ['application/pdf', 'text/plain']

        if (!validTypes.includes(type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
            return NextResponse.json({ error: 'Invalid file format. Please upload PDF or TXT' }, { status: 400 })
        }

        let contextText = ''

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        if (type === 'application/pdf' || file.name.endsWith('.pdf')) {
            // Parse PDF
            try {
                const data = await pdfParse(buffer)
                contextText = data.text
            } catch (err) {
                console.error('Error parsing PDF:', err)
                return NextResponse.json({ error: 'Failed to extract text from PDF' }, { status: 500 })
            }
        } else {
            // Parse text
            contextText = buffer.toString('utf-8')
        }

        return NextResponse.json({
            success: true,
            text: contextText.trim(),
            filename: file.name
        })

    } catch (error) {
        console.error('Upload Error:', error)
        return NextResponse.json(
            { error: 'Internal server error processing file' },
            { status: 500 }
        )
    }
}

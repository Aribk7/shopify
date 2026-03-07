import { NextRequest, NextResponse } from 'next/server'
import { loadScripts, formatScriptsForContext } from '@/lib/loadScripts'
import { generateEmbedding } from '@/lib/embeddings'
import { queryVectorStore } from '@/lib/pinecone'

export async function POST(request: NextRequest) {
  try {
    const {
      brandName, benefit, angle,
      videoLength, aggressiveness,
      isStatic, brandContext,
      isResiliaMode, referenceTranscription,
      wordCount
    } = await request.json()

    if (!brandName) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      )
    }

    if (!benefit) {
      return NextResponse.json(
        { error: 'Benefit is required' },
        { status: 400 }
      )
    }

    if (!angle) {
      return NextResponse.json(
        { error: 'Angle is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.XAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    // 1. Get embedding for the current request (benefit + angle)
    let ragContext = ''
    try {
      const queryText = `${benefit} ${angle}`
      const queryEmbedding = await generateEmbedding(queryText)

      // If Resilia mode is active, filter for Resilia-specific vectors
      const filter = isResiliaMode ? { brand: 'resilia' } : undefined
      const relevantChunks = await queryVectorStore(queryEmbedding, isResiliaMode ? 5 : 3, filter)

      if (relevantChunks.length > 0) {
        ragContext = `\n\n=== RELEVANT SCRIPT SNIPPETS ===\n\n${relevantChunks.join('\n\n---\n\n')}\n\n`
      }
    } catch (error) {
      console.error('Error fetching RAG context:', error)
      // Fallback: will just use the standard reference scripts
    }

    // Load reference scripts from the scripts directory
    const subDir = isStatic ? 'static-ads' : 'video-scripts'
    const scripts = loadScripts(subDir)
    const referenceScripts = formatScriptsForContext(scripts, 20000) // Reduced to fit RAG context

    // Handle uploaded brand context
    const brandContextSection = brandContext?.trim()
      ? `\n\n=== BRAND CONTEXT ===\nPlease use the following information about the brand/product to inform your writing and ensure factual accuracy:\n\n${brandContext}\n\n=====================\n`
      : ''

    const resiliaPersona = isResiliaMode
      ? `\n\n=== RESILIA SPECIALIZED KNOWLEDGE ===
You are currently in RESILIA MODE. You have deep technical knowledge of the Resilia brand, its specific health benefits, scientific backing, and customer journey. 
Ensure every claim is backed by the Resilia brand context provided. Use the exact tone of voice found in the Resilia reference materials.\n`
      : ''

    // Build system prompt with reference scripts and RAG context
    const baseRole = isStatic
      ? "You are a professional copywriter specializing in high-converting long-form static ad copy for Facebook and IG. You write deep-dive, narrative-driven ads that feel authentic and non-commercial."
      : "You are a professional script writer specializing in supplement marketing scripts for video. You write engaging, compelling scripts in the exact style and format of the reference scripts provided."

    const formattingReqs = isStatic
      ? `CRITICAL FORMATTING REQUIREMENTS:
- Write in a long-form, narrative style (paragraphs)
- Do NOT use timestamps
- Use compelling headlines and body copy
- maintain an authentic, conversational voice`
      : `CRITICAL FORMATTING REQUIREMENTS:
- Every line must follow the format: "timestamp: content"
- Timestamps must be in the format "00:00-00:04" (start time-end time)
- Use realistic timestamps that progress naturally
- Each timestamp should represent approximately 2-5 seconds of spoken content`

    const systemPrompt = `${baseRole}
${resiliaPersona}

${brandContextSection}
${ragContext}
${referenceScripts}

${formattingReqs}
- Write in a conversational, authentic voice matching the reference materials
- Include emotional hooks, personal stories, and compelling narratives
- End with a strong call-to-action mentioning the brand name

When generating, match the style, tone, structure, and formatting of the reference materials exactly. Use the RELEVANT SNIPPETS provided above to inform the story and language for this specific product.`

    // Calculate target duration in seconds
    const targetDurationSeconds = (videoLength || 2.0) * 60
    const targetDurationMinutes = videoLength || 2.0
    const aggressivenessLevel = aggressiveness || 5

    // Determine aggressiveness description
    let aggressivenessDesc = ''
    if (aggressivenessLevel <= 3) {
      aggressivenessDesc = 'subtle and informative, focusing on education and gentle persuasion'
    } else if (aggressivenessLevel <= 6) {
      aggressivenessDesc = 'moderately persuasive with emotional hooks and clear benefits'
    } else if (aggressivenessLevel <= 8) {
      aggressivenessDesc = 'highly persuasive with strong emotional appeals, urgency, and compelling calls-to-action'
    } else {
      aggressivenessDesc = 'very aggressive with intense urgency, strong fear/appeal triggers, and hard-hitting calls-to-action'
    }

    // Build user prompt — different for static LFS vs video scripts
    const transcriptionContext = referenceTranscription?.trim()
      ? `\n\n=== REFERENCE TRANSCRIPTION ===\nYou have been provided with a transcription of a successful video script. Use its structure, pacing, hooks, and transitions as a model for the new script, but adapt it fully for the brand and product specified below:\n\n${referenceTranscription}\n\n===============================\n`
      : ''

    const userPrompt = isStatic
      ? `Your job is to write a new Long Form Static (LFS) ad about this product.

TARGET LENGTH: Approximately ${wordCount || 1700} words. This is a DEEP DIVE narrative. Ensure you provide enough detail, stories, and context to reach this target length while maintaining engagement.

Brand: ${brandName}
Product/Benefit: ${benefit}
Angle: ${angle}
Aggressiveness: ${aggressivenessLevel}/10 — tone should be ${aggressivenessDesc}.

The examples provided above are real, winning LFS ads. Study their structure, voice, pacing, and persuasion style — then write a brand new LFS for this product in the EXACT SAME FORMAT:


FORMAT RULES (follow precisely):
- LEAN HEAVILY on the RAG snippets and reference materials for the structure, vocabulary, and LENGTH of each line.
- Do NOT output short or thin lines. Each line must be as deep and detailed as the lines found in the reference material.
- EVERY single line must be followed by a blank line. The entire document is double-spaced, line by line.
- You may write 2-4 sentences per line to ensure each line is rich with context, as long as it matches the style of the successful examples.
- Use **bold** around the product name and key ingredient names
- Use --- on its own line between major sections
- End with 👉 [CTA link], then a blank line, then ---
- No timestamps. No section headers with ###. No bullet lists for the main body.
- Bullet lists (using -) are only allowed for ingredient breakdowns or benefit lists within a section.

The result should look exactly like the examples: dense, highly persuasive sentences where every line breathes but is packed with meaning and detail.`
      : `Create a marketing script for a supplement brand with the following details:

Brand Name: ${brandName}
Benefit: ${benefit}
Angle/Story Approach: ${angle}
Target Video Length: ${targetDurationMinutes.toFixed(1)} minutes (${targetDurationSeconds} seconds)
Aggressiveness Level: ${aggressivenessLevel}/10 - The script should be ${aggressivenessDesc}.

Generate a complete script that is approximately ${targetDurationMinutes.toFixed(1)} minutes long when spoken. Include timestamps for every line in the format "00:00-00:04: content". The final timestamp should be close to ${Math.floor(targetDurationSeconds / 60)}:${String(Math.floor(targetDurationSeconds % 60)).padStart(2, '0')}. Make it compelling, authentic, and match the style of the reference scripts. Adjust the tone and urgency based on the aggressiveness level specified.`

    const userPromptWithContext = transcriptionContext + userPrompt

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey} `,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-4-fast-reasoning',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPromptWithContext,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('xAI API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to generate script', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    const script = data.choices?.[0]?.message?.content || 'No script generated'

    return NextResponse.json({ script })
  } catch (error) {
    console.error('Error generating script:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { loadScripts, formatScriptsForContext } from '@/lib/loadScripts'

export async function POST(request: NextRequest) {
  try {
    const { brandName, benefit, angle, videoLength, aggressiveness } = await request.json()

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

    // Load reference scripts from the scripts directory
    const scripts = loadScripts()
    const referenceScripts = formatScriptsForContext(scripts, 40000) // Limit to ~40k chars to leave room for response

    // Build system prompt with reference scripts
    const systemPrompt = `You are a professional script writer specializing in supplement marketing scripts. You write engaging, compelling scripts in the exact style and format of the reference scripts provided.

${referenceScripts}

CRITICAL FORMATTING REQUIREMENTS:
- Every line must follow the format: "timestamp: content"
- Timestamps must be in the format "00:00-00:04" (start time-end time)
- Use realistic timestamps that progress naturally (e.g., 00:00-00:04, 00:04-00:08, 00:08-00:12)
- Each timestamp should represent approximately 2-5 seconds of spoken content
- Write in a conversational, authentic voice matching the reference scripts
- Include emotional hooks, personal stories, and compelling narratives
- End with a strong call-to-action mentioning the brand name

When generating scripts, match the style, tone, structure, and formatting of the reference scripts exactly.`

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

    // Build user prompt with brand details
    const userPrompt = `Create a marketing script for a supplement brand with the following details:

Brand Name: ${brandName}
Benefit: ${benefit}
Angle/Story Approach: ${angle}
Target Video Length: ${targetDurationMinutes.toFixed(1)} minutes (${targetDurationSeconds} seconds)
Aggressiveness Level: ${aggressivenessLevel}/10 - The script should be ${aggressivenessDesc}.

Generate a complete script that is approximately ${targetDurationMinutes.toFixed(1)} minutes long when spoken. Include timestamps for every line in the format "00:00-00:04: content". The final timestamp should be close to ${Math.floor(targetDurationSeconds / 60)}:${String(Math.floor(targetDurationSeconds % 60)).padStart(2, '0')}. Make it compelling, authentic, and match the style of the reference scripts. Adjust the tone and urgency based on the aggressiveness level specified.`

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-1212',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
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


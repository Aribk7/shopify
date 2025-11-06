import { NextRequest, NextResponse } from 'next/server'
import { loadScripts, formatScriptsForContext } from '@/lib/loadScripts'

export async function POST(request: NextRequest) {
  try {
    const { script, videoLength, aggressiveness } = await request.json()

    if (!script) {
      return NextResponse.json(
        { error: 'Script is required' },
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
    const referenceScripts = formatScriptsForContext(scripts, 40000)

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

    // Build system prompt with reference scripts
    const systemPrompt = `You are a professional script writer specializing in supplement marketing scripts. You create variations of existing scripts while maintaining the same style and format.

${referenceScripts}

CRITICAL FORMATTING REQUIREMENTS:
- Every line must follow the format: "timestamp: content"
- Timestamps must be in the format "00:00-00:04" (start time-end time)
- Use realistic timestamps that progress naturally
- Each timestamp should represent approximately 2-5 seconds of spoken content
- Write in a conversational, authentic voice matching the reference scripts
- Maintain the same overall structure and flow as the original script
- Adjust tone and urgency based on aggressiveness level

When creating variations, keep the core message and story but change the wording, examples, and specific details to create a fresh version.`

    // Build user prompt for variation
    const userPrompt = `Create a variation of the following script. Keep the same core message, story structure, and brand information, but rewrite it with different wording, examples, and details.

Original Script:
${script}

Target Video Length: ${targetDurationMinutes.toFixed(1)} minutes (${targetDurationSeconds} seconds)
Aggressiveness Level: ${aggressivenessLevel}/10 - The variation should be ${aggressivenessDesc}.

Generate a complete variation following the exact format of the reference scripts above. Include timestamps for every line in the format "00:00-00:04: content". The final timestamp should be close to ${Math.floor(targetDurationSeconds / 60)}:${String(Math.floor(targetDurationSeconds % 60)).padStart(2, '0')}. Make it compelling, authentic, and match the style of the reference scripts while being distinctly different from the original.`

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
            content: userPrompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 3000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('xAI API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to generate variation', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    const variation = data.choices?.[0]?.message?.content || 'No variation generated'

    return NextResponse.json({ script: variation })
  } catch (error) {
    console.error('Error generating variation:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


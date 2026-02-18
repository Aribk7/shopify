import { NextRequest, NextResponse } from 'next/server'
import { loadScripts, formatScriptsForContext } from '@/lib/loadScripts'
import { searchRedditAndAmazon } from '@/lib/webSearch'

export async function POST(request: NextRequest) {
  try {
    const { brandName, productName, aggressiveness } = await request.json()

    if (!brandName) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      )
    }

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
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
    const referenceScripts = formatScriptsForContext(scripts, 40000) // Reduced to leave room for search results

    // Search Reddit and Amazon for real user reviews and discussions
    const searchResults = await searchRedditAndAmazon(productName, brandName)
    let searchContext = ''

    if (searchResults.length > 0) {
      searchContext = `\n\n=== REAL USER REVIEWS AND DISCUSSIONS (Reddit & Amazon) ===\n\n`
      searchResults.forEach((result, index) => {
        searchContext += `${index + 1}. [${result.source.toUpperCase()}] ${result.title}\n`
        searchContext += `   ${result.snippet}\n`
        searchContext += `   Source: ${result.url}\n\n`
      })
      searchContext += `\nUse these real user reviews and discussions to understand:\n`
      searchContext += `- What problems users actually experience\n`
      searchContext += `- What conditions/symptoms they mention\n`
      searchContext += `- What language they use to describe their issues\n`
      searchContext += `- What solutions they're looking for\n\n`
    }

    // Build system prompt
    const systemPrompt = `You are an expert marketing analyst specializing in supplement advertising. You create compelling marketing angles for new supplement products.

${referenceScripts}

${searchContext}

These reference scripts are examples of EXCELLENT supplement marketing scripts with proven effective angles. Study them to understand:
- What types of problem/condition combinations work well
- How successful scripts frame problems and solutions
- What story structures and hooks are most effective
- How supplements are positioned to solve problems

${searchResults.length > 0 ? 'The real user reviews above show actual problems and language used by real customers. Use these insights to create angles that resonate with real user experiences.' : ''}

Use these scripts as inspiration and reference for creating NEW angles for a NEW product. Do NOT extract angles from these scripts - instead, create fresh, creative angles that follow the successful patterns and frameworks you see in these examples.`

    const aggressivenessLevel = aggressiveness || 5

    // Determine number of angles and tone based on aggressiveness
    let numAngles = 7 // default
    let angleTone = ''

    if (aggressivenessLevel <= 3) {
      numAngles = 5
      angleTone = 'Focus on subtle, educational, and informative angles that gently persuade without being pushy.'
    } else if (aggressivenessLevel <= 6) {
      numAngles = 7
      angleTone = 'Include a mix of moderate angles with emotional hooks and clear benefits.'
    } else if (aggressivenessLevel <= 8) {
      numAngles = 9
      angleTone = 'Prioritize highly persuasive angles with strong emotional appeals, urgency, and compelling narratives.'
    } else {
      numAngles = 10
      angleTone = 'Focus on very aggressive angles with intense urgency, strong fear/appeal triggers, and hard-hitting approaches.'
    }

    // Build user prompt
    const userPrompt = `Study the reference scripts above as examples of successful supplement marketing. These scripts demonstrate proven effective angles and frameworks.

Now create NEW, CREATIVE angles for this NEW product:

Brand Name: ${brandName}
Product: ${productName}
Aggressiveness Level: ${aggressivenessLevel}/10 - ${angleTone}

INSTRUCTIONS:
1. Study the reference scripts to understand what makes effective angles:
   - What problem/condition combinations work well together?
   - How do successful scripts frame problems and solutions?
   - What story structures and hooks are most compelling?
   - How are supplements positioned to solve problems?

2. Create NEW angles for ${productName} that follow successful patterns from the reference scripts:
   - Generate problem/condition lists that would be relevant for this product
   - Create solution angles that show how ${productName} solves these problems
   - Use similar frameworks and structures that work in the reference scripts
   - Make them creative and tailored to ${productName}, not copied from the scripts

3. Format each angle as:
   - Problem list: "condition1, condition2, condition3, condition4" (comma-separated list of related problems/conditions)
   - Solution: Brief description (1-2 sentences) of how ${productName} solves these problems

4. Calculate likelihood scores based on:
   - How well the angle follows proven frameworks from the reference scripts
   - How compelling and relevant the problem-solution pairing is
   - How well it matches the aggressiveness level

For each angle, provide:
1. A problem/condition list in the format: "condition1, condition2, condition3, condition4"
2. A brief description (1-2 sentences) of HOW ${productName} SOLVES these problems

Return your response as a JSON array with this exact format:
[
  {
    "angle": "IBS, bloating, low energy, weight gain, obesity, sugar cravings. [How ${productName} solves these problems - creative solution angle].",
    "likelihood": 85
  },
  {
    "angle": "acne, joint pain, allergies, anxiety, brain fog, and frequent colds. [How ${productName} addresses these conditions - creative solution angle].",
    "likelihood": 78
  }
]

Generate exactly ${numAngles} NEW, CREATIVE angles for ${productName}. Each angle should:
- Include a comma-separated list of related conditions/problems
- Show how ${productName} solves these problems
- Follow successful patterns from the reference scripts but be original and tailored to this product
- Match the aggressiveness level specified

Only return the JSON array, no other text.`

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
        temperature: 0.5,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('xAI API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to analyze angles', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    const responseText = data.choices?.[0]?.message?.content || '[]'

    // Parse JSON response
    let angles: Array<{ angle: string, likelihood: number }> = []
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        angles = JSON.parse(jsonMatch[0])
      } else {
        angles = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.error('Error parsing angles response:', parseError)
      // Fallback: try to extract angles manually
      return NextResponse.json(
        { error: 'Failed to parse angles response', details: responseText },
        { status: 500 }
      )
    }

    // Sort by likelihood descending
    angles.sort((a, b) => b.likelihood - a.likelihood)

    return NextResponse.json({ angles })
  } catch (error) {
    console.error('Error analyzing angles:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


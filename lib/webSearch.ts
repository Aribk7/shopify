/**
 * Search Reddit and Amazon for product reviews and discussions
 * Uses DuckDuckGo search API (free, no API key needed)
 */

export interface SearchResult {
  title: string
  url: string
  snippet: string
  source: 'reddit' | 'amazon'
}

export async function searchRedditAndAmazon(productName: string, brandName: string): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  
  try {
    // Search Reddit
    const redditQuery = `${productName} ${brandName} site:reddit.com`
    const redditResults = await searchDuckDuckGo(redditQuery, 'reddit')
    results.push(...redditResults)
    
    // Search Amazon reviews
    const amazonQuery = `${productName} ${brandName} site:amazon.com reviews`
    const amazonResults = await searchDuckDuckGo(amazonQuery, 'amazon')
    results.push(...amazonResults)
    
    return results.slice(0, 20) // Limit to 20 results total
  } catch (error) {
    console.error('Error searching Reddit and Amazon:', error)
    return []
  }
}

async function searchDuckDuckGo(query: string, source: 'reddit' | 'amazon'): Promise<SearchResult[]> {
  try {
    // Using DuckDuckGo HTML search (free, no API key)
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      return []
    }
    
    const html = await response.text()
    const results: SearchResult[] = []
    
    // Simple regex parsing (for production, consider using a proper HTML parser)
    const linkRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([^<]*)<\/a>/g
    
    let linkMatch
    const links: Array<{url: string, title: string}> = []
    
    while ((linkMatch = linkRegex.exec(html)) !== null && links.length < 10) {
      links.push({
        url: linkMatch[1],
        title: linkMatch[2]
      })
    }
    
    const snippets: string[] = []
    let snippetMatch
    while ((snippetMatch = snippetRegex.exec(html)) !== null && snippets.length < 10) {
      snippets.push(snippetMatch[1])
    }
    
    // Combine links and snippets
    for (let i = 0; i < Math.min(links.length, snippets.length); i++) {
      results.push({
        title: links[i].title,
        url: links[i].url,
        snippet: snippets[i],
        source
      })
    }
    
    return results
  } catch (error) {
    console.error(`Error searching ${source}:`, error)
    return []
  }
}

/**
 * Alternative: Use SerpAPI (requires API key) - more reliable but paid
 * Uncomment and use if you have a SerpAPI key
 */
/*
export async function searchRedditAndAmazonSerpAPI(productName: string, brandName: string): Promise<SearchResult[]> {
  const apiKey = process.env.SERP_API_KEY
  if (!apiKey) {
    console.warn('SERP_API_KEY not set, skipping web search')
    return []
  }
  
  const results: SearchResult[] = []
  
  try {
    // Search Reddit
    const redditResponse = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(`${productName} ${brandName} site:reddit.com`)}&api_key=${apiKey}`
    )
    const redditData = await redditResponse.json()
    if (redditData.organic_results) {
      redditData.organic_results.slice(0, 10).forEach((result: any) => {
        results.push({
          title: result.title,
          url: result.link,
          snippet: result.snippet || '',
          source: 'reddit'
        })
      })
    }
    
    // Search Amazon
    const amazonResponse = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(`${productName} ${brandName} site:amazon.com reviews`)}&api_key=${apiKey}`
    )
    const amazonData = await amazonResponse.json()
    if (amazonData.organic_results) {
      amazonData.organic_results.slice(0, 10).forEach((result: any) => {
        results.push({
          title: result.title,
          url: result.link,
          snippet: result.snippet || '',
          source: 'amazon'
        })
      })
    }
    
    return results
  } catch (error) {
    console.error('Error with SerpAPI search:', error)
    return []
  }
}
*/


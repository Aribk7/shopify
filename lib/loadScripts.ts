import fs from 'fs'
import path from 'path'

export interface Script {
  filename: string
  content: string
}

/**
 * Loads all script files from the scripts directory
 * @returns Array of script objects with filename and content
 */
export function loadScripts(): Script[] {
  const scriptsDir = path.join(process.cwd(), 'scripts')
  
  // Check if scripts directory exists
  if (!fs.existsSync(scriptsDir)) {
    return []
  }

  const files = fs.readdirSync(scriptsDir)
  const scripts: Script[] = []

  // Supported file extensions
  const supportedExtensions = ['.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.py', '.json']

  for (const file of files) {
    const filePath = path.join(scriptsDir, file)
    const stat = fs.statSync(filePath)

    // Only process files (not directories) and ignore hidden files
    if (stat.isFile() && !file.startsWith('.')) {
      const ext = path.extname(file).toLowerCase()
      
      // Load all files, or filter by extension if needed
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        scripts.push({
          filename: file,
          content: content.trim()
        })
      } catch (error) {
        console.error(`Error reading script file ${file}:`, error)
      }
    }
  }

  return scripts
}

/**
 * Formats scripts for inclusion in the context window
 * @param scripts Array of script objects
 * @param maxLength Maximum total length of all scripts combined (to avoid token limits)
 * @returns Formatted string of scripts
 */
export function formatScriptsForContext(scripts: Script[], maxLength: number = 50000): string {
  if (scripts.length === 0) {
    return ''
  }

  let formatted = `\n\n=== REFERENCE SCRIPTS (${scripts.length} scripts) ===\n\n`
  let totalLength = formatted.length

  for (const script of scripts) {
    const scriptSection = `--- Script: ${script.filename} ---\n${script.content}\n\n`
    
    // Check if adding this script would exceed max length
    if (totalLength + scriptSection.length > maxLength) {
      const remaining = maxLength - totalLength
      if (remaining > 100) {
        // Add a truncated version
        formatted += `--- Script: ${script.filename} (truncated) ---\n${script.content.substring(0, remaining - 50)}...\n\n`
      }
      formatted += `\n[Note: ${scripts.length - scripts.indexOf(script)} more scripts were truncated to fit context window]`
      break
    }

    formatted += scriptSection
    totalLength += scriptSection.length
  }

  formatted += `\n=== END REFERENCE SCRIPTS ===\n\n`
  formatted += `Use these reference scripts as examples of style, structure, and format when generating new scripts.\n`

  return formatted
}


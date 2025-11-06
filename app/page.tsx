'use client'

import { useState } from 'react'
import styles from './page.module.css'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'generate' | 'upload' | 'angles'>('generate')
  const [brandName, setBrandName] = useState('')
  const [productName, setProductName] = useState('')
  const [benefit, setBenefit] = useState('')
  const [angle, setAngle] = useState('')
  const [videoLength, setVideoLength] = useState(2.0) // in minutes
  const [aggressiveness, setAggressiveness] = useState(5) // 1-10 scale
  const [uploadedScript, setUploadedScript] = useState('')
  const [script, setScript] = useState('')
  const [angles, setAngles] = useState<Array<{angle: string, likelihood: number}>>([])
  const [loading, setLoading] = useState(false)
  const [loadingAngles, setLoadingAngles] = useState(false)
  const [angleStatus, setAngleStatus] = useState<string>('')
  const [error, setError] = useState('')

  const handleGenerateScript = async () => {
    if (!brandName.trim()) {
      setError('Please enter a brand name')
      return
    }
    if (!benefit.trim()) {
      setError('Please enter a benefit')
      return
    }
    if (!angle.trim()) {
      setError('Please enter an angle')
      return
    }

    setLoading(true)
    setError('')
    setScript('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          brandName: brandName.trim(),
          benefit: benefit.trim(),
          angle: angle.trim(),
          videoLength: videoLength,
          aggressiveness: aggressiveness
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate script')
      }

      setScript(data.script)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMakeVariation = async () => {
    if (!script.trim() && !uploadedScript.trim()) {
      setError('No script available to create variations')
      return
    }

    const baseScript = script || uploadedScript

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/variation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          script: baseScript,
          videoLength: videoLength,
          aggressiveness: aggressiveness
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate variation')
      }

      setScript(data.script)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleScriptPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value
    setUploadedScript(content)
    setScript(content)
    setError('')
  }

  const handleGetAngles = async () => {
    if (!brandName.trim()) {
      setError('Please enter a brand name')
      return
    }
    if (!productName.trim()) {
      setError('Please enter a product name')
      return
    }

    setLoadingAngles(true)
    setError('')
    setAngles([])
    setAngleStatus('🔍 Searching Reddit and Amazon for reviews...')

    // Simulate status updates
    const statusUpdates = [
      { delay: 500, message: '🔍 Searching Reddit and Amazon for reviews...' },
      { delay: 2000, message: '📚 Analyzing reference scripts...' },
      { delay: 3500, message: '🧠 Thinking about effective angles...' },
      { delay: 5000, message: '✍️ Writing angle recommendations...' },
      { delay: 6500, message: '🎯 Finalizing angles...' },
    ]

    let currentUpdate = 0
    const statusInterval = setInterval(() => {
      if (currentUpdate < statusUpdates.length) {
        setAngleStatus(statusUpdates[currentUpdate].message)
        currentUpdate++
      }
    }, 1500)

    try {
      const response = await fetch('/api/angles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          brandName: brandName.trim(),
          productName: productName.trim(),
          aggressiveness: aggressiveness
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get angles')
      }

      clearInterval(statusInterval)
      setAngleStatus('✅ Angles generated successfully!')
      setAngles(data.angles || [])
      
      // Clear status after a moment
      setTimeout(() => setAngleStatus(''), 2000)
    } catch (err) {
      clearInterval(statusInterval)
      setAngleStatus('')
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error:', err)
    } finally {
      setLoadingAngles(false)
    }
  }

  const handleGenerateFromAngle = async (selectedAngle: string) => {
    if (!brandName.trim()) {
      setError('Please enter a brand name')
      return
    }
    if (!productName.trim()) {
      setError('Please enter a product name')
      return
    }

    setLoading(true)
    setError('')
    setScript('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          brandName: brandName.trim(),
          benefit: productName.trim(), // Using product name as benefit
          angle: selectedAngle,
          videoLength: videoLength,
          aggressiveness: aggressiveness
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate script')
      }

      setScript(data.script)
      setActiveTab('generate') // Switch to generate tab to show result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setBrandName('')
    setProductName('')
    setBenefit('')
    setAngle('')
    setVideoLength(2.0)
    setAggressiveness(5)
    setUploadedScript('')
    setScript('')
    setAngles([])
    setError('')
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>🎬 Script Writer</h1>
        <p className={styles.subtitle}>AI-Powered Script Generator</p>

        {/* Tab Navigation */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'generate' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('generate')}
            disabled={loading}
          >
            Generate
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'upload' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('upload')}
            disabled={loading}
          >
            Upload & Vary
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'angles' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('angles')}
            disabled={loading}
          >
            Angles
          </button>
        </div>

        {activeTab === 'generate' && (
          <>
            <div className={styles.inputSection}>
          <label htmlFor="brandName" className={styles.label}>
            Supplement Brand Name
          </label>
          <input
            id="brandName"
            type="text"
            className={styles.input}
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g., Eloray, LRA, etc."
            disabled={loading}
          />
        </div>

        <div className={styles.inputSection}>
          <label htmlFor="benefit" className={styles.label}>
            Benefit
          </label>
          <textarea
            id="benefit"
            className={styles.textarea}
            value={benefit}
            onChange={(e) => setBenefit(e.target.value)}
            placeholder="e.g., Reverses arterial stiffness, clears microclots, improves blood flow..."
            rows={3}
            disabled={loading}
          />
        </div>

        <div className={styles.inputSection}>
          <label htmlFor="angle" className={styles.label}>
            Angle / Story Approach
          </label>
          <textarea
            id="angle"
            className={styles.textarea}
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            placeholder="e.g., Doctor discovers hidden truth, Amish farmer reveals secret, patient's life saved..."
            rows={3}
            disabled={loading}
          />
        </div>

        <div className={styles.inputSection}>
          <label htmlFor="videoLength" className={styles.label}>
            Video Length: {videoLength.toFixed(1)} minutes
          </label>
          <div className={styles.sliderContainer}>
            <input
              id="videoLength"
              type="range"
              min="0.5"
              max="4"
              step="0.1"
              value={videoLength}
              onChange={(e) => setVideoLength(parseFloat(e.target.value))}
              className={styles.slider}
              disabled={loading}
            />
            <div className={styles.sliderLabels}>
              <span>0.5 min</span>
              <span>4 min</span>
            </div>
          </div>
        </div>

        <div className={styles.inputSection}>
          <label htmlFor="aggressiveness" className={styles.label}>
            Ad Aggressiveness: {aggressiveness}/10
          </label>
          <div className={styles.sliderContainer}>
            <input
              id="aggressiveness"
              type="range"
              min="1"
              max="10"
              step="1"
              value={aggressiveness}
              onChange={(e) => setAggressiveness(parseInt(e.target.value))}
              className={styles.slider}
              disabled={loading}
            />
            <div className={styles.sliderLabels}>
              <span>Subtle (1)</span>
              <span>Aggressive (10)</span>
            </div>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <div className={styles.buttonGroup}>
          <button
            className={styles.button}
            onClick={handleGenerateScript}
            disabled={loading || !brandName.trim() || !benefit.trim() || !angle.trim()}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Generating...
              </>
            ) : (
              'Generate Script'
            )}
          </button>
          {(brandName || benefit || angle || script || videoLength !== 2.0 || aggressiveness !== 5) && (
            <button
              className={styles.buttonSecondary}
              onClick={handleClear}
              disabled={loading}
            >
              Clear
            </button>
          )}
        </div>
          </>
        )}

        {activeTab === 'upload' && (
          <>
            <div className={styles.inputSection}>
              <label htmlFor="scriptPaste" className={styles.label}>
                Paste Your Script
              </label>
              <textarea
                id="scriptPaste"
                className={styles.textarea}
                value={uploadedScript}
                onChange={handleScriptPaste}
                placeholder="Paste your script here... (with timestamps in format: 00:00-00:04: content)"
                rows={8}
                disabled={loading}
              />
              {uploadedScript && (
                <p className={styles.helpText}>
                  Script loaded: {uploadedScript.split('\n').length} lines
                </p>
              )}
            </div>

            <div className={styles.inputSection}>
              <label htmlFor="uploadVideoLength" className={styles.label}>
                Video Length: {videoLength.toFixed(1)} minutes
              </label>
              <div className={styles.sliderContainer}>
                <input
                  id="uploadVideoLength"
                  type="range"
                  min="0.5"
                  max="4"
                  step="0.1"
                  value={videoLength}
                  onChange={(e) => setVideoLength(parseFloat(e.target.value))}
                  className={styles.slider}
                  disabled={loading}
                />
                <div className={styles.sliderLabels}>
                  <span>0.5 min</span>
                  <span>4 min</span>
                </div>
              </div>
            </div>

            <div className={styles.inputSection}>
              <label htmlFor="uploadAggressiveness" className={styles.label}>
                Ad Aggressiveness: {aggressiveness}/10
              </label>
              <div className={styles.sliderContainer}>
                <input
                  id="uploadAggressiveness"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={aggressiveness}
                  onChange={(e) => setAggressiveness(parseInt(e.target.value))}
                  className={styles.slider}
                  disabled={loading}
                />
                <div className={styles.sliderLabels}>
                  <span>Subtle (1)</span>
                  <span>Aggressive (10)</span>
                </div>
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            <div className={styles.buttonGroup}>
              <button
                className={styles.button}
                onClick={handleMakeVariation}
                disabled={loading || !uploadedScript.trim()}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Creating Variation...
                  </>
                ) : (
                  '🔄 Make Variation'
                )}
              </button>
              {uploadedScript && (
                <button
                  className={styles.buttonSecondary}
                  onClick={() => {
                    setUploadedScript('')
                    setScript('')
                    setError('')
                  }}
                  disabled={loading}
                >
                  Clear
                </button>
              )}
            </div>
          </>
        )}

        {activeTab === 'angles' && (
          <>
            <div className={styles.inputSection}>
              <label htmlFor="anglesBrandName" className={styles.label}>
                Brand Name
              </label>
              <input
                id="anglesBrandName"
                type="text"
                className={styles.input}
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., Eloray, LRA, etc."
                disabled={loading || loadingAngles}
              />
            </div>

            <div className={styles.inputSection}>
              <label htmlFor="productName" className={styles.label}>
                Product Name
              </label>
              <input
                id="productName"
                type="text"
                className={styles.input}
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., 730 Day Aged Garlic Extract, etc."
                disabled={loading || loadingAngles}
              />
            </div>

            <div className={styles.inputSection}>
              <label htmlFor="anglesAggressiveness" className={styles.label}>
                Angle Aggressiveness: {aggressiveness}/10
              </label>
              <div className={styles.sliderContainer}>
                <input
                  id="anglesAggressiveness"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={aggressiveness}
                  onChange={(e) => setAggressiveness(parseInt(e.target.value))}
                  className={styles.slider}
                  disabled={loading || loadingAngles}
                />
                <div className={styles.sliderLabels}>
                  <span>Subtle (1)</span>
                  <span>Aggressive (10)</span>
                </div>
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            {loadingAngles && angleStatus && (
              <div className={styles.statusMessage}>
                {angleStatus}
              </div>
            )}

            <div className={styles.buttonGroup}>
              <button
                className={styles.button}
                onClick={handleGetAngles}
                disabled={loadingAngles || !brandName.trim() || !productName.trim()}
              >
                {loadingAngles ? (
                  <>
                    <span className={styles.spinner}></span>
                    Processing...
                  </>
                ) : (
                  '📊 Get Angles & Likelihood'
                )}
              </button>
              {(brandName || productName || angles.length > 0) && (
                <button
                  className={styles.buttonSecondary}
                  onClick={() => {
                    setBrandName('')
                    setProductName('')
                    setAngles([])
                    setAngleStatus('')
                    setError('')
                  }}
                  disabled={loading || loadingAngles}
                >
                  Clear
                </button>
              )}
            </div>

            {angles.length > 0 && (
              <div className={styles.anglesSection}>
                <h2 className={styles.outputTitle}>Recommended Angles & Likelihood:</h2>
                <div className={styles.anglesList}>
                  {angles.map((item, index) => (
                    <div key={index} className={styles.angleCard}>
                      <div className={styles.angleHeader}>
                        <span className={styles.angleNumber}>#{index + 1}</span>
                        <span className={styles.likelihoodBadge}>
                          {item.likelihood}% Likely
                        </span>
                      </div>
                      <p className={styles.angleText}>{item.angle}</p>
                      <button
                        className={styles.generateFromAngleButton}
                        onClick={() => handleGenerateFromAngle(item.angle)}
                        disabled={loading}
                      >
                        Generate Script
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {script && (
          <div className={styles.outputSection}>
            <h2 className={styles.outputTitle}>
              {activeTab === 'generate' ? 'Generated Script:' : 'Variation:'}
            </h2>
            <div className={styles.scriptOutput}>
              <pre className={styles.scriptText}>{script}</pre>
            </div>
            <div className={styles.outputButtons}>
              <button
                className={styles.copyButton}
                onClick={() => {
                  navigator.clipboard.writeText(script)
                  alert('Script copied to clipboard!')
                }}
              >
                📋 Copy Script
              </button>
              {activeTab === 'generate' && (
                <button
                  className={styles.variationButton}
                  onClick={handleMakeVariation}
                  disabled={loading}
                >
                  🔄 Make Variation
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}


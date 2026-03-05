'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.css'
import { useBrand } from '@/context/BrandContext'
import BrandUploader from '@/components/BrandUploader'

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
  const [angles, setAngles] = useState<Array<{ angle: string, likelihood: number }>>([])
  const [loading, setLoading] = useState(false)
  const [loadingAngles, setLoadingAngles] = useState(false)
  const [angleStatus, setAngleStatus] = useState<string>('')
  const [error, setError] = useState('')
  const { brandContext, isResiliaMode } = useBrand()

  // Auto-fill for Resilia Mode
  useEffect(() => {
    if (isResiliaMode) {
      setBrandName('Resilia')
      setProductName('Oil of Oregano')
      setBenefit('')
      setAngle('')
    }
  }, [isResiliaMode])

  const aggressivenessLabel = (v: number) =>
    v <= 3 ? 'Subtle & Educational' :
      v <= 6 ? 'Moderate Persuasion' :
        v <= 8 ? 'High Impact' :
          'Maximum Aggression'

  const aggressivenessColor = (v: number) =>
    v <= 3 ? '#4ade80' : v <= 6 ? '#facc15' : v <= 8 ? '#fb923c' : '#f87171'

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
          aggressiveness: aggressiveness,
          brandContext: brandContext.trim(),
          isResiliaMode
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
          aggressiveness: aggressiveness,
          brandContext: brandContext.trim(),
          isResiliaMode
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
          aggressiveness: aggressiveness,
          brandContext: brandContext.trim(),
          isResiliaMode
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
          aggressiveness: aggressiveness,
          brandContext: brandContext.trim(),
          isResiliaMode
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
    <div className={styles.root}>
      {/* Background effects */}
      <div className={styles.bgGrid} />
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />

      <div className={styles.wrapper}>
        {/* Top nav */}
        <nav className={styles.topNav}>
          <a href="/" className={styles.navLink}>
            <span className={styles.navDot} />
            LFS Generator
          </a>
          <a href="/video-scripts" className={`${styles.navLink} ${styles.navLinkActive}`}>
            <span className={`${styles.navDot} ${styles.navDotActive}`} />
            Video Scripts
          </a>
        </nav>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerBadge}>
            <span className={styles.headerBadgeDot} />
            Nano Banana Pro Suite
          </div>
          <h1 className={styles.title}>
            Video Script Studio
          </h1>
          <p className={styles.subtitle}>
            High-converting supplement marketing scripts for VSL and social advertising
          </p>
        </header>

        <BrandUploader />

        {/* Tab bar */}
        <div className={styles.tabBar}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'generate' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            <span className={styles.tabIcon}>✍️</span>
            Generate
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'upload' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <span className={styles.tabIcon}>🔄</span>
            Upload & Vary
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'angles' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('angles')}
          >
            <span className={styles.tabIcon}>🎯</span>
            Angles
          </button>
        </div>


        {/* Main Content Areas */}
        {activeTab === 'generate' && (
          <div className={styles.panelGrid}>
            {/* Left Panel: Configuration */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelIcon}>⚙️</span>
                <h2 className={styles.panelTitle}>Configuration</h2>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Supplement Brand Name</label>
                <input
                  className={styles.input}
                  placeholder="e.g., Eloray, LRA, etc."
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Benefit</label>
                <textarea
                  className={styles.textarea}
                  placeholder="e.g., Reverses arterial stiffness, clears microclots, improves blood flow..."
                  value={benefit}
                  onChange={(e) => setBenefit(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Angle / Story Approach</label>
                <textarea
                  className={styles.textarea}
                  placeholder="e.g., Doctor discovers hidden truth, Amish farmer reveals secret..."
                  value={angle}
                  onChange={(e) => setAngle(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sliderHeader}>
                  <label className={styles.fieldLabel}>Video Length</label>
                  <span className={styles.sliderValue}>
                    {videoLength.toFixed(1)}m
                  </span>
                </div>
                <div className={styles.sliderTrack}>
                  <input
                    type="range"
                    min="0.5"
                    max="4"
                    step="0.1"
                    value={videoLength}
                    onChange={(e) => setVideoLength(parseFloat(e.target.value))}
                    className={styles.slider}
                    disabled={loading}
                    style={{ '--thumb-color': '#ff6b35' } as React.CSSProperties}
                  />
                  <div className={styles.sliderFill} style={{
                    width: `${(videoLength - 0.5) / 3.5 * 100}%`,
                    background: '#ff6b35',
                  }} />
                </div>
                <div className={styles.sliderLabels}>
                  <span>0.5m</span>
                  <span>4.0m</span>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sliderHeader}>
                  <label className={styles.fieldLabel}>Ad Aggressiveness</label>
                  <span className={styles.sliderValue} style={{ color: aggressivenessColor(aggressiveness) }}>
                    {aggressivenessLabel(aggressiveness)}
                  </span>
                </div>
                <div className={styles.sliderTrack}>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={aggressiveness}
                    onChange={(e) => setAggressiveness(parseInt(e.target.value))}
                    className={styles.slider}
                    disabled={loading}
                    style={{ '--thumb-color': aggressivenessColor(aggressiveness) } as React.CSSProperties}
                  />
                  <div className={styles.sliderFill} style={{
                    width: `${(aggressiveness - 1) / 9 * 100}%`,
                    background: aggressivenessColor(aggressiveness),
                  }} />
                </div>
                <div className={styles.sliderLabels}>
                  <span>Subtle</span>
                  <span>Max</span>
                </div>
              </div>

              {error && <div className={styles.errorBox}>{error}</div>}

              <div className={styles.actionRow}>
                <button
                  className={styles.btnPrimary}
                  onClick={handleGenerateScript}
                  disabled={loading || !brandName.trim() || !benefit.trim() || !angle.trim()}
                >
                  {loading && <div className={styles.spinner} />}
                  {loading ? 'Generating...' : 'Generate Script'}
                </button>
                <button className={styles.btnSecondary} onClick={handleClear} disabled={loading}>
                  Clear
                </button>
              </div>
            </div>

            {/* Right Panel: Output */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelIcon}>📝</span>
                <h2 className={styles.panelTitle}>Script Result</h2>
                {script && (
                  <button
                    className={styles.panelActionBtn}
                    onClick={() => {
                      navigator.clipboard.writeText(script)
                      alert('Copied!')
                    }}
                  >
                    Copy
                  </button>
                )}
              </div>

              {loading ? (
                <div className={styles.loadingState}>
                  <div className={styles.loadingOrb} />
                  <p className={styles.loadingText}>Brewing your script...</p>
                  <p className={styles.loadingSubtext}>This will be high converting.</p>
                </div>
              ) : script ? (
                <div className={styles.scriptOutputContainer}>
                  <pre className={styles.scriptText}>{script}</pre>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>Generate a script to see it here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className={styles.panelGrid}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelIcon}>📤</span>
                <h2 className={styles.panelTitle}>Input Script</h2>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Paste Existing Script</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Paste script here... (00:00-00:04: content)"
                  value={uploadedScript}
                  onChange={handleScriptPaste}
                  disabled={loading}
                  rows={10}
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Target Variation Length</label>
                  <span className={styles.fieldValueText}>{videoLength.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4"
                  step="0.1"
                  value={videoLength}
                  onChange={(e) => setVideoLength(parseFloat(e.target.value))}
                  className={styles.slider}
                  disabled={loading}
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sliderHeader}>
                  <label className={styles.fieldLabel}>Variation Aggressiveness</label>
                  <span className={styles.sliderValue} style={{ color: aggressivenessColor(aggressiveness) }}>
                    {aggressivenessLabel(aggressiveness)}
                  </span>
                </div>
                <div className={styles.sliderTrack}>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={aggressiveness}
                    onChange={(e) => setAggressiveness(parseInt(e.target.value))}
                    className={styles.slider}
                    disabled={loading}
                    style={{ '--thumb-color': aggressivenessColor(aggressiveness) } as React.CSSProperties}
                  />
                  <div className={styles.sliderFill} style={{
                    width: `${(aggressiveness - 1) / 9 * 100}%`,
                    background: aggressivenessColor(aggressiveness),
                  }} />
                </div>
                <div className={styles.sliderLabels}>
                  <span>Subtle</span>
                  <span>Max</span>
                </div>
              </div>

              {error && <div className={styles.errorBox}>{error}</div>}

              <div className={styles.actionRow}>
                <button
                  className={styles.btnPrimary}
                  onClick={handleMakeVariation}
                  disabled={loading || !uploadedScript.trim()}
                >
                  {loading && <div className={styles.spinner} />}
                  {loading ? 'Varying...' : '🔄 Create Variation'}
                </button>
              </div>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelIcon}>✨</span>
                <h2 className={styles.panelTitle}>New Variation</h2>
              </div>

              {loading ? (
                <div className={styles.loadingState}>
                  <div className={styles.loadingOrb} />
                  <p className={styles.loadingText}>Refining variation...</p>
                </div>
              ) : script ? (
                <div className={styles.scriptOutputContainer}>
                  <pre className={styles.scriptText}>{script}</pre>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>Create a variation to see it here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'angles' && (
          <div className={styles.panelGrid}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelIcon}>🔍</span>
                <h2 className={styles.panelTitle}>Angle Research</h2>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Brand Name</label>
                <input
                  className={styles.input}
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  disabled={loadingAngles}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Product Name</label>
                <input
                  className={styles.input}
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  disabled={loadingAngles}
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sliderHeader}>
                  <label className={styles.fieldLabel}>Angle Aggressiveness</label>
                  <span className={styles.sliderValue} style={{ color: aggressivenessColor(aggressiveness) }}>
                    {aggressivenessLabel(aggressiveness)}
                  </span>
                </div>
                <div className={styles.sliderTrack}>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={aggressiveness}
                    onChange={(e) => setAggressiveness(parseInt(e.target.value))}
                    className={styles.slider}
                    disabled={loadingAngles}
                    style={{ '--thumb-color': aggressivenessColor(aggressiveness) } as React.CSSProperties}
                  />
                  <div className={styles.sliderFill} style={{
                    width: `${(aggressiveness - 1) / 9 * 100}%`,
                    background: aggressivenessColor(aggressiveness),
                  }} />
                </div>
                <div className={styles.sliderLabels}>
                  <span>Subtle</span>
                  <span>Max</span>
                </div>
              </div>

              {angleStatus && <div className={styles.statusBox}>{angleStatus}</div>}
              {error && <div className={styles.errorBox}>{error}</div>}

              <div className={styles.actionRow}>
                <button
                  className={styles.btnPrimary}
                  onClick={handleGetAngles}
                  disabled={loadingAngles || !brandName.trim() || !productName.trim()}
                >
                  {loadingAngles && <div className={styles.spinner} />}
                  {loadingAngles ? 'Researching...' : '📊 Find Marketing Angles'}
                </button>
              </div>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelIcon}>🎯</span>
                <h2 className={styles.panelTitle}>Recommended Angles</h2>
              </div>

              <div className={styles.anglesList}>
                {angles.length > 0 ? (
                  angles.map((item, index) => (
                    <div key={index} className={styles.angleCard}>
                      <div className={styles.angleCardTop}>
                        <span className={styles.angleNum}>{index + 1}</span>
                        <div className={styles.angleBar}>
                          <div
                            className={styles.angleBarFill}
                            style={{ width: `${item.likelihood}%` }}
                          />
                        </div>
                        <span className={styles.anglePct}>{item.likelihood}%</span>
                      </div>
                      <p className={styles.angleCardText}>{item.angle}</p>
                      <button
                        className={styles.useAngleBtn}
                        onClick={() => handleGenerateFromAngle(item.angle)}
                      >
                        Use this Angle
                      </button>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <p>Research angles to see recommendations.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


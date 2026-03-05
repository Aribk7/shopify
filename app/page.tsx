'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './page.module.css'
import { useBrand } from '@/context/BrandContext'
import BrandUploader from '@/components/BrandUploader'

type Tab = 'lfs' | 'image' | 'angles' | 'chat'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface Angle {
    angle: string
    likelihood: number
}

const ASPECT_RATIOS = [
    { label: '1:1 Square', value: '1:1', icon: '▪' },
    { label: '4:5 Portrait', value: '4:5', icon: '▯' },
    { label: '16:9 Landscape', value: '16:9', icon: '▭' },
    { label: '9:16 Story', value: '9:16', icon: '▮' },
]

const IMAGE_STYLES = [
    'Photorealistic',
    'Cinematic',
    'Studio Product',
    'Dark & Moody',
    'Bright & Airy',
    'Medical / Clinical',
    'Nature & Earthy',
    'Luxury Editorial',
]

export default function StaticAdsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('lfs')

    // LFS state
    const [brandName, setBrandName] = useState('')
    const [productName, setProductName] = useState('')
    const [benefit, setBenefit] = useState('')
    const [angle, setAngle] = useState('')
    const { brandContext, isResiliaMode } = useBrand()

    // Chat State
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hey! I\'m your brand assistant. Ask me anything about your context or brainstorm some ideas!' }
    ])
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Auto-fill for Resilia Mode
    useEffect(() => {
        if (isResiliaMode) {
            setBrandName('Resilia')
            setProductName('Oil of Oregano')
            setBenefit('')
            setAngle('')
        }
    }, [isResiliaMode])

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const [aggressiveness, setAggressiveness] = useState(7)
    const [script, setScript] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)

    // Angles state
    const [angles, setAngles] = useState<Angle[]>([])
    const [loadingAngles, setLoadingAngles] = useState(false)
    const [angleStatus, setAngleStatus] = useState('')

    // Image gen state
    const [imagePrompt, setImagePrompt] = useState('')
    const [imageStyle, setImageStyle] = useState('Photorealistic')
    const [imageAspect, setImageAspect] = useState('1:1')
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [imageMime, setImageMime] = useState('image/png')
    const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null)
    const [loadingImage, setLoadingImage] = useState(false)
    const [imageError, setImageError] = useState('')
    const [imageHistory, setImageHistory] = useState<Array<{ src: string; prompt: string; mime: string }>>([]
    )
    const imageRef = useRef<HTMLImageElement>(null)

    /* ── LFS Handlers ── */
    const handleGenerateLFS = async () => {
        if (!brandName.trim() || !benefit.trim() || !angle.trim()) {
            setError('Brand name, benefit, and angle are required')
            return
        }
        setLoading(true)
        setError('')
        setScript('')
        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandName: brandName.trim(),
                    benefit: benefit.trim(),
                    angle: angle.trim(),
                    brandContext: brandContext.trim(),
                    isResiliaMode,
                    videoLength: 0,
                    aggressiveness,
                    isStatic: true,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to generate')
            setScript(data.script)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleCopyScript = async () => {
        await navigator.clipboard.writeText(script)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleClear = () => {
        setBrandName('')
        setProductName('')
        setBenefit('')
        setAngle('')
        setAggressiveness(7)
        setScript('')
        setError('')
    }

    /* ── Chat Handlers ── */
    const handleSendMessage = async () => {
        if (!chatInput.trim() || chatLoading) return

        const userMsg: Message = { role: 'user', content: chatInput }
        const newMessages = [...messages, userMsg]
        setMessages(newMessages)
        setChatInput('')
        setChatLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    brandContext,
                    isResiliaMode
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error)

            setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
        } catch (err) {
            console.error(err)
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I hit a snag. Please try again.' }])
        } finally {
            setChatLoading(false)
        }
    }

    /* ── Angles Handlers ── */
    const handleGetAngles = async () => {
        if (!brandName.trim() || !productName.trim()) {
            setError('Brand name and product name are required')
            return
        }
        setLoadingAngles(true)
        setError('')
        setAngles([])
        const steps = [
            '🔍 Searching Reddit and Amazon for real reviews...',
            '📚 Analyzing reference LFS scripts...',
            '🧠 Identifying high-converting angle patterns...',
            '✍️ Ranking angles by likelihood...',
            '🎯 Finalizing recommendations...',
        ]
        let i = 0
        setAngleStatus(steps[0])
        const interval = setInterval(() => {
            i++
            if (i < steps.length) setAngleStatus(steps[i])
        }, 1500)
        try {
            const res = await fetch('/api/angles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandName: brandName.trim(),
                    productName: productName.trim(),
                    aggressiveness,
                    isStatic: true,
                }),
            })
            const data = await res.json()
            clearInterval(interval)
            if (!res.ok) throw new Error(data.error || 'Failed to get angles')
            setAngleStatus('✅ Angles ready!')
            setAngles(data.angles || [])
            setTimeout(() => setAngleStatus(''), 2000)
        } catch (err) {
            clearInterval(interval)
            setAngleStatus('')
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoadingAngles(false)
        }
    }

    const handleUseAngle = (a: string) => {
        setAngle(a)
        setActiveTab('lfs')
    }

    /* ── Image Handlers ── */
    const buildImagePrompt = () => {
        const styleMap: Record<string, string> = {
            'Photorealistic': 'photorealistic, sharp focus, professional photography',
            'Cinematic': 'cinematic lighting, anamorphic lens, film grain, dramatic atmosphere',
            'Studio Product': 'clean studio background, product photography, soft box lighting, commercial grade',
            'Dark & Moody': 'dark moody atmosphere, deep shadows, dramatic contrast, noir lighting',
            'Bright & Airy': 'bright airy aesthetic, soft natural light, pastel tones, clean and fresh',
            'Medical / Clinical': 'clinical white background, medical illustration style, infographic elements',
            'Nature & Earthy': 'natural environment, earthy tones, organic textures, botanical elements',
            'Luxury Editorial': 'luxury editorial photography, gold accents, high-end fashion magazine style',
        }
        const styleDesc = styleMap[imageStyle] || imageStyle
        const aspectNote = imageAspect === '9:16' ? ', vertical format optimized for social stories' :
            imageAspect === '16:9' ? ', wide horizontal format' :
                imageAspect === '4:5' ? ', portrait format for Instagram feed' : ''
        return `${imagePrompt.trim()}. Style: ${styleDesc}${aspectNote}. High quality, detailed, professional ad creative.`
    }

    const handleGenerateImage = async () => {
        if (!imagePrompt.trim()) {
            setImageError('Please enter an image prompt')
            return
        }
        setLoadingImage(true)
        setImageError('')
        setGeneratedImage(null)
        setExpandedPrompt(null)
        try {
            const res = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: imagePrompt.trim(),
                    style: imageStyle,
                    aspectRatio: imageAspect,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to generate image')
            const src = `data:${data.mimeType};base64,${data.imageBase64}`
            setGeneratedImage(src)
            setImageMime(data.mimeType)
            if (data.expandedPrompt) setExpandedPrompt(data.expandedPrompt)
            setImageHistory(prev => [{ src, prompt: imagePrompt.trim(), mime: data.mimeType }, ...prev.slice(0, 7)])
        } catch (err) {
            setImageError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoadingImage(false)
        }
    }

    const handleDownloadImage = () => {
        if (!generatedImage) return
        const a = document.createElement('a')
        a.href = generatedImage
        const ext = imageMime.split('/')[1] || 'png'
        a.download = `ad-creative-${Date.now()}.${ext}`
        a.click()
    }

    const aggressivenessLabel = (v: number) =>
        v <= 3 ? 'Subtle & Educational' :
            v <= 6 ? 'Moderate Persuasion' :
                v <= 8 ? 'High Impact' :
                    'Maximum Aggression'

    const aggressivenessColor = (v: number) =>
        v <= 3 ? '#4ade80' : v <= 6 ? '#facc15' : v <= 8 ? '#fb923c' : '#f87171'

    return (
        <div className={styles.root}>
            {/* Background effects */}
            <div className={styles.bgGrid} />
            <div className={styles.bgGlow1} />
            <div className={styles.bgGlow2} />

            <div className={styles.wrapper}>
                {/* Top nav */}
                <nav className={styles.topNav}>
                    <a href="/" className={`${styles.navLink} ${activeTab !== 'chat' ? styles.navLinkActive : ''}`}>
                        <span className={`${styles.navDot} ${activeTab !== 'chat' ? styles.navDotActive : ''}`} />
                        LFS Generator
                    </a>
                    <a href="/video-scripts" className={styles.navLink}>
                        <span className={styles.navDot} />
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
                        LFS Studio
                    </h1>
                    <p className={styles.subtitle}>
                        Generate high-converting long-form static ad copy &amp; AI creative imagery
                    </p>
                </header>

                <BrandUploader />

                {/* Tab bar */}
                <div className={styles.tabBar}>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'lfs' ? styles.tabBtnActive : ''}`}
                        onClick={() => setActiveTab('lfs')}
                    >
                        <span className={styles.tabIcon}>📄</span>
                        LFS Copy
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'image' ? styles.tabBtnActive : ''}`}
                        onClick={() => setActiveTab('image')}
                    >
                        <span className={styles.tabIcon}>✨</span>
                        Image Gen
                        <span className={styles.tabBadge}>Gemini</span>
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'angles' ? styles.tabBtnActive : ''}`}
                        onClick={() => setActiveTab('angles')}
                    >
                        <span className={styles.tabIcon}>🎯</span>
                        Angles
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.tabBtnActive : ''}`}
                        onClick={() => setActiveTab('chat')}
                    >
                        <span className={styles.tabIcon}>💬</span>
                        Chat
                    </button>
                </div>


                {/* ── LFS Tab ── */}
                {activeTab === 'lfs' && (
                    <div className={styles.panelGrid}>
                        {/* Left panel: inputs */}
                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <span className={styles.panelIcon}>⚙️</span>
                                <h2 className={styles.panelTitle}>Ad Configuration</h2>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Brand Name</label>
                                <input
                                    className={styles.input}
                                    placeholder="e.g. Tavio, PureHealth, LRA"
                                    value={brandName}
                                    onChange={e => setBrandName(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Product Name</label>
                                <input
                                    className={styles.input}
                                    placeholder="e.g. Castor Oil Pack, Aged Garlic Extract"
                                    value={productName}
                                    onChange={e => setProductName(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Primary Benefit</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="e.g. Dissolves parasitic biofilm, restores deep sleep, eliminates sugar cravings..."
                                    value={benefit}
                                    onChange={e => setBenefit(e.target.value)}
                                    rows={3}
                                    disabled={loading}
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Angle / Narrative Hook</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="e.g. Holistic doctor exposes what the pharmaceutical industry doesn't want you to know..."
                                    value={angle}
                                    onChange={e => setAngle(e.target.value)}
                                    rows={3}
                                    disabled={loading}
                                />
                                {angles.length > 0 && (
                                    <p className={styles.fieldHint}>
                                        💡 Switch to <button className={styles.hintLink} onClick={() => setActiveTab('angles')}>Angles tab</button> to use a generated angle
                                    </p>
                                )}
                            </div>

                            <div className={styles.fieldGroup}>
                                <div className={styles.sliderHeader}>
                                    <label className={styles.fieldLabel}>Aggressiveness</label>
                                    <span className={styles.sliderValue} style={{ color: aggressivenessColor(aggressiveness) }}>
                                        {aggressiveness}/10 — {aggressivenessLabel(aggressiveness)}
                                    </span>
                                </div>
                                <div className={styles.sliderTrack}>
                                    <input
                                        type="range"
                                        min={1}
                                        max={10}
                                        step={1}
                                        value={aggressiveness}
                                        onChange={e => setAggressiveness(parseInt(e.target.value))}
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
                                    className={styles.btnSecondary}
                                    onClick={handleGetAngles}
                                    disabled={loadingAngles || loading || !brandName.trim() || !productName.trim()}
                                >
                                    {loadingAngles ? (
                                        <><span className={styles.spinner} /> Finding Angles...</>
                                    ) : '🎯 Get Angles'}
                                </button>
                                <button
                                    className={styles.btnPrimary}
                                    onClick={handleGenerateLFS}
                                    disabled={loading || !brandName.trim() || !benefit.trim() || !angle.trim()}
                                >
                                    {loading ? (
                                        <><span className={styles.spinner} /> Generating...</>
                                    ) : '⚡ Generate LFS'}
                                </button>
                            </div>
                        </div>

                        {/* Right panel: output */}
                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <span className={styles.panelIcon}>📋</span>
                                <h2 className={styles.panelTitle}>Generated Copy</h2>
                                {script && (
                                    <button className={styles.copyBtn} onClick={handleCopyScript}>
                                        {copied ? '✓ Copied!' : '📋 Copy'}
                                    </button>
                                )}
                            </div>

                            {loading ? (
                                <div className={styles.loadingState}>
                                    <div className={styles.loadingOrb} />
                                    <p className={styles.loadingText}>Crafting your high-converting copy...</p>
                                    <p className={styles.loadingSubtext}>Using RAG + reference LFS scripts</p>
                                </div>
                            ) : script ? (
                                <div className={styles.scriptBox}>
                                    <pre className={styles.scriptText}>{script}</pre>
                                    <div className={styles.scriptActions}>
                                        <button className={styles.btnPrimary} style={{ flex: 1 }} onClick={handleCopyScript}>
                                            {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
                                        </button>
                                        <button
                                            className={styles.btnSecondary}
                                            onClick={handleGenerateLFS}
                                            disabled={loading}
                                            title="Regenerate"
                                        >
                                            🔁 Variation
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>📝</div>
                                    <p className={styles.emptyTitle}>Ready to generate</p>
                                    <p className={styles.emptyText}>Fill in the configuration and click Generate LFS. The AI will use RAG to match the style of proven reference scripts.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Image Gen Tab ── */}
                {activeTab === 'image' && (
                    <div className={styles.panelGrid}>
                        {/* Left: image controls */}
                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <span className={styles.panelIcon}>✨</span>
                                <h2 className={styles.panelTitle}>Gemini Image Generator</h2>
                                <span className={styles.geminiPill}>nano banana pro</span>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Image Prompt</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="e.g. A woman in her 50s looking energized and healthy, holding a castor oil pack, warm natural light, before-and-after health transformation..."
                                    value={imagePrompt}
                                    onChange={e => setImagePrompt(e.target.value)}
                                    rows={4}
                                    disabled={loadingImage}
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Creative Style</label>
                                <div className={styles.styleGrid}>
                                    {IMAGE_STYLES.map(s => (
                                        <button
                                            key={s}
                                            className={`${styles.styleChip} ${imageStyle === s ? styles.styleChipActive : ''}`}
                                            onClick={() => setImageStyle(s)}
                                            disabled={loadingImage}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Aspect Ratio</label>
                                <div className={styles.aspectGrid}>
                                    {ASPECT_RATIOS.map(ar => (
                                        <button
                                            key={ar.value}
                                            className={`${styles.aspectBtn} ${imageAspect === ar.value ? styles.aspectBtnActive : ''}`}
                                            onClick={() => setImageAspect(ar.value)}
                                            disabled={loadingImage}
                                        >
                                            <span className={styles.aspectIcon}>{ar.icon}</span>
                                            <span className={styles.aspectLabel}>{ar.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {imageError && <div className={styles.errorBox}>{imageError}</div>}

                            <button
                                className={styles.btnPrimary}
                                style={{ width: '100%', marginTop: 8 }}
                                onClick={handleGenerateImage}
                                disabled={loadingImage || !imagePrompt.trim()}
                            >
                                {loadingImage ? (
                                    <><span className={styles.spinner} /> Generating with Gemini...</>
                                ) : '✨ Generate Image'}
                            </button>

                            {/* History strip */}
                            {imageHistory.length > 0 && (
                                <div className={styles.historySection}>
                                    <label className={styles.fieldLabel}>Recent Generations</label>
                                    <div className={styles.historyStrip}>
                                        {imageHistory.map((item, idx) => (
                                            <button
                                                key={idx}
                                                className={styles.historyThumb}
                                                onClick={() => {
                                                    setGeneratedImage(item.src)
                                                    setImagePrompt(item.prompt)
                                                    setImageMime(item.mime)
                                                }}
                                                title={item.prompt}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={item.src} alt={item.prompt} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: image output */}
                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <span className={styles.panelIcon}>🖼️</span>
                                <h2 className={styles.panelTitle}>Output</h2>
                                {generatedImage && (
                                    <button className={styles.copyBtn} onClick={handleDownloadImage}>
                                        ⬇ Download
                                    </button>
                                )}
                            </div>

                            {loadingImage ? (
                                <div className={styles.loadingState}>
                                    <div className={styles.geminiOrb} />
                                    <p className={styles.loadingText}>Gemini is creating your image...</p>
                                    <p className={styles.loadingSubtext}>Using Gemini 2.0 Flash image generation</p>
                                </div>
                            ) : generatedImage ? (
                                <div className={styles.imageOutput}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img ref={imageRef} src={generatedImage} alt="Generated" className={styles.generatedImage} />
                                    {expandedPrompt ? (
                                        <details className={styles.expandedPromptDetails}>
                                            <summary className={styles.expandedPromptSummary}>✨ AI-expanded prompt</summary>
                                            <p className={styles.expandedPromptText}>{expandedPrompt}</p>
                                        </details>
                                    ) : (
                                        <div className={styles.imagePromptLabel}>{imagePrompt}</div>
                                    )}
                                    <div className={styles.scriptActions}>
                                        <button className={styles.btnPrimary} style={{ flex: 1 }} onClick={handleDownloadImage}>
                                            ⬇ Download Image
                                        </button>
                                        <button className={styles.btnSecondary} onClick={handleGenerateImage} disabled={loadingImage}>
                                            🔁 Regenerate
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyGeminiIcon}>✨</div>
                                    <p className={styles.emptyTitle}>No image generated yet</p>
                                    <p className={styles.emptyText}>
                                        Write a prompt, choose a style and aspect ratio, then hit Generate. Powered by Gemini 2.0 Flash.
                                    </p>
                                    <div className={styles.geminiInfoCards}>
                                        <div className={styles.geminiCard}>
                                            <span>🧠</span>
                                            <span>Gemini 2.0 Flash</span>
                                        </div>
                                        <div className={styles.geminiCard}>
                                            <span>🎨</span>
                                            <span>8 Style Presets</span>
                                        </div>
                                        <div className={styles.geminiCard}>
                                            <span>📐</span>
                                            <span>4 Aspect Ratios</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Angles Tab ── */}
                {activeTab === 'angles' && (
                    <div className={styles.panelGrid}>
                        {/* Left: angle finder */}
                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <span className={styles.panelIcon}>🎯</span>
                                <h2 className={styles.panelTitle}>Angle Finder</h2>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Brand Name</label>
                                <input
                                    className={styles.input}
                                    placeholder="e.g. Tavio"
                                    value={brandName}
                                    onChange={e => setBrandName(e.target.value)}
                                    disabled={loadingAngles}
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Product Name</label>
                                <input
                                    className={styles.input}
                                    placeholder="e.g. Castor Oil Pack"
                                    value={productName}
                                    onChange={e => setProductName(e.target.value)}
                                    disabled={loadingAngles}
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <div className={styles.sliderHeader}>
                                    <label className={styles.fieldLabel}>Angle Aggressiveness</label>
                                    <span className={styles.sliderValue} style={{ color: aggressivenessColor(aggressiveness) }}>
                                        {aggressiveness}/10
                                    </span>
                                </div>
                                <div className={styles.sliderTrack}>
                                    <input
                                        type="range"
                                        min={1}
                                        max={10}
                                        step={1}
                                        value={aggressiveness}
                                        onChange={e => setAggressiveness(parseInt(e.target.value))}
                                        className={styles.slider}
                                        disabled={loadingAngles}
                                        style={{ '--thumb-color': aggressivenessColor(aggressiveness) } as React.CSSProperties}
                                    />
                                </div>
                            </div>

                            {error && <div className={styles.errorBox}>{error}</div>}
                            {angleStatus && <div className={styles.statusBox}>{angleStatus}</div>}

                            <button
                                className={styles.btnPrimary}
                                style={{ width: '100%' }}
                                onClick={handleGetAngles}
                                disabled={loadingAngles || !brandName.trim() || !productName.trim()}
                            >
                                {loadingAngles ? (
                                    <><span className={styles.spinner} /> Researching...</>
                                ) : '🔍 Find Winning Angles'}
                            </button>
                        </div>

                        {/* Right: angle results */}
                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <span className={styles.panelIcon}>📊</span>
                                <h2 className={styles.panelTitle}>Recommended Angles</h2>
                                {angles.length > 0 && (
                                    <span className={styles.countBadge}>{angles.length} angles</span>
                                )}
                            </div>

                            {loadingAngles ? (
                                <div className={styles.loadingState}>
                                    <div className={styles.loadingOrb} />
                                    <p className={styles.loadingText}>{angleStatus || 'Researching angles...'}</p>
                                    <p className={styles.loadingSubtext}>Scanning Reddit, Amazon, and reference scripts</p>
                                </div>
                            ) : angles.length > 0 ? (
                                <div className={styles.anglesList}>
                                    {angles.map((item, i) => (
                                        <div key={i} className={styles.angleCard}>
                                            <div className={styles.angleCardTop}>
                                                <span className={styles.angleNum}>#{i + 1}</span>
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
                                                onClick={() => handleUseAngle(item.angle)}
                                            >
                                                Use This Angle →
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>🎯</div>
                                    <p className={styles.emptyTitle}>No angles generated yet</p>
                                    <p className={styles.emptyText}>Enter your brand and product name, then click &quot;Find Winning Angles&quot;. The AI will research customer reviews and proven LFS patterns to suggest the highest-converting narratives.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'chat' && (
                    <div className={styles.panel} style={{ maxWidth: '900px', margin: '0 auto', height: '600px', display: 'flex', flexDirection: 'column' }}>
                        <div className={styles.panelHeader}>
                            <span className={styles.panelIcon}>💬</span>
                            <h2 className={styles.panelTitle}>Brand Chat Assistant</h2>
                        </div>

                        <div id="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {messages.map((msg, i) => (
                                <div key={i} style={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '80%',
                                    padding: '12px 16px',
                                    borderRadius: '16px',
                                    background: msg.role === 'user' ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                                    color: msg.role === 'user' ? '#fff' : '#eee',
                                    border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                    lineHeight: '1.5',
                                    fontSize: '0.95rem'
                                }}>
                                    {msg.content}
                                </div>
                            ))}
                            {chatLoading && (
                                <div style={{ alignSelf: 'flex-start', padding: '12px 16px' }}>
                                    <div className={styles.spinner} />
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '12px' }}>
                            <input
                                className={styles.input}
                                placeholder="Message your context..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                style={{ flex: 1, marginBottom: 0 }}
                            />
                            <button
                                className={styles.btnPrimary}
                                onClick={handleSendMessage}
                                disabled={chatLoading}
                                style={{ width: 'auto', padding: '0 24px' }}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

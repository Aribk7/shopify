'use client'

import React, { useRef } from 'react'
import { useBrand } from '@/context/BrandContext'
import styles from '@/app/page.module.css'

export default function BrandUploader() {
    const {
        brandContext, setBrandContext,
        fileName, setFileName,
        isUploading, setIsUploading,
        isResiliaMode, setIsResiliaMode
    } = useBrand()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isVectorizing, setIsVectorizing] = React.useState(false)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        setFileName(file.name)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch('/api/parse-document', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to parse file')
            }

            setBrandContext(data.text)
        } catch (err) {
            console.error(err)
            alert(err instanceof Error ? err.message : 'Error uploading file')
            setFileName(null)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleVectorize = async () => {
        if (!brandContext) return
        setIsVectorizing(true)

        try {
            const response = await fetch('/api/vectorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: brandContext,
                    brand: 'resilia'
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error)

            alert(data.message)
            setIsResiliaMode(true)
        } catch (err) {
            console.error(err)
            alert('Failed to vectorize: ' + (err instanceof Error ? err.message : 'Unknown error'))
        } finally {
            setIsVectorizing(false)
        }
    }

    const resiliaColor = '#06b6d4' // Cyan

    return (
        <div
            className={`${styles.brandContextSection} ${isResiliaMode ? styles.resiliaActive : ''}`}
            style={{
                marginBottom: '24px',
                borderColor: isResiliaMode ? resiliaColor : undefined,
                boxShadow: isResiliaMode ? `0 0 20px ${resiliaColor}22` : undefined
            }}
        >
            <div className={styles.brandContextPanel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div>
                            <h3 className={styles.fieldLabel} style={{ marginBottom: '4px', color: isResiliaMode ? resiliaColor : undefined }}>
                                {isResiliaMode ? '⚡ RESILIA MODE ACTIVE' : 'Global Brand Context'}
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: '#666' }}>
                                {isResiliaMode
                                    ? 'Using high-accuracy vectorized context for Resilia.'
                                    : 'Upload PDF or TXT to ground the AI in facts across the whole site.'}
                            </p>
                        </div>

                        {/* Resilia Toggle */}
                        <div
                            onClick={() => setIsResiliaMode(!isResiliaMode)}
                            style={{
                                cursor: 'pointer',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                background: isResiliaMode ? resiliaColor : 'rgba(255,255,255,0.05)',
                                color: isResiliaMode ? '#000' : '#888',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                transition: 'all 0.2s',
                                border: `1px solid ${isResiliaMode ? resiliaColor : 'rgba(255,255,255,0.1)'}`
                            }}
                        >
                            {isResiliaMode ? 'ON' : 'OFF'} Resilia
                        </div>
                    </div>

                    {brandContext && !isResiliaMode && (
                        <div className={styles.sliderValue} style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', borderColor: 'rgba(74, 222, 128, 0.2)' }}>
                            ✓ Context Active ({brandContext.length} chars)
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf,.txt"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        disabled={isUploading || isVectorizing}
                    />
                    <button
                        className={styles.btnSecondary}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isVectorizing}
                        style={{
                            flex: 1,
                            borderColor: isResiliaMode ? `${resiliaColor}44` : undefined,
                            color: isResiliaMode ? resiliaColor : undefined
                        }}
                    >
                        {isUploading ? (
                            <><span className={styles.spinner} /> Parsing...</>
                        ) : fileName ? (
                            `📄 ${fileName}`
                        ) : (
                            '📤 Upload Brand Doc'
                        )}
                    </button>

                    {brandContext && !isResiliaMode && (
                        <button
                            className={styles.btnPrimary}
                            onClick={handleVectorize}
                            disabled={isVectorizing}
                            style={{
                                background: `linear-gradient(135deg, ${resiliaColor} 0%, #0891b2 100%)`,
                                boxShadow: `0 4px 15px ${resiliaColor}33`
                            }}
                        >
                            {isVectorizing ? 'Vectorizing...' : '⚡ Vectorize Resilia'}
                        </button>
                    )}

                    {brandContext && (
                        <button
                            className={styles.btnSecondary}
                            onClick={() => {
                                setBrandContext('')
                                setFileName(null)
                                setIsResiliaMode(false)
                            }}
                            style={{ border: '1px solid rgba(248, 113, 113, 0.2)', color: '#f87171' }}
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface BrandContextType {
    brandContext: string
    setBrandContext: (context: string) => void
    fileName: string | null
    setFileName: (name: string | null) => void
    isUploading: boolean
    setIsUploading: (uploading: boolean) => void
    isResiliaMode: boolean
    setIsResiliaMode: (mode: boolean) => void
}

const BrandContext = createContext<BrandContextType | undefined>(undefined)

export function BrandProvider({ children }: { children: ReactNode }) {
    const [brandContext, setBrandContext] = useState<string>('')
    const [fileName, setFileName] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState<boolean>(false)
    const [isResiliaMode, setIsResiliaMode] = useState<boolean>(false)

    // Load Resilia Mode from localStorage on mount
    React.useEffect(() => {
        const saved = localStorage.getItem('resiliaMode')
        if (saved === 'true') setIsResiliaMode(true)
    }, [])

    const toggleResiliaMode = (val: boolean) => {
        setIsResiliaMode(val)
        localStorage.setItem('resiliaMode', val ? 'true' : 'false')
    }

    return (
        <BrandContext.Provider value={{
            brandContext,
            setBrandContext,
            fileName,
            setFileName,
            isUploading,
            setIsUploading,
            isResiliaMode,
            setIsResiliaMode: toggleResiliaMode
        }}>
            {children}
        </BrandContext.Provider>
    )
}

export function useBrand() {
    const context = useContext(BrandContext)
    if (context === undefined) {
        throw new Error('useBrand must be used within a BrandProvider')
    }
    return context
}

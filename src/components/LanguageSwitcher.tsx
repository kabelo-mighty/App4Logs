import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAriaLiveRegion } from '../hooks/useAccessibility'

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation()
  const { announce } = useAriaLiveRegion()
  const [highContrast, setHighContrast] = useState(() => {
    const stored = localStorage.getItem('highContrast')
    return stored ? JSON.parse(stored) : window.matchMedia('(prefers-contrast: more)').matches
  })

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
  ]

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
    announce(`Language changed to ${languages.find(l => l.code === lang)?.name}`)
  }

  const handleHighContrastToggle = () => {
    const newValue = !highContrast
    setHighContrast(newValue)
    localStorage.setItem('highContrast', JSON.stringify(newValue))
    
    // Update document class for high contrast
    if (newValue) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
    
    announce(newValue ? 'High contrast mode enabled' : 'High contrast mode disabled')
  }

  React.useEffect(() => {
    // Apply high contrast mode on mount
    if (highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }, [])

  return (
    <div 
      className="flex items-center gap-3 bg-white bg-opacity-20 backdrop-blur-lg px-4 py-2 rounded-lg border border-white border-opacity-30"
      role="group"
      aria-label="Accessibility and language controls"
    >
      {/* Language Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="language-select" className="sr-only">Select Language</label>
        <svg 
          className="w-5 h-5 text-white" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1 4.5 4.5 0 11-4.814 6.5c.25.065.5.1.75.1z" />
        </svg>
        <select
          id="language-select"
          value={i18n.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-transparent text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 px-2 py-1 rounded cursor-pointer"
          aria-label="Select interface language"
        >
          {languages.map(lang => (
            <option 
              key={lang.code} 
              value={lang.code} 
              className="bg-gray-900"
            >
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* High Contrast Toggle */}
      <button
        onClick={handleHighContrastToggle}
        className={`p-2 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 ${
          highContrast 
            ? 'bg-white bg-opacity-30 text-yellow-300' 
            : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
        }`}
        aria-label={highContrast ? 'High contrast mode enabled, click to disable' : 'High contrast mode disabled, click to enable'}
        aria-pressed={highContrast}
        title={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
      >
        <svg 
          className="w-5 h-5" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM3.707 9.293a1 1 0 000 1.414l5.586 5.586a1 1 0 001.414-1.414L5.414 10l4.293-4.293a1 1 0 00-1.414-1.414L3.707 9.293z" />
        </svg>
      </button>
    </div>
  )
}

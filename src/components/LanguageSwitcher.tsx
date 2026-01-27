import React from 'react'
import { useTranslation } from 'react-i18next'

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation()

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
  }

  return (
    <div className="flex items-center gap-3 bg-white bg-opacity-20 backdrop-blur-lg px-4 py-2 rounded-lg border border-white border-opacity-30">
      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1 4.5 4.5 0 11-4.814 6.5c.25.065.5.1.75.1z" />
      </svg>
      <select
        value={i18n.language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="bg-transparent text-white font-semibold text-sm focus:outline-none cursor-pointer"
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code} className="bg-gray-900">{lang.name}</option>
        ))}
      </select>
    </div>
  )
}

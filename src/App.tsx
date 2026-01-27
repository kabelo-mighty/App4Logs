import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { LogEntry } from './types'
import { FileUpload } from './components/FileUpload'
import { FilterPanel } from './components/FilterPanel'
import { Statistics } from './components/Statistics'
import { LogViewer } from './components/LogViewer'
import { ExportButtons } from './components/ExportButtons'
import { LanguageSwitcher } from './components/LanguageSwitcher'

function App() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)

  const handleLogsLoaded = useCallback((newLogs: LogEntry[]) => {
    setLogs(newLogs)
    setFilteredLogs(newLogs)
    setHasLoaded(true)
  }, [])

  const handleFilterChange = useCallback((filtered: LogEntry[]) => {
    setFilteredLogs(filtered)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">{t('title')}</h1>
                <p className="text-blue-100 mt-1">{t('subtitle')}</p>
              </div>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            <FileUpload onLogsLoaded={handleLogsLoaded} />
          </div>

          {/* Main Content - Show only if logs are loaded */}
          {hasLoaded && logs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar - Filters */}
              <div className="lg:col-span-1">
                <FilterPanel logs={logs} onFilterChange={handleFilterChange} />
              </div>

              {/* Main Content - Logs and Statistics */}
              <div className="lg:col-span-3 space-y-6">
                {/* Statistics */}
                <Statistics logs={filteredLogs} />

                {/* Log Viewer */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      Logs <span className="text-blue-600">({filteredLogs.length}</span> / <span className="text-gray-600">{logs.length})</span>
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold">
                        {Math.round((filteredLogs.length / logs.length) * 100)}% shown
                      </div>
                    </div>
                  </div>
                  <LogViewer logs={filteredLogs} />
                </div>

                {/* Export Buttons */}
                {filteredLogs.length > 0 && (
                  <ExportButtons logs={filteredLogs} />
                )}
              </div>
            </div>
          ) : null}

          {/* Empty State Message */}
          {hasLoaded && logs.length === 0 && (
            <div className="bg-white rounded-lg shadow-xl p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-900 mt-4">{t('noLogs')}</p>
              <p className="text-gray-600 mt-2">Upload a log file to get started</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-bold mb-3">Supported Formats</h3>
              <ul className="text-slate-400 text-sm space-y-1">
                <li>✓ JSON</li>
                <li>✓ CSV</li>
                <li>✓ XML</li>
                <li>✓ Plain Text</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-3">Frameworks</h3>
              <ul className="text-slate-400 text-sm space-y-1">
                <li>✓ Java (Log4j, SLF4j)</li>
                <li>✓ Node.js/Express</li>
                <li>✓ Python</li>
                <li>✓ Ruby on Rails</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-3">Features</h3>
              <ul className="text-slate-400 text-sm space-y-1">
                <li>✓ Advanced Filtering</li>
                <li>✓ Real-time Analytics</li>
                <li>✓ Export (JSON/CSV)</li>
                <li>✓ Multi-language</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400 text-sm">
            <p>Log Analyzer v1.0</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

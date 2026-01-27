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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600 mt-1">{t('subtitle')}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow p-6">
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
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Logs ({filteredLogs.length} / {logs.length})
                  </h3>
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
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-lg text-gray-600">{t('noLogs')}</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-600 text-sm">
          <p>Log Analyzer v1.0 | Supports JSON, CSV, XML, and plain text formats</p>
        </div>
      </footer>
    </div>
  )
}

export default App

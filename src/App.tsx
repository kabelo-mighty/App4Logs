import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LogEntry, StreamingConfig } from './types'
import { FileUpload } from './components/FileUpload'
import { RealtimeLogInput } from './components/RealtimeLogInput'
import { FilterPanel } from './components/FilterPanel'
import { Statistics } from './components/Statistics'
import { PaginatedLogViewer } from './components/PaginatedLogViewer'
import { ExportButtons } from './components/ExportButtons'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initErrorTracking, logUserAction, markPerformance, measurePerformance } from './utils/telemetry'
import { usePageTitle, useSkipLink, useAriaLiveRegion } from './hooks/useAccessibility'
import { announceContentChange } from './utils/accessibility'
import { useRealtimeLogStream } from './hooks/useRealtimeLogStream'

function AppContent() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<'upload' | 'realtime'>('upload')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { announcement, announce } = useAriaLiveRegion()
  const { handleSkipClick } = useSkipLink('main-content')

  // Real-time log streaming hook
  const realtimeStream = useRealtimeLogStream((newLogs) => {
    setLogs(prevLogs => {
      const updated = [...prevLogs, ...newLogs]
      // Limit total logs in UI to 1000 for performance
      return updated.length > 1000 ? updated.slice(-1000) : updated
    })
    announceContentChange(newLogs.length.toString(), 'logs_loaded')
    announce(`Received ${newLogs.length} new log entries`)
  }, 10000)

  // Set page title for screen readers
  usePageTitle('Log Analyzer - WCAG 2.1 Accessible Log Analysis Tool')

  // Initialize error tracking on mount
  useEffect(() => {
    initErrorTracking()
    markPerformance('app-mount')
    logUserAction('app_loaded')

    return () => {
      measurePerformance('app-session', 'app-mount', 'app-unmount')
    }
  }, [])

  const handleLogsLoaded = useCallback((newLogs: LogEntry[]) => {
    try {
      markPerformance('logs-load-start')
      setLogs(newLogs)
      setFilteredLogs(newLogs)
      setHasLoaded(true)
      logUserAction('logs_uploaded', {
        count: newLogs.length,
      })
      // Announce to screen readers
      announceContentChange(newLogs.length.toString(), 'logs_loaded')
      announce(`${newLogs.length} logs loaded successfully`)
      measurePerformance('logs-load', 'logs-load-start', 'logs-load-end')
    } catch (error) {
      logUserAction('logs_upload_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      announce(error instanceof Error ? error.message : 'Error loading logs')
      throw error
    }
  }, [announce])

  const handleFilterChange = useCallback((filtered: LogEntry[]) => {
    try {
      setFilteredLogs(filtered)
      logUserAction('filters_applied', {
        resultCount: filtered.length,
        totalCount: logs.length,
      })
      // Announce to screen readers
      announceContentChange(filtered.length.toString(), 'filters_applied')
      announce(`${filtered.length} logs shown after applying filters`)
    } catch (error) {
      logUserAction('filter_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      announce(error instanceof Error ? error.message : 'Error applying filters')
      throw error
    }
  }, [logs.length, announce])

  const handleRealtimeConnect = useCallback(async (config: StreamingConfig) => {
    try {
      setHasLoaded(true)
      setLogs([])
      setFilteredLogs([])
      await realtimeStream.connect(config)
      announce('Connected to real-time log stream')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      announce(`Failed to connect: ${err.message}`)
    }
  }, [realtimeStream, announce])

  const handleRealtimeDisconnect = useCallback(() => {
    realtimeStream.disconnect()
    announce('Disconnected from real-time log stream')
  }, [realtimeStream, announce])

  // Update filtered logs when main logs change
  useEffect(() => {
    if (realtimeStream.status.isConnected) {
      setFilteredLogs(logs)
    }
  }, [logs, realtimeStream.status.isConnected])

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col">
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        onClick={(e) => {
          e.preventDefault()
          handleSkipClick()
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-500 focus:text-white focus:px-4 focus:py-2 focus:rounded"
        tabIndex={0}
      >
        {t('skipToMainContent') || 'Skip to main content'}
      </a>

      {/* Aria Live Region for announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Kibana-style Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-zinc-800 border-r border-zinc-700 transition-all duration-300 overflow-y-auto flex flex-col`}>
          {/* Sidebar Header */}
          <div className="h-16 flex items-center px-6 border-b border-zinc-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black font-bold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
                </svg>
              </div>
              <span className="text-white font-bold text-sm">App4Logs</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-3 py-6 space-y-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Logs
            </button>

            <button
              onClick={() => setActiveTab('realtime')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'realtime'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Real-time Stream
            </button>

            {hasLoaded && logs.length > 0 && (
              <>
                <div className="my-4 border-t border-zinc-700" />
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Analytics</p>
                </div>
              </>
            )}
          </nav>

          {/* Sidebar Footer */}
          <div className="px-3 py-4 border-t border-zinc-700">
            <LanguageSwitcher />
          </div>
        </aside>

        {/* Main Content Area */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-zinc-900" role="main">
          {/* Top Header Bar */}
          <header className="h-16 bg-zinc-800 border-b border-zinc-700 flex items-center px-8 sticky top-0 z-10">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-300 mr-4"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex-1">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Log Analyzer</span>
                {realtimeStream.status.isConnected && (
                  <span className="flex items-center gap-1 text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Live
                  </span>
                )}
              </h1>
            </div>

            <div className="text-sm text-zinc-400">
              {hasLoaded && logs.length > 0 && (
                <span>{logs.length} logs loaded</span>
              )}
            </div>
          </header>

          {/* Content Area */}
          <div className="p-8">
            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Upload Log Files</h2>
                  <p className="text-zinc-400">Import logs from your applications for analysis</p>
                </div>

                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-8 shadow-xl">
                  <FileUpload onLogsLoaded={handleLogsLoaded} />
                </div>
              </div>
            )}

            {/* Real-time Tab */}
            {activeTab === 'realtime' && (
              <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Real-time Log Streaming</h2>
                  <p className="text-zinc-400">Connect to an API endpoint to stream logs in real-time</p>
                </div>

                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-8 shadow-xl">
                  <RealtimeLogInput
                    onConnect={handleRealtimeConnect}
                    isConnecting={realtimeStream.status.isLoading}
                    isConnected={realtimeStream.status.isConnected}
                    error={realtimeStream.status.error}
                    onDisconnect={handleRealtimeDisconnect}
                  />
                </div>
              </div>
            )}

            {/* Logs Display Area */}
            {hasLoaded && logs.length > 0 && (
              <div className="mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                  {/* Sidebar - Filters */}
                  <div className="lg:col-span-1">
                    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 shadow-lg">
                      <FilterPanel logs={logs} onFilterChange={handleFilterChange} />
                    </div>
                  </div>

                  {/* Main Content - Logs and Statistics */}
                  <div className="lg:col-span-3 space-y-6">
                    {/* Statistics */}
                    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 shadow-lg">
                      <Statistics logs={filteredLogs} />
                    </div>

                    {/* Log Viewer */}
                    <div className="bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden">
                      <div className="p-6 border-b border-zinc-700">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-white">
                            Logs <span className="text-blue-400">({filteredLogs.length}</span> / <span className="text-zinc-400">{logs.length})</span>
                          </h3>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="inline-flex items-center px-3 py-1 bg-blue-900 text-blue-300 rounded-full font-semibold border border-blue-700">
                              {logs.length > 0 ? Math.round((filteredLogs.length / logs.length) * 100) : 0}% shown
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 bg-zinc-900">
                        <PaginatedLogViewer logs={filteredLogs} itemsPerPage={50} />
                      </div>
                    </div>

                    {/* Export Buttons */}
                    {filteredLogs.length > 0 && (
                      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 shadow-lg">
                        <ExportButtons logs={filteredLogs} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!hasLoaded && activeTab === 'upload' && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-16 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-900 rounded-lg mb-4">
                    <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-xl font-bold text-white mt-4">No logs loaded</p>
                  <p className="text-zinc-400 mt-2">Upload a log file or connect to a real-time stream to get started</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

// Wrap the main app component with ErrorBoundary
function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}

export default App

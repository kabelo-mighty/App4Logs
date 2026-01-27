import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { LogEntry } from '../types'
import { useKeyboardNavigation, useAriaLiveRegion } from '../hooks/useAccessibility'
import { announceContentChange } from '../utils/accessibility'

interface ExportProps {
  logs: LogEntry[]
}

export const ExportButtons: React.FC<ExportProps> = React.memo(({ logs }) => {
  const { t } = useTranslation()
  const { announce } = useAriaLiveRegion()

  const downloadFile = useCallback((blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }, [])

  const exportAsJSON = useCallback(() => {
    announceContentChange(logs.length.toString(), 'export_started')
    announce(`Exporting ${logs.length} logs as JSON`)
    const dataStr = JSON.stringify(logs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    downloadFile(dataBlob, `logs-${Date.now()}.json`)
    announce('JSON export completed successfully')
  }, [logs, downloadFile, announce])

  const exportAsCSV = useCallback(() => {
    announceContentChange(logs.length.toString(), 'export_started')
    announce(`Exporting ${logs.length} logs as CSV`)
    const headers = ['ID', 'Timestamp', 'Level', 'Source', 'Message']
    const rows = logs.map(log => [
      log.id,
      log.timestamp,
      log.level,
      log.source,
      `"${log.message.replace(/"/g, '""')}"`,
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n')

    const dataBlob = new Blob([csv], { type: 'text/csv' })
    downloadFile(dataBlob, `logs-${Date.now()}.csv`)
    announce('CSV export completed successfully')
  }, [logs, downloadFile, announce])

  const { handleKeyDown: handleJSONKeyDown } = useKeyboardNavigation(exportAsJSON)
  const { handleKeyDown: handleCSVKeyDown } = useKeyboardNavigation(exportAsCSV)

  return (
    <div className="flex gap-3" role="group" aria-label="Export options">
      <button
        onClick={exportAsJSON}
        onKeyDown={handleJSONKeyDown}
        aria-label={`Export ${logs.length} logs as JSON file`}
        title={`Export all ${logs.length} logs to JSON format`}
        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold text-sm shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-6-4m6 4l6-4" />
        </svg>
        {t('exportJSON') || 'Export JSON'}
      </button>
      <button
        onClick={exportAsCSV}
        onKeyDown={handleCSVKeyDown}
        aria-label={`Export ${logs.length} logs as CSV file`}
        title={`Export all ${logs.length} logs to CSV format`}
        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-semibold text-sm shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-6-4m6 4l6-4" />
        </svg>
        {t('exportCSV') || 'Export CSV'}
      </button>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if logs changed
  return prevProps.logs === nextProps.logs
})

ExportButtons.displayName = 'ExportButtons'

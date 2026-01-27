import React, { useCallback } from 'react'
import { LogEntry } from '../types'

interface ExportProps {
  logs: LogEntry[]
}

export const ExportButtons: React.FC<ExportProps> = React.memo(({ logs }) => {
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
    const dataStr = JSON.stringify(logs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    downloadFile(dataBlob, `logs-${Date.now()}.json`)
  }, [logs, downloadFile])

  const exportAsCSV = useCallback(() => {
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
  }, [logs, downloadFile])

  return (
    <div className="flex gap-3">
      <button
        onClick={exportAsJSON}
        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold text-sm shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-6-4m6 4l6-4" />
        </svg>
        Export JSON
      </button>
      <button
        onClick={exportAsCSV}
        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-semibold text-sm shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-6-4m6 4l6-4" />
        </svg>
        Export CSV
      </button>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if logs changed
  return prevProps.logs === nextProps.logs
})

ExportButtons.displayName = 'ExportButtons'

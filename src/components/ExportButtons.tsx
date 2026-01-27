import React from 'react'
import { LogEntry } from '../types'

interface ExportProps {
  logs: LogEntry[]
}

export const ExportButtons: React.FC<ExportProps> = ({ logs }) => {
  const exportAsJSON = () => {
    const dataStr = JSON.stringify(logs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    downloadFile(dataBlob, `logs-${Date.now()}.json`)
  }

  const exportAsCSV = () => {
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
  }

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={exportAsJSON}
        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
      >
        Export JSON
      </button>
      <button
        onClick={exportAsCSV}
        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium text-sm"
      >
        Export CSV
      </button>
    </div>
  )
}

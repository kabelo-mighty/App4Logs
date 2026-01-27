import React from 'react'
import { LogEntry } from '../types'

interface LogViewerProps {
  logs: LogEntry[]
  isLoading?: boolean
}

const levelColors: Record<string, string> = {
  ERROR: 'bg-red-100 text-red-800 border-red-300',
  WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  INFO: 'bg-blue-100 text-blue-800 border-blue-300',
  DEBUG: 'bg-purple-100 text-purple-800 border-purple-300',
  TRACE: 'bg-gray-100 text-gray-800 border-gray-300',
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-4 text-gray-500">No logs to display</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {logs.map(log => (
        <div key={log.id} className="border-l-4 p-3 rounded bg-gray-50 hover:bg-gray-100 transition-colors border-l-gray-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${levelColors[log.level] || levelColors.INFO}`}>
                  {log.level}
                </span>
                <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-xs font-medium text-gray-700 mb-1">{log.source}</p>
              <p className="text-sm text-gray-900 break-words">{log.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

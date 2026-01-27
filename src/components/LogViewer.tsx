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
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-16"></div>
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-700">No logs to display</p>
        <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
      {logs.map((log, index) => {
        const borderColorMap: Record<string, string> = {
          ERROR: 'border-l-red-500',
          WARNING: 'border-l-yellow-500',
          INFO: 'border-l-blue-500',
          DEBUG: 'border-l-purple-500',
          TRACE: 'border-l-gray-400',
        }

        return (
          <div
            key={log.id}
            className={`border-l-4 p-4 rounded-lg transition-all duration-300 hover:shadow-md hover:scale-[1.01] ${borderColorMap[log.level] || 'border-l-blue-400'} bg-gradient-to-r from-white to-gray-50 border border-gray-100`}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${levelColors[log.level] || levelColors.INFO}`}>
                    {log.level}
                  </span>
                  <span className="text-xs text-gray-600 font-medium">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">{log.source}</p>
                </div>
                <p className="text-sm text-gray-900 break-words leading-relaxed font-medium">{log.message}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

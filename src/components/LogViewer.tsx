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
      <div className="bg-[#0b1220] text-green-200 font-mono p-8 text-center">
        <p className="text-green-300 font-medium">No logs to display</p>
        <p className="text-green-400 text-sm mt-2">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="bg-[#0b1220] text-green-200 font-mono max-h-[600px] overflow-y-auto pr-2">
      {logs.map((log, index) => (
        <div key={log.id} className="px-3 py-1 hover:bg-[#07101a] flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <time className="text-green-400 text-xs w-44 flex-shrink-0">{new Date(log.timestamp).toLocaleString()}</time>
            <span className={`text-xs font-semibold ${levelColors[log.level] || levelColors.INFO} w-16`}>{log.level}</span>
            <div className="text-green-200 text-sm break-words whitespace-pre-wrap">
              {log.source ? <span className="text-green-300 mr-2">[{log.source}]</span> : null}
              {log.message}
            </div>
          </div>

          <div className="text-green-600 text-xs flex-shrink-0">#{log.id}</div>
        </div>
      ))}
    </div>
  )
}

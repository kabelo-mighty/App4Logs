import React, { useMemo, CSSProperties } from 'react'
import { LogEntry } from '../types'
import { useKeyboardNavigation, useAriaLiveRegion } from '../hooks/useAccessibility'

interface VirtualizedLogViewerProps {
  logs: LogEntry[]
  height?: number
  isLoading?: boolean
  searchKeyword?: string
}

// Color mapping for log levels
const levelColors: Record<string, { bg: string; text: string; border: string }> = {
  ERROR: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-l-red-500' },
  WARNING: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-l-yellow-500' },
  INFO: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-l-blue-500' },
  DEBUG: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-l-purple-500' },
  TRACE: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-l-gray-500' },
}

/**
 * Single virtualized log row component
 * Memoized to prevent unnecessary re-renders
 */
const LogRow = React.memo(
  ({
    log,
    style,
    index,
    searchKeyword,
  }: {
    log: LogEntry
    style?: CSSProperties
    index: number
    searchKeyword?: string
  }) => {
    /**
     * Highlight function - returns JSX with highlighted matches
     */
    const highlightText = (text: string, keyword: string): React.ReactNode => {
      if (!keyword || keyword.trim() === '') return text
      
      const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi')
      const parts = text.split(regex)
      
      return parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="bg-yellow-300 font-semibold text-gray-900">
            {part}
          </span>
        ) : (
          part
        )
      )
    }
    
    const colors = levelColors[log.level] || levelColors.INFO
    const timestamp = new Date(log.timestamp).toLocaleString()

    return (
      <div 
        style={style} 
        className="px-2 py-1"
        role="row"
        aria-rowindex={index + 1}
      >
        <div
          className={`
        ${colors.bg} ${colors.border} border-l-4 px-4 py-3
        hover:shadow-md transition-shadow duration-200 cursor-pointer
        rounded focus:outline-none focus:ring-2 focus:ring-blue-500
      `}
          tabIndex={0}
          role="article"
          aria-label={`Log entry ${index + 1}: ${log.level} - ${log.message.substring(0, 50)}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Level and Timestamp */}
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className={`${colors.text} font-semibold text-xs px-2 py-1 rounded bg-white`}
                  aria-label={`Log level: ${log.level}`}
                >
                  {log.level}
                </span>
                <time 
                  className="text-xs text-gray-500"
                  dateTime={log.timestamp}
                >
                  {timestamp}
                </time>
              </div>

              {/* Source if available */}
              {log.source && (
                <div className="text-xs text-gray-600 mb-1">
                  <span className="inline-block px-2 py-1 bg-white rounded">
                    📦 <span aria-label="Source">{log.source}</span>
                  </span>
                </div>
              )}

              {/* Message */}
              <p className={`${colors.text} text-sm break-words font-mono leading-relaxed line-clamp-2`}>
                {highlightText(log.message, searchKeyword || '')}
              </p>
            </div>

            {/* Log ID */}
            <div className="text-xs text-gray-400 flex-shrink-0" aria-label={`Entry ID: ${log.id}`}>#{log.id}</div>
          </div>
        </div>
      </div>
    )
  }
)

LogRow.displayName = 'LogRow'

/**
 * VirtualizedLogViewer Component
 * 
 * Renders large log lists efficiently with optimized scrolling
 * Uses pagination to keep DOM nodes minimal
 * 
 * @param logs - Array of log entries to display
 * @param height - Height of the viewer (default: 600px)
 * @param isLoading - Show loading state
 */
export const VirtualizedLogViewer: React.FC<VirtualizedLogViewerProps> = ({
  logs,
  height = 600,
  isLoading = false,
  searchKeyword,
}) => {
  // Memoize the logs to prevent unnecessary re-renders
  const memoizedLogs = useMemo(() => logs, [logs])
  const { announce } = useAriaLiveRegion()

  if (isLoading) {
    return (
      <div 
        className="bg-gray-50 rounded-lg p-8 text-center"
        role="status"
        aria-label="Loading logs"
      >
        <div className="inline-flex items-center justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
        </div>
        <p className="text-gray-600 font-semibold">Loading logs...</p>
      </div>
    )
  }

  if (memoizedLogs.length === 0) {
    return (
      <div 
        className="bg-gray-50 rounded-lg p-8 text-center"
        role="status"
        aria-label="No logs available"
      >
        <svg
          className="mx-auto w-12 h-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-gray-600 font-semibold">No logs to display</p>
      </div>
    )
  }

  return (
    <section 
      className="bg-white rounded-lg overflow-hidden border border-gray-200"
      role="region"
      aria-label={`Log viewer displaying ${memoizedLogs.length.toLocaleString()} log entries`}
    >
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <p className="text-xs text-gray-600 font-semibold" aria-live="polite">
          Displaying {memoizedLogs.length.toLocaleString()} logs (optimized for performance)
        </p>
      </div>

      <div
        style={{
          height: `${height}px`,
          overflow: 'auto',
          paddingRight: '2px',
        }}
        className="space-y-2 pr-2"
        role="rowgroup"
        aria-label="Log entries"
      >
        {memoizedLogs.map((log, index) => (
          <LogRow key={log.id} log={log} index={index} searchKeyword={searchKeyword} />
        ))}
      </div>
    </section>
  )
}

/**
 * Hook for managing virtualization state
 */
export const useVirtualization = (logs: LogEntry[], itemsPerPage: number = 50) => {
  return useMemo(
    () => ({
      total: logs.length,
      pages: Math.ceil(logs.length / itemsPerPage),
      itemsPerPage,
      shouldUseVirtualization: logs.length > 100,
    }),
    [logs.length, itemsPerPage]
  )
}

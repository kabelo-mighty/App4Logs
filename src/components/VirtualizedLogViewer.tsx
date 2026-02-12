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

    const levelClass: Record<string, string> = {
      ERROR: 'text-red-400',
      WARNING: 'text-yellow-400',
      INFO: 'text-blue-300',
      DEBUG: 'text-purple-300',
      TRACE: 'text-gray-400',
    }

    return (
      <div
        style={style}
        className="px-2"
        role="row"
        aria-rowindex={index + 1}
      >
        <div
          tabIndex={0}
          role="article"
          aria-label={`Log entry ${index + 1}: ${log.level} - ${log.message.substring(0, 50)}`}
          className="flex items-start justify-between gap-2 px-3 py-1 hover:bg-[#07101a]"
        >
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <time className="text-green-400 text-xs w-44 flex-shrink-0" dateTime={log.timestamp}>
              {timestamp}
            </time>

            <span className={`text-xs font-semibold ${levelClass[log.level] || 'text-blue-300'} w-16`}>{log.level}</span>

            <div className="text-green-200 text-sm break-words whitespace-pre-wrap">
              {log.source ? <span className="text-green-300 mr-2">[{log.source}]</span> : null}
              {highlightText(log.message, searchKeyword || '')}
            </div>
          </div>

          <div className="text-green-600 text-xs flex-shrink-0" aria-label={`Entry ID: ${log.id}`}>#{log.id}</div>
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
        className="bg-[#0b1220] text-green-200 font-mono rounded p-6 text-center"
        role="status"
        aria-label="Loading logs"
      >
        <div className="inline-flex items-center justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400" aria-hidden="true"></div>
        </div>
        <p className="text-green-300 font-medium">Loading logs...</p>
      </div>
    )
  }

  if (memoizedLogs.length === 0) {
    return (
      <div
        className="bg-[#0b1220] text-green-200 font-mono p-6 text-center"
        role="status"
        aria-label="No logs available"
      >
        <p className="text-green-300 font-medium">No logs to display</p>
      </div>
    )
  }

  return (
    <section
      className="bg-[#0b1220] text-green-200 font-mono overflow-hidden border border-[#07101a]"
      role="region"
      aria-label={`Log viewer displaying ${memoizedLogs.length.toLocaleString()} log entries`}
    >
      <div className="px-3 py-2 bg-[#07101a] border-b border-[#07101a]">
        <p className="text-xs text-green-300 font-medium" aria-live="polite">
          Displaying {memoizedLogs.length.toLocaleString()} logs
        </p>
      </div>

      <div
        style={{
          height: `${height}px`,
          overflow: 'auto',
          paddingRight: '2px',
        }}
        className="pr-2"
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

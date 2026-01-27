import React, { useMemo, useCallback } from 'react'
import { LogEntry } from '../types'

/**
 * Statistics Card - Memoized to prevent unnecessary re-renders
 */
export const MemoizedStatisticCard = React.memo(
  ({
    title,
    value,
    unit,
    trend,
  }: {
    title: string
    value: number | string
    unit?: string
    trend?: 'up' | 'down' | 'neutral'
  }) => {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
        <p className="text-sm font-semibold text-gray-600 mb-1">{title}</p>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-bold text-blue-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {unit && <span className="text-xs text-gray-600">{unit}</span>}
        </div>
        {trend && (
          <div className="mt-2 text-xs">
            {trend === 'up' && <span className="text-red-600">↑ Increasing</span>}
            {trend === 'down' && <span className="text-green-600">↓ Decreasing</span>}
            {trend === 'neutral' && <span className="text-gray-600">→ Stable</span>}
          </div>
        )}
      </div>
    )
  }
)

MemoizedStatisticCard.displayName = 'MemoizedStatisticCard'

/**
 * Log Entry - Memoized to prevent unnecessary re-renders
 */
export const MemoizedLogEntry = React.memo(
  ({ log }: { log: LogEntry }) => {
    const levelColors: Record<string, string> = {
      ERROR: 'text-red-700 bg-red-50',
      WARNING: 'text-yellow-700 bg-yellow-50',
      INFO: 'text-blue-700 bg-blue-50',
      DEBUG: 'text-purple-700 bg-purple-50',
      TRACE: 'text-gray-700 bg-gray-50',
    }

    const timestamp = new Date(log.timestamp).toLocaleString()

    return (
      <div className={`${levelColors[log.level]} border-l-4 px-4 py-3`}>
        <div className="flex justify-between items-start">
          <div>
            <span className={`font-semibold text-xs px-2 py-1 rounded bg-white`}>
              {log.level}
            </span>
            <span className="text-xs text-gray-600 ml-2">{timestamp}</span>
          </div>
          <span className="text-xs text-gray-400">#{log.id}</span>
        </div>
        <p className="text-sm font-mono mt-2 break-words">{log.message}</p>
      </div>
    )
  }
)

MemoizedLogEntry.displayName = 'MemoizedLogEntry'

/**
 * Filter Badge - Memoized to prevent unnecessary re-renders
 */
export const MemoizedFilterBadge = React.memo(
  ({ label, count, isActive, onClick }: { label: string; count: number; isActive: boolean; onClick: () => void }) => {
    return (
      <button
        onClick={onClick}
        className={`
          px-3 py-1 rounded-full text-xs font-semibold transition-colors
          ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
        `}
      >
        {label}
        {count > 0 && <span className="ml-1 font-bold">({count})</span>}
      </button>
    )
  }
)

MemoizedFilterBadge.displayName = 'MemoizedFilterBadge'

/**
 * Hook for memoizing filter logic
 */
export const useMemoizedFilters = (logs: LogEntry[], searchTerm: string) => {
  return useMemo(() => {
    const filtered = logs.filter(log => log.message.toLowerCase().includes(searchTerm.toLowerCase()))

    const counts = {
      ERROR: filtered.filter(l => l.level === 'ERROR').length,
      WARNING: filtered.filter(l => l.level === 'WARNING').length,
      INFO: filtered.filter(l => l.level === 'INFO').length,
      DEBUG: filtered.filter(l => l.level === 'DEBUG').length,
      TRACE: filtered.filter(l => l.level === 'TRACE').length,
    }

    return { filtered, counts }
  }, [logs, searchTerm])
}

/**
 * Hook for memoizing statistics
 */
export const useMemoizedStatistics = (logs: LogEntry[]) => {
  return useMemo(() => {
    const stats = {
      total: logs.length,
      errors: logs.filter(l => l.level === 'ERROR').length,
      warnings: logs.filter(l => l.level === 'WARNING').length,
      info: logs.filter(l => l.level === 'INFO').length,
      debug: logs.filter(l => l.level === 'DEBUG').length,
      trace: logs.filter(l => l.level === 'TRACE').length,
      errorRate: logs.length > 0 ? (logs.filter(l => l.level === 'ERROR').length / logs.length) * 100 : 0,
    }

    return stats
  }, [logs])
}

/**
 * Hook for memoizing callback with dependency array
 */
export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList
): T => {
  return useCallback(callback, dependencies) as T
}

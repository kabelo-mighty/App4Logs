import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LogEntry, FilterOptions, LogLevel } from '../types'
import { LogFilter } from '../services/logFilter'
import { useKeyboardNavigation, useAriaLiveRegion } from '../hooks/useAccessibility'

interface FilterPanelProps {
  logs: LogEntry[]
  onFilterChange: (filtered: LogEntry[]) => void
  onKeywordChange?: (keyword: string) => void
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ logs, onFilterChange, onKeywordChange }) => {
  const { t } = useTranslation()
  const { announce } = useAriaLiveRegion()
  const [filters, setFilters] = useState<FilterOptions>({
    levels: [],
    keyword: '',
    source: '',
  })

  const sources = useMemo(() => LogFilter.getSources(logs), [logs])
  const dateRange = useMemo(() => LogFilter.getDateRange(logs), [logs])

  const levels: LogLevel[] = ['ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE']

  const handleLevelChange = (level: LogLevel) => {
    const newLevels = filters.levels.includes(level)
      ? filters.levels.filter(l => l !== level)
      : [...filters.levels, level]

    const newFilters = { ...filters, levels: newLevels }
    setFilters(newFilters)
    applyFilters(newFilters)
    
    // Announce filter change to screen readers
    const action = newLevels.includes(level) ? 'added' : 'removed'
    announce(`${level} filter ${action}`)
  }

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...filters, keyword: e.target.value }
    setFilters(newFilters)
    applyFilters(newFilters)
    // Pass keyword back to parent for highlighting
    onKeywordChange?.(e.target.value)
  }

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilters = { ...filters, source: e.target.value }
    setFilters(newFilters)
    applyFilters(newFilters)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, dateType: 'from' | 'to') => {
    const newFilters = {
      ...filters,
      [dateType === 'from' ? 'dateFrom' : 'dateTo']: e.target.value,
    }
    setFilters(newFilters)
    applyFilters(newFilters)
  }

  const applyFilters = (filterOptions: FilterOptions) => {
    const filtered = LogFilter.filter(logs, filterOptions)
    onFilterChange(filtered)
  }

  const resetFilters = () => {
    const emptyFilters: FilterOptions = {
      levels: [],
      keyword: '',
      source: '',
    }
    setFilters(emptyFilters)
    onFilterChange(logs)
    onKeywordChange?.('')
    announce('All filters cleared')
  }

  return (
    <section 
      className="bg-zinc-800 text-white"
      role="region"
      aria-label={t('filters')}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-zinc-300">{t('filters')}</h2>
        <svg 
          className="w-5 h-5 text-zinc-400" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1H3zm0 1h16v2H3V4zm0 3h16v2H3V7zm0 3h16v2H3v-2zm0 3h16v2H3v-2z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Horizontal Filter Layout */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Log Level Filter - Horizontal */}
        <div role="group" aria-label="Log level filters" className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-green-400 uppercase">Level:</span>
          {levels.map(level => {
            const levelColorMap: Record<string, string> = {
              ERROR: 'text-red-400',
              WARNING: 'text-yellow-400',
              INFO: 'text-blue-300',
              DEBUG: 'text-purple-300',
              TRACE: 'text-gray-400',
            }
            return (
              <label 
                key={level} 
                className="flex items-center p-1 rounded hover:bg-zinc-700 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-blue-400"
              >
                <input
                  type="checkbox"
                  checked={filters.levels.includes(level)}
                  onChange={() => handleLevelChange(level)}
                  className="rounded border-zinc-600 text-blue-500 shadow-sm cursor-pointer focus:ring-2 focus:ring-blue-400"
                  aria-label={`${t(level.toLowerCase() as any)} - ${logs.filter(l => l.level === level).length} entries`}
                />
                <span className={`ml-1 text-xs font-bold ${levelColorMap[level]}`}>{level}</span>
                <span className="ml-1 text-xs bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-400" aria-hidden="true">
                  {logs.filter(l => l.level === level).length}
                </span>
              </label>
            )
          })}
        </div>

        {/* Keyword Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="keyword-search" className="text-xs font-semibold text-zinc-400 uppercase">Search:</label>
          <input
            id="keyword-search"
            type="text"
            value={filters.keyword}
            onChange={handleKeywordChange}
            placeholder="keyword..."
            className="px-2 py-1 border border-zinc-600 rounded text-sm bg-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-400 w-40"
            aria-label={`Search logs by keyword`}
            aria-describedby="keyword-help"
          />
          <p id="keyword-help" className="sr-only">Enter a keyword to filter log messages containing that text</p>
        </div>

        {/* Source Filter */}
        {sources.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="source-select" className="text-xs font-semibold text-zinc-400 uppercase">Source:</label>
            <select
              id="source-select"
              value={filters.source}
              onChange={handleSourceChange}
              className="px-2 py-1 border border-zinc-600 rounded text-sm bg-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 w-40"
              aria-label={`Filter logs by source`}
            >
              <option value="">All</option>
              {sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
        )}

        {/* Date Range Filter */}
        {dateRange && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase">Date:</span>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleDateChange(e, 'from')}
              min={dateRange.min}
              max={dateRange.max}
              className="px-2 py-1 border border-zinc-600 rounded text-sm bg-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 w-32"
              placeholder="From"
              aria-label={`Start date for date range filter`}
            />
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleDateChange(e, 'to')}
              min={dateRange.min}
              max={dateRange.max}
              className="px-2 py-1 border border-zinc-600 rounded text-sm bg-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 w-32"
              placeholder="To"
              aria-label={`End date for date range filter`}
            />
          </div>
        )}

        {/* Reset Button */}
        <button
          onClick={resetFilters}
          className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ml-auto"
          aria-label={`Reset all filters`}
        >
          <svg 
            className="w-3 h-3 inline mr-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset
        </button>
      </div>
    </section>
  )
}

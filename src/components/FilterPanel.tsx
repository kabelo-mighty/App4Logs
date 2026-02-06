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
      className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-500 sticky top-4"
      role="region"
      aria-label={t('filters')}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">{t('filters')}</h2>
        <svg 
          className="w-6 h-6 text-blue-500" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1H3zm0 1h16v2H3V4zm0 3h16v2H3V7zm0 3h16v2H3v-2zm0 3h16v2H3v-2z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Log Level Filter */}
      <fieldset className="mb-6">
        <legend className="block text-sm font-bold text-gray-700 mb-3">{t('logLevel')}</legend>
        <div className="space-y-2" role="group" aria-label="Log level filters">
          {levels.map(level => (
            <label 
              key={level} 
              className="flex items-center p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1"
            >
              <input
                type="checkbox"
                checked={filters.levels.includes(level)}
                onChange={() => handleLevelChange(level)}
                className="rounded border-gray-300 text-blue-600 shadow-sm cursor-pointer focus:ring-2 focus:ring-blue-500"
                aria-label={`${t(level.toLowerCase() as any)} - ${logs.filter(l => l.level === level).length} entries`}
              />
              <span className="ml-3 text-sm font-medium text-gray-700">{t(level.toLowerCase() as any)}</span>
              <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded text-gray-600" aria-hidden="true">
                {logs.filter(l => l.level === level).length}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Date Range Filter */}
      {dateRange && (
        <fieldset className="mb-6">
          <legend className="block text-sm font-bold text-gray-700 mb-3">{t('dateRange')}</legend>
          <div className="space-y-2">
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleDateChange(e, 'from')}
              min={dateRange.min}
              max={dateRange.max}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('from')}
              aria-label={`Start date for date range filter`}
            />
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleDateChange(e, 'to')}
              min={dateRange.min}
              max={dateRange.max}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('to')}
              aria-label={`End date for date range filter`}
            />
          </div>
        </fieldset>
      )}

      {/* Keyword Filter */}
      <div className="mb-6">
        <label htmlFor="keyword-search" className="block text-sm font-bold text-gray-700 mb-2">{t('keyword')}</label>
        <input
          id="keyword-search"
          type="text"
          value={filters.keyword}
          onChange={handleKeywordChange}
          placeholder={t('keyword')}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={`Search logs by keyword`}
          aria-describedby="keyword-help"
        />
        <p id="keyword-help" className="sr-only">Enter a keyword to filter log messages containing that text</p>
      </div>

      {/* Source Filter */}
      {sources.length > 0 && (
        <div className="mb-6">
          <label htmlFor="source-select" className="block text-sm font-bold text-gray-700 mb-2">{t('source')}</label>
          <select
            id="source-select"
            value={filters.source}
            onChange={handleSourceChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Filter logs by source`}
          >
            <option value="">{t('all')}</option>
            {sources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>
      )}

      {/* Reset Button */}
      <button
        onClick={resetFilters}
        className="w-full px-4 py-2 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 rounded-lg hover:from-gray-300 hover:to-gray-400 font-semibold text-sm transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={`Reset all filters`}
      >
        <svg 
          className="w-4 h-4 inline mr-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {t('reset')}
      </button>
    </section>
  )
}

import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LogEntry, FilterOptions, LogLevel } from '../types'
import { LogFilter } from '../services/logFilter'

interface FilterPanelProps {
  logs: LogEntry[]
  onFilterChange: (filtered: LogEntry[]) => void
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ logs, onFilterChange }) => {
  const { t } = useTranslation()
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
  }

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...filters, keyword: e.target.value }
    setFilters(newFilters)
    applyFilters(newFilters)
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
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">{t('filters')}</h3>

      {/* Log Level Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">{t('logLevel')}</label>
        <div className="space-y-2">
          {levels.map(level => (
            <label key={level} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.levels.includes(level)}
                onChange={() => handleLevelChange(level)}
                className="rounded border-gray-300 text-blue-600 shadow-sm"
              />
              <span className="ml-3 text-sm text-gray-700">{t(level.toLowerCase() as any)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      {dateRange && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">{t('dateRange')}</label>
          <div className="space-y-2">
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleDateChange(e, 'from')}
              min={dateRange.min}
              max={dateRange.max}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder={t('from')}
            />
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleDateChange(e, 'to')}
              min={dateRange.min}
              max={dateRange.max}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder={t('to')}
            />
          </div>
        </div>
      )}

      {/* Keyword Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('keyword')}</label>
        <input
          type="text"
          value={filters.keyword}
          onChange={handleKeywordChange}
          placeholder={t('keyword')}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      {/* Source Filter */}
      {sources.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('source')}</label>
          <select
            value={filters.source}
            onChange={handleSourceChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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
        className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium text-sm"
      >
        {t('reset')}
      </button>
    </div>
  )
}

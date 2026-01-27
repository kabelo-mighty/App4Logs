import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LogEntry } from '../types'
import { LogFilter } from '../services/logFilter'
import { useAriaLiveRegion } from '../hooks/useAccessibility'

interface StatisticsProps {
  logs: LogEntry[]
}

export const Statistics: React.FC<StatisticsProps> = ({ logs }) => {
  const { t } = useTranslation()
  const { announce } = useAriaLiveRegion()
  const stats = useMemo(() => LogFilter.getStatistics(logs), [logs])

  // Announce statistics changes to screen readers
  React.useEffect(() => {
    if (logs.length > 0) {
      const errorPercentage = ((stats.error / stats.total) * 100).toFixed(1)
      announce(`Statistics updated. Total logs: ${stats.total}. Errors: ${stats.error}. Warnings: ${stats.warning}. Error rate: ${errorPercentage} percent.`)
    }
  }, [stats, logs.length, announce])

  const levelStats = [
    { label: t('errorCount'), value: stats.error, color: 'bg-red-100 text-red-800' },
    { label: t('warningCount'), value: stats.warning, color: 'bg-yellow-100 text-yellow-800' },
    { label: t('infoCount'), value: stats.info, color: 'bg-blue-100 text-blue-800' },
    { label: t('debugCount'), value: stats.debug, color: 'bg-purple-100 text-purple-800' },
  ]

  return (
    <section 
      className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-500"
      aria-label={t('statistics')}
      role="region"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">{t('statistics')}</h2>
        <svg 
          className="w-6 h-6 text-blue-500" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div 
          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-300"
          role="status"
          aria-label={`Total logs: ${stats.total}`}
        >
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('totalLogs')}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2" aria-live="polite">{stats.total}</p>
        </div>

        {levelStats.map(stat => (
          <div 
            key={stat.label} 
            className={`rounded-lg p-4 ${stat.color} border border-opacity-20 border-current hover:shadow-md transition-shadow duration-300 transform hover:scale-105`}
            role="status"
            aria-label={`${stat.label}: ${stat.value}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider opacity-75">{stat.label}</p>
            <p className="text-3xl font-bold mt-2" aria-live="polite">{stat.value}</p>
          </div>
        ))}
      </div>

      {stats.total > 0 && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Error Rate</span>
            <span 
              className="text-xl font-bold text-red-600" 
              aria-live="polite"
              aria-label={`Error rate: ${((stats.error / stats.total) * 100).toFixed(1)} percent`}
            >
              {((stats.error / stats.total) * 100).toFixed(1)}%
            </span>
          </div>
          <div 
            className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner"
            role="progressbar"
            aria-valuenow={Math.round((stats.error / stats.total) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Error rate progress"
          >
            <div
              className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-500 ease-out shadow-lg"
              style={{ width: `${(stats.error / stats.total) * 100}%` }}
              aria-hidden="true"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{stats.error} errors</span>
            <span>{stats.total - stats.error} healthy</span>
          </div>
        </div>
      )}
    </section>
  )
}

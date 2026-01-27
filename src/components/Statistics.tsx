import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LogEntry } from '../types'
import { LogFilter } from '../services/logFilter'

interface StatisticsProps {
  logs: LogEntry[]
}

export const Statistics: React.FC<StatisticsProps> = ({ logs }) => {
  const { t } = useTranslation()
  const stats = useMemo(() => LogFilter.getStatistics(logs), [logs])

  const levelStats = [
    { label: t('errorCount'), value: stats.error, color: 'bg-red-100 text-red-800' },
    { label: t('warningCount'), value: stats.warning, color: 'bg-yellow-100 text-yellow-800' },
    { label: t('infoCount'), value: stats.info, color: 'bg-blue-100 text-blue-800' },
    { label: t('debugCount'), value: stats.debug, color: 'bg-purple-100 text-purple-800' },
  ]

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('statistics')}</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-600">{t('totalLogs')}</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>

        {levelStats.map(stat => (
          <div key={stat.label} className={`rounded-lg p-4 ${stat.color}`}>
            <p className="text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {stats.total > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Error Rate</span>
            <span className="font-semibold">{((stats.error / stats.total) * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full"
              style={{ width: `${(stats.error / stats.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

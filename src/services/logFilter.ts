import { LogEntry, FilterOptions, LogStatistics } from '../types'

export class LogFilter {
  static filter(logs: LogEntry[], options: FilterOptions): LogEntry[] {
    return logs.filter(log => {
      // Filter by level
      if (options.levels.length > 0 && !options.levels.includes(log.level)) {
        return false
      }

      // Filter by date range
      if (options.dateFrom || options.dateTo) {
        const logDate = new Date(log.timestamp)
        if (options.dateFrom && logDate < new Date(options.dateFrom)) {
          return false
        }
        if (options.dateTo) {
          const endDate = new Date(options.dateTo)
          endDate.setHours(23, 59, 59, 999)
          if (logDate > endDate) {
            return false
          }
        }
      }

      // Filter by keyword
      if (options.keyword.trim()) {
        const keyword = options.keyword.toLowerCase()
        const searchText = `${log.message} ${log.source} ${JSON.stringify(log.metadata)}`.toLowerCase()
        if (!searchText.includes(keyword)) {
          return false
        }
      }

      // Filter by source
      if (options.source.trim() && log.source !== options.source) {
        return false
      }

      return true
    })
  }

  static getStatistics(logs: LogEntry[]): LogStatistics {
    const stats: LogStatistics = {
      total: logs.length,
      error: 0,
      warning: 0,
      info: 0,
      debug: 0,
      trace: 0,
    }

    logs.forEach(log => {
      switch (log.level) {
        case 'ERROR':
          stats.error++
          break
        case 'WARNING':
          stats.warning++
          break
        case 'INFO':
          stats.info++
          break
        case 'DEBUG':
          stats.debug++
          break
        case 'TRACE':
          stats.trace++
          break
      }
    })

    return stats
  }

  static getSources(logs: LogEntry[]): string[] {
    return [...new Set(logs.map(log => log.source))].sort()
  }

  static getDateRange(logs: LogEntry[]): { min: string; max: string } | null {
    if (logs.length === 0) return null

    const timestamps = logs.map(log => new Date(log.timestamp).getTime()).sort((a, b) => a - b)
    return {
      min: new Date(timestamps[0]).toISOString().split('T')[0],
      max: new Date(timestamps[timestamps.length - 1]).toISOString().split('T')[0],
    }
  }
}

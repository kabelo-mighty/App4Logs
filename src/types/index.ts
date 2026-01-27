export type LogLevel = 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG' | 'TRACE'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  source: string
  message: string
  metadata?: Record<string, unknown>
}

export interface FilterOptions {
  levels: LogLevel[]
  dateFrom?: string
  dateTo?: string
  keyword: string
  source: string
}

export interface LogStatistics {
  total: number
  error: number
  warning: number
  info: number
  debug: number
  trace: number
}

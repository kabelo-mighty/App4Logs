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

// Real-time streaming configuration types
export interface StreamingConfig {
  endpoint: string
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  pollingInterval?: number
  useWebSocket?: boolean
  parser?: (data: unknown) => LogEntry[] | LogEntry
  retryAttempts?: number
  retryDelay?: number
}

export interface StreamingStatus {
  isConnected: boolean
  isLoading: boolean
  error: string | null
  lastUpdate?: Date
  messagesReceived?: number
}

export type StreamCallback = (logs: LogEntry[], isAppending: boolean) => void
export type StatusCallback = (status: StreamingStatus) => void
export type ErrorCallback = (error: Error) => void

import { LogEntry } from '../types'

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

type StreamCallback = (logs: LogEntry[], isAppending: boolean) => void
type StatusCallback = (status: StreamingStatus) => void
type ErrorCallback = (error: Error) => void

export class LogStreamingService {
  private eventSource: EventSource | null = null
  private webSocket: WebSocket | null = null
  private pollingInterval: ReturnType<typeof setInterval> | null = null
  private config: StreamingConfig | null = null
  private streamCallbacks: Set<StreamCallback> = new Set()
  private statusCallbacks: Set<StatusCallback> = new Set()
  private errorCallbacks: Set<ErrorCallback> = new Set()
  private status: StreamingStatus = {
    isConnected: false,
    isLoading: false,
    error: null,
    messagesReceived: 0,
  }
  private retryCount = 0

  /**
   * Start streaming logs from an API endpoint
   */
  async startStream(config: StreamingConfig): Promise<void> {
    try {
      this.config = config
      this.updateStatus({ isLoading: true, error: null })

      if (config.useWebSocket) {
        await this.initWebSocket(config)
      } else {
        // Use polling as default
        await this.initPolling(config)
      }

      this.retryCount = 0
      this.updateStatus({ isConnected: true, isLoading: false })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.handleError(err)
      throw err
    }
  }

  /**
   * Initialize WebSocket connection for real-time logs
   */
  private async initWebSocket(config: StreamingConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = config.endpoint.replace(/^http/, 'ws')
        this.webSocket = new WebSocket(wsUrl)

        this.webSocket.onopen = () => {
          resolve()
          if (config.headers) {
            // Send headers as first message for authentication if needed
            this.webSocket?.send(JSON.stringify({ headers: config.headers }))
          }
        }

        this.webSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            const logs = this.parseLogs(data, config.parser)
            this.notifyStreamCallbacks(logs, true)
            this.updateStatus({
              lastUpdate: new Date(),
              messagesReceived: (this.status.messagesReceived || 0) + 1,
            })
          } catch (error) {
            this.handleError(error instanceof Error ? error : new Error(String(error)))
          }
        }

        this.webSocket.onerror = (event) => {
          const error = new Error(`WebSocket error: ${event}`)
          reject(error)
        }

        this.webSocket.onclose = () => {
          this.updateStatus({ isConnected: false })
          this.attemptReconnect(config)
        }
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
  }

  /**
   * Initialize polling for log updates
   */
  private async initPolling(config: StreamingConfig): Promise<void> {
    const interval = config.pollingInterval || 5000 // Default 5 seconds

    // First fetch
    await this.fetchLogs(config)

    // Set up polling
    this.pollingInterval = setInterval(async () => {
      try {
        await this.fetchLogs(config)
      } catch (error) {
        this.handleError(error instanceof Error ? error : new Error(String(error)))
      }
    }, interval)
  }

  /**
   * Fetch logs from API endpoint
   */
  private async fetchLogs(config: StreamingConfig): Promise<void> {
    const method = config.method || 'GET'
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...config.headers,
    }

    const response = await fetch(config.endpoint, {
      method,
      headers,
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const logs = this.parseLogs(data, config.parser)

    if (logs.length > 0) {
      this.notifyStreamCallbacks(logs, true)
      this.updateStatus({
        lastUpdate: new Date(),
        messagesReceived: (this.status.messagesReceived || 0) + 1,
      })
    }
  }

  /**
   * Parse logs using custom parser or default JSON parser
   */
  private parseLogs(data: unknown, parser?: (data: unknown) => LogEntry[] | LogEntry): LogEntry[] {
    try {
      if (parser) {
        const result = parser(data)
        return Array.isArray(result) ? result : [result]
      }

      // Default parser - expect array of logs or single log object
      if (Array.isArray(data)) {
        return data.map((item, idx) => this.normalizeLogEntry(item, idx))
      }

      return [this.normalizeLogEntry(data, 0)]
    } catch (error) {
      throw new Error(`Failed to parse logs: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Normalize log entry to standard format
   */
  private normalizeLogEntry(log: unknown, idx: number): LogEntry {
    const logObj = log as Record<string, unknown>

    return {
      id: logObj.id || `log-${Date.now()}-${idx}`,
      timestamp: String(logObj.timestamp || logObj.time || logObj.date || new Date().toISOString()),
      level: (String(logObj.level || logObj.severity || 'INFO').toUpperCase() as any) || 'INFO',
      source: String(logObj.source || logObj.logger || logObj.service || 'API'),
      message: String(logObj.message || logObj.msg || logObj.text || ''),
      metadata: {
        ...logObj,
        _streamSource: true,
      },
    }
  }

  /**
   * Subscribe to stream updates
   */
  onStream(callback: StreamCallback): () => void {
    this.streamCallbacks.add(callback)
    return () => {
      this.streamCallbacks.delete(callback)
    }
  }

  /**
   * Subscribe to status updates
   */
  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback)
    return () => {
      this.statusCallbacks.delete(callback)
    }
  }

  /**
   * Subscribe to errors
   */
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback)
    return () => {
      this.errorCallbacks.delete(callback)
    }
  }

  /**
   * Stop streaming
   */
  stopStream(): void {
    if (this.webSocket) {
      this.webSocket.close()
      this.webSocket = null
    }

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }

    this.config = null
    this.streamCallbacks.clear()
    this.statusCallbacks.clear()
    this.errorCallbacks.clear()
    this.updateStatus({
      isConnected: false,
      isLoading: false,
      error: null,
      messagesReceived: 0,
    })
  }

  /**
   * Get current status
   */
  getStatus(): StreamingStatus {
    return { ...this.status }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(config: StreamingConfig): void {
    if (!config.retryAttempts) return

    if (this.retryCount < config.retryAttempts) {
      this.retryCount++
      const delay = (config.retryDelay || 3000) * this.retryCount

      setTimeout(() => {
        this.startStream(config).catch(error => {
          this.handleError(error)
        })
      }, delay)
    }
  }

  /**
   * Notify all stream callbacks
   */
  private notifyStreamCallbacks(logs: LogEntry[], isAppending: boolean): void {
    this.streamCallbacks.forEach(callback => {
      try {
        callback(logs, isAppending)
      } catch (error) {
        this.handleError(error instanceof Error ? error : new Error(String(error)))
      }
    })
  }

  /**
   * Update status and notify callbacks
   */
  private updateStatus(updates: Partial<StreamingStatus>): void {
    this.status = { ...this.status, ...updates }
    this.statusCallbacks.forEach(callback => {
      try {
        callback(this.status)
      } catch (error) {
        this.handleError(error instanceof Error ? error : new Error(String(error)))
      }
    })
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    this.updateStatus({ error: error.message })
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error)
      } catch (err) {
        console.error('Error in error callback:', err)
      }
    })
  }
}

// Export singleton instance
export const logStreamingService = new LogStreamingService()

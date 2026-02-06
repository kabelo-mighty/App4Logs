import { useEffect, useState, useCallback, useRef } from 'react'
import { LogEntry, StreamingConfig, StreamingStatus } from '../types'
import { logStreamingService } from '../services/logStreamingService'
import { logUserAction, reportError } from '../utils/telemetry'

export interface UseRealtimeLogStreamResult {
  logs: LogEntry[]
  status: StreamingStatus
  connect: (config: StreamingConfig) => Promise<void>
  disconnect: () => void
  clearLogs: () => void
  maxLogsInMemory?: number
}

/**
 * Custom hook for managing real-time log streaming from an API
 * Handles WebSocket and polling-based log fetching
 */
export const useRealtimeLogStream = (
  onLogsReceived?: (logs: LogEntry[], isAppending: boolean) => void,
  maxLogsInMemory = 10000
): UseRealtimeLogStreamResult => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [status, setStatus] = useState<StreamingStatus>({
    isConnected: false,
    isLoading: false,
    error: null,
  })
  const logsRef = useRef<LogEntry[]>([])
  const unsubscribeRef = useRef<(() => void)[]>([])

  // Handle incoming logs from stream
  const handleStreamLogs = useCallback(
    (newLogs: LogEntry[], isAppending: boolean) => {
      try {
        setLogs(prevLogs => {
          let updated: LogEntry[]

          if (isAppending) {
            // Append new logs
            updated = [...prevLogs, ...newLogs]
          } else {
            // Replace logs (useful for polling scenarios)
            updated = [...newLogs]
          }

          // Limit logs in memory to avoid performance issues
          if (updated.length > maxLogsInMemory) {
            updated = updated.slice(-maxLogsInMemory)
          }

          logsRef.current = updated
          return updated
        })

        // Notify parent component
        onLogsReceived?.(newLogs, isAppending)

        logUserAction('realtime_logs_received', {
          count: newLogs.length,
          isAppending,
          totalInMemory: logsRef.current.length,
        })
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        reportError(err)
      }
    },
    [onLogsReceived, maxLogsInMemory]
  )

  // Handle status changes
  const handleStatusChange = useCallback((newStatus: StreamingStatus) => {
    setStatus(newStatus)

    if (newStatus.error) {
      logUserAction('realtime_stream_error', {
        error: newStatus.error,
      })
    }
  }, [])

  // Handle errors
  const handleError = useCallback((error: Error) => {
    reportError(error)
    setStatus(prev => ({
      ...prev,
      error: error.message,
      isConnected: false,
    }))
  }, [])

  // Connect to stream
  const connect = useCallback(async (config: StreamingConfig) => {
    try {
      // Clear previous subscriptions
      unsubscribeRef.current.forEach(unsub => unsub())
      unsubscribeRef.current = []

      // Reset logs and status
      setLogs([])
      logsRef.current = []
      setStatus({
        isConnected: false,
        isLoading: true,
        error: null,
      })

      // Subscribe to stream
      const unsubStream = logStreamingService.onStream(handleStreamLogs)
      const unsubStatus = logStreamingService.onStatusChange(handleStatusChange)
      const unsubError = logStreamingService.onError(handleError)

      unsubscribeRef.current = [unsubStream, unsubStatus, unsubError]

      // Start streaming
      await logStreamingService.startStream(config)

      logUserAction('realtime_stream_started', {
        endpoint: config.endpoint,
        useWebSocket: config.useWebSocket,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      handleError(err)
      throw err
    }
  }, [handleStreamLogs, handleStatusChange, handleError])

  // Disconnect from stream
  const disconnect = useCallback(() => {
    try {
      logStreamingService.stopStream()

      // Unsubscribe from all events
      unsubscribeRef.current.forEach(unsub => unsub())
      unsubscribeRef.current = []

      setStatus({
        isConnected: false,
        isLoading: false,
        error: null,
      })

      logUserAction('realtime_stream_stopped')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      reportError(err)
    }
  }, [])

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([])
    logsRef.current = []
    logUserAction('realtime_logs_cleared')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeRef.current.forEach(unsub => unsub())
      logStreamingService.stopStream()
    }
  }, [])

  return {
    logs,
    status,
    connect,
    disconnect,
    clearLogs,
    maxLogsInMemory,
  }
}

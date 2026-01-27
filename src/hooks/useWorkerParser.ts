import { useState, useCallback, useRef, useEffect } from 'react'
import { LogEntry } from '../types'

interface UseWorkerParserReturn {
  parseFile: (content: string, fileName: string) => Promise<LogEntry[]>
  isLoading: boolean
  error: string | null
}

/**
 * Hook for parsing log files using Web Worker
 * Prevents blocking the main thread during large file parsing
 */
export const useWorkerParser = (): UseWorkerParserReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const workerRef = useRef<Worker | null>(null)

  // Initialize worker
  useEffect(() => {
    try {
      const workerFile = new URL('../workers/logParser.worker.ts', import.meta.url)
      workerRef.current = new Worker(workerFile, { type: 'module' })
    } catch (err) {
      console.warn('Web Worker not available, will parse on main thread')
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [])

  const parseFile = useCallback(
    (content: string, fileName: string): Promise<LogEntry[]> => {
      return new Promise((resolve, reject) => {
        setIsLoading(true)
        setError(null)

        // Fallback: If worker is not available, parse on main thread
        if (!workerRef.current) {
          try {
            const { LogParser } = require('../services/logParser')
            const logs = LogParser.parseFile(content, fileName)
            setIsLoading(false)
            resolve(logs)
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error'
            setError(errorMsg)
            setIsLoading(false)
            reject(new Error(errorMsg))
          }
          return
        }

        // Handler for worker message
        const handleMessage = (event: MessageEvent) => {
          const { logs, error: workerError } = event.data

          if (workerError) {
            setError(workerError)
            setIsLoading(false)
            reject(new Error(workerError))
          } else {
            setIsLoading(false)
            resolve(logs)
          }

          // Remove listener after first message
          workerRef.current?.removeEventListener('message', handleMessage)
        }

        // Handler for worker error
        const handleError = (err: ErrorEvent) => {
          const errorMsg = err.message || 'Worker error'
          setError(errorMsg)
          setIsLoading(false)
          reject(new Error(errorMsg))
          workerRef.current?.removeEventListener('error', handleError)
        }

        // Attach listeners
        workerRef.current.addEventListener('message', handleMessage)
        workerRef.current.addEventListener('error', handleError)

        // Send message to worker
        workerRef.current.postMessage({
          type: 'parse',
          content,
          fileName,
        })
      })
    },
    []
  )

  return {
    parseFile,
    isLoading,
    error,
  }
}

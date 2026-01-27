import { LogEntry } from '../types'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export const validateFile = (file: File): void => {
  const maxSize = 100 * 1024 * 1024 // 100MB
  const allowedExtensions = ['log', 'json', 'csv', 'xml', 'txt']

  if (file.size > maxSize) {
    throw new ValidationError(`File size exceeds 100MB limit (received ${(file.size / 1024 / 1024).toFixed(2)}MB)`)
  }

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new ValidationError(`Invalid file format. Allowed: ${allowedExtensions.join(', ')}`)
  }
}

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript:
    .trim()
}

export const validateLogs = (logs: LogEntry[]): void => {
  if (!Array.isArray(logs)) {
    throw new ValidationError('Logs must be an array')
  }

  if (logs.length === 0) {
    throw new ValidationError('No logs found in file')
  }

  // Validate first few entries
  logs.slice(0, 5).forEach((log, index) => {
    if (!log.id || !log.timestamp || !log.level || !log.message) {
      throw new ValidationError(`Log entry ${index + 1} is missing required fields`)
    }

    if (!['ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE'].includes(log.level)) {
      throw new ValidationError(`Log entry ${index + 1} has invalid log level: ${log.level}`)
    }
  })
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

export const getPercentageChange = (current: number, previous: number): { value: number; trend: 'up' | 'down' | 'equal' } => {
  if (previous === 0) return { value: 0, trend: 'equal' }
  const change = ((current - previous) / previous) * 100
  return {
    value: Math.abs(Math.round(change)),
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'equal',
  }
}

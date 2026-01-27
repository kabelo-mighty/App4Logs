import { useEffect, useRef, useCallback, useState } from 'react'

export interface StorageData {
  filters: {
    levels: string[]
    keyword: string
    source: string
    dateFrom?: string
    dateTo?: string
  }
  timestamp: number
}

const STORAGE_KEY = 'log-analyzer-session'
const HISTORY_KEY = 'log-analyzer-history'
const MAX_HISTORY = 10

export const useSessionStorage = () => {
  const saveSession = useCallback((data: StorageData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }, [])

  const loadSession = useCallback((): StorageData | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data) {
        const parsed = JSON.parse(data)
        // Don't load sessions older than 24 hours
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed
        }
      }
      return null
    } catch (error) {
      console.error('Failed to load session:', error)
      return null
    }
  }, [])

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear session:', error)
    }
  }, [])

  return { saveSession, loadSession, clearSession }
}

export const useFileHistory = () => {
  const addToHistory = useCallback((fileName: string, fileSize: number) => {
    try {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
      const newEntry = {
        name: fileName,
        size: fileSize,
        timestamp: Date.now(),
      }
      const updated = [newEntry, ...history].slice(0, MAX_HISTORY)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to add to history:', error)
    }
  }, [])

  const getHistory = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    } catch (error) {
      console.error('Failed to get history:', error)
      return []
    }
  }, [])

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }, [])

  return { addToHistory, getHistory, clearHistory }
}

export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error('Failed to read from localStorage:', error)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      typeof window !== 'undefined' &&
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error('Failed to write to localStorage:', error)
    }
  }, [key, storedValue])

  return [storedValue, setValue] as const
}

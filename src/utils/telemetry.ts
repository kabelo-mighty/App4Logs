import * as Sentry from '@sentry/react'
import LogRocket from 'logrocket'

// Get environment variables safely
const getSentryDsn = () => import.meta.env.VITE_SENTRY_DSN || ''
const getLogRocketId = () => import.meta.env.VITE_LOGROCKET_ID || ''
const getEnvironment = () => import.meta.env.MODE || 'development'

// Store session URL globally
let sessionUrl: string | null = null

// Initialize error tracking services
export const initErrorTracking = () => {
  const sentryDsn = getSentryDsn()
  const logRocketId = getLogRocketId()
  const environment = getEnvironment()

  // Initialize Sentry
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment,
      tracesSampleRate: 1.0,
      integrations: [
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    })
  }

  // Initialize LogRocket
  if (logRocketId) {
    LogRocket.init(logRocketId)
    
    // Get session URL via callback
    LogRocket.getSessionURL((url) => {
      sessionUrl = url
    })
    
    // Identify user if available
    if (typeof window !== 'undefined' && window.localStorage) {
      const userId = localStorage.getItem('user_id')
      if (userId) {
        LogRocket.identify(userId, {
          name: localStorage.getItem('user_name') || 'Anonymous',
          email: localStorage.getItem('user_email') || 'unknown@example.com',
        })
      }
    }
  }

  console.log('[Telemetry] Error tracking initialized', {
    sentry: !!sentryDsn,
    logRocket: !!logRocketId,
    environment,
  })
}

// Track analytics events
export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString()
  
  console.log(`[Analytics] ${eventName}`, { ...properties, timestamp })
  
  // Send to Sentry
  if (Sentry.isInitialized()) {
    Sentry.captureMessage(`Event: ${eventName}`, 'info')
  }

  // Send to LogRocket
  const logRocketId = getLogRocketId()
  if (logRocketId && properties) {
    const sanitized: Record<string, string | number | boolean> = {}
    for (const [key, value] of Object.entries(properties)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value
      }
    }
    LogRocket.track(eventName, sanitized)
  }
}

// Enhanced error reporting with context
export const reportError = (error: Error | string, context?: Record<string, unknown>) => {
  const errorMessage = typeof error === 'string' ? error : error.message
  const errorStack = typeof error === 'string' ? undefined : error.stack
  
  const fullContext = {
    ...context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  }

  console.error('[Error Report]', {
    message: errorMessage,
    stack: errorStack,
    context: fullContext,
  })

  // Send to Sentry with full context
  if (Sentry.isInitialized()) {
    if (typeof error === 'string') {
      Sentry.captureMessage(error, 'error')
    } else {
      Sentry.captureException(error)
    }
    Sentry.setContext('error_context', fullContext as Record<string, unknown>)
  }

  // Send to LogRocket
  const logRocketId = getLogRocketId()
  if (logRocketId) {
    LogRocket.captureException(typeof error === 'string' ? new Error(error) : error)
  }

  // Send to custom API endpoint if available
  const apiEndpoint = import.meta.env.VITE_API_ERROR_ENDPOINT
  if (apiEndpoint) {
    fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: errorMessage,
        stack: errorStack,
        context: fullContext,
        severity: 'error',
      }),
    }).catch(err => console.error('Failed to report error to API:', err))
  }
}

// User action logging
export const logUserAction = (action: string, details?: Record<string, unknown>) => {
  trackEvent(`user_${action}`, {
    timestamp: new Date().toISOString(),
    ...details,
  })
}

// Performance monitoring
export const trackPerformance = (metricName: string, value: number, metadata?: Record<string, unknown>) => {
  console.log(`[Performance] ${metricName}: ${value}ms`, metadata)

  if (Sentry.isInitialized()) {
    Sentry.captureMessage(`Performance: ${metricName} = ${value}ms`, 'info')
  }

  const logRocketId = getLogRocketId()
  if (logRocketId && metadata) {
    const sanitized: Record<string, string | number | boolean> = {}
    for (const [key, val] of Object.entries(metadata)) {
      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        sanitized[key] = val
      }
    }
    LogRocket.track('performance_metric', {
      metric: metricName,
      value,
      unit: 'ms',
      ...sanitized,
    })
  }
}

// Performance marks and measures
export const markPerformance = (label: string) => {
  if (typeof window !== 'undefined' && window.performance) {
    try {
      performance.mark(label)
    } catch (e) {
      console.error(`Performance mark "${label}" failed:`, e)
    }
  }
}

export const measurePerformance = (label: string, startMark: string, endMark: string) => {
  if (typeof window !== 'undefined' && window.performance) {
    try {
      performance.measure(label, startMark, endMark)
      const measure = performance.getEntriesByName(label)[0]
      if (measure) {
        trackPerformance(label, measure.duration, {
          type: 'user_timing',
        })
      }
    } catch (e) {
      console.error('Performance measurement failed:', e)
      reportError(e as Error, { context: 'performance_measurement' })
    }
  }
}

// Warning tracking
export const trackWarning = (message: string, data?: Record<string, unknown>) => {
  console.warn(`[Warning] ${message}`, data)

  if (Sentry.isInitialized()) {
    Sentry.captureMessage(message, 'warning')
    if (data) {
      Sentry.setContext('warning_data', data)
    }
  }
}

// Set user context for better tracking
export const setUserContext = (userId: string, userData?: Record<string, unknown>) => {
  if (Sentry.isInitialized()) {
    const sanitized: Record<string, string | number | boolean> = { id: userId }
    if (userData) {
      for (const [key, val] of Object.entries(userData)) {
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          sanitized[key] = val
        }
      }
    }
    Sentry.setUser(sanitized)
  }

  const logRocketId = getLogRocketId()
  if (logRocketId) {
    const sanitized: Record<string, string | number | boolean> = {}
    if (userData) {
      for (const [key, val] of Object.entries(userData)) {
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          sanitized[key] = val
        }
      }
    }
    LogRocket.identify(userId, sanitized)
  }

  // Store in localStorage for persistence
  localStorage.setItem('user_id', userId)
  if (userData?.name) {
    localStorage.setItem('user_name', String(userData.name))
  }
  if (userData?.email) {
    localStorage.setItem('user_email', String(userData.email))
  }
}

// Get LogRocket session URL if available
export const getSessionUrl = () => {
  return sessionUrl
}


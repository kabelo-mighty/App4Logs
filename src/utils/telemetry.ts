// Sentry initialization (optional)
export const initErrorTracking = () => {
  // Initialize Sentry or similar service
  // Example: Sentry.init({ dsn: process.env.REACT_APP_SENTRY_DSN })
}

// Analytics tracking
export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  console.log(`[Analytics] ${eventName}`, properties)
  
  // Send to analytics service
  // Example: gtag('event', eventName, properties)
}

// Performance monitoring
export const trackPerformance = (metricName: string, value: number) => {
  console.log(`[Performance] ${metricName}: ${value}ms`)
  
  // Send to monitoring service
  // Example: Sentry.captureMessage(...)
}

// Error reporting
export const reportError = (error: Error, context?: Record<string, unknown>) => {
  console.error('[Error Report]', error, context)
  
  // Send to error tracking service
  // Example: Sentry.captureException(error, { extra: context })
  
  // You could also send to a custom API endpoint
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    }),
  }).catch(err => console.error('Failed to report error:', err))
}

// Log analytics
export const logUserAction = (action: string, details?: Record<string, unknown>) => {
  trackEvent(`user_${action}`, {
    timestamp: new Date().toISOString(),
    ...details,
  })
}

// Performance marks
export const markPerformance = (label: string) => {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(label)
  }
}

export const measurePerformance = (label: string, startMark: string, endMark: string) => {
  if (typeof window !== 'undefined' && window.performance) {
    try {
      performance.measure(label, startMark, endMark)
      const measure = performance.getEntriesByName(label)[0]
      if (measure) {
        trackPerformance(label, measure.duration)
      }
    } catch (e) {
      console.error('Performance measurement failed:', e)
    }
  }
}

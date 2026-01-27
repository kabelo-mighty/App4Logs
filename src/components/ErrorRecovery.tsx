import React, { useState, useEffect } from 'react'
import { reportError, trackEvent } from '../utils/telemetry'

interface ErrorRecoveryProps {
  error: Error | string
  context?: 'upload' | 'parsing' | 'filtering' | 'export' | 'network' | 'unknown'
  onRetry?: () => Promise<void>
  onDismiss?: () => void
  autoClose?: number
}

export const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({
  error,
  context = 'unknown',
  onRetry,
  onDismiss,
  autoClose = 0,
}) => {
  const [isRetrying, setIsRetrying] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  const errorMessage = typeof error === 'string' ? error : error.message
  const errorType = typeof error === 'string' ? 'String' : error.constructor.name

  useEffect(() => {
    // Report error automatically
    reportError(error, {
      context,
      retryCount,
      errorType,
    })

    // Auto-close if specified
    if (autoClose > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, autoClose)
      return () => clearTimeout(timer)
    }
  }, [error, context, retryCount, errorType])

  const handleRetry = async () => {
    if (!onRetry) return

    setIsRetrying(true)
    setRetryCount(prev => prev + 1)

    try {
      trackEvent('error_retry_attempted', {
        context,
        retryCount: retryCount + 1,
      })
      await onRetry()
      setIsVisible(false)
      trackEvent('error_recovery_successful', { context })
    } catch (retryError) {
      reportError(retryError as Error, {
        context,
        originalError: errorMessage,
        retryAttempt: retryCount + 1,
      })

      if (retryCount >= 3) {
        trackEvent('error_retry_max_attempts', { context })
      }
    } finally {
      setIsRetrying(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    trackEvent('error_dismissed', {
      context,
      retryCount,
    })
    onDismiss?.()
  }

  if (!isVisible) return null

  // Error type specific icons and colors
  const getErrorUI = () => {
    switch (context) {
      case 'upload':
        return {
          icon: '📤',
          title: 'Upload Failed',
          color: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-900',
          suggestion: 'Please check your file and try again.',
        }
      case 'parsing':
        return {
          icon: '📋',
          title: 'Parsing Error',
          color: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-900',
          suggestion: 'The log file format may be unsupported. Try a different file.',
        }
      case 'filtering':
        return {
          icon: '🔍',
          title: 'Filter Error',
          color: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-900',
          suggestion: 'Try adjusting your filter criteria.',
        }
      case 'export':
        return {
          icon: '💾',
          title: 'Export Failed',
          color: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-900',
          suggestion: 'Please try exporting again.',
        }
      case 'network':
        return {
          icon: '🌐',
          title: 'Network Error',
          color: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-900',
          suggestion: 'Check your internet connection and try again.',
        }
      default:
        return {
          icon: '⚠️',
          title: 'Something Went Wrong',
          color: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-900',
          suggestion: 'Please try again or contact support.',
        }
    }
  }

  const ui = getErrorUI()

  return (
    <div
      className={`${ui.color} border-l-4 ${ui.borderColor} rounded-r-lg p-4 mb-4 animate-slideInLeft`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="text-2xl flex-shrink-0">{ui.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${ui.textColor} text-sm mb-1`}>{ui.title}</h3>
          <p className={`text-sm ${ui.textColor} mb-2 opacity-90 break-words`}>{errorMessage}</p>
          <p className={`text-xs ${ui.textColor} opacity-75`}>{ui.suggestion}</p>

          {retryCount > 0 && (
            <p className={`text-xs ${ui.textColor} opacity-75 mt-1`}>
              Retry attempts: {retryCount}/3
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0 ml-3">
          {onRetry && retryCount < 3 && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors duration-200 ${
                context === 'upload' || context === 'export'
                  ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                  : context === 'parsing'
                    ? 'bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              }`}
              aria-label="Retry failed operation"
            >
              {isRetrying ? (
                <>
                  <span className="inline-block animate-spin mr-1">⏳</span>
                  Retrying...
                </>
              ) : (
                'Retry'
              )}
            </button>
          )}
          <button
            onClick={handleDismiss}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors duration-200 ${ui.textColor} hover:opacity-75`}
            aria-label="Dismiss error message"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook for managing error state with recovery
 */
export const useErrorRecovery = () => {
  const [error, setError] = useState<{
    message: Error | string
    context: ErrorRecoveryProps['context']
    retryFn?: () => Promise<void>
  } | null>(null)

  const showError = (
    message: Error | string,
    context: ErrorRecoveryProps['context'] = 'unknown',
    retryFn?: () => Promise<void>
  ) => {
    setError({ message, context, retryFn })
  }

  const clearError = () => {
    setError(null)
  }

  return {
    error,
    showError,
    clearError,
    isError: !!error,
  }
}

import React, { ReactNode, ErrorInfo } from 'react'
import { reportError, getSessionUrl } from '../utils/telemetry'

interface Props {
  children: ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  sessionUrl: string | null
  errorCount: number
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      sessionUrl: null,
      errorCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorCount = (this.state.errorCount || 0) + 1
    
    console.error('Error caught by boundary:', error, errorInfo)
    
    this.setState(prevState => ({
      error,
      errorInfo,
      sessionUrl: getSessionUrl() || null,
      errorCount,
    }))

    // Report to error tracking services
    reportError(error, {
      errorInfo: errorInfo.componentStack,
      errorBoundary: true,
      errorCount,
      timestamp: new Date().toISOString(),
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-8">
            {/* Error Icon */}
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Error Title and Message */}
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Something went wrong</h1>
            <p className="text-gray-600 text-center mb-6">
              We apologize for the inconvenience. Our team has been notified and is working to fix this issue.
            </p>

            {/* Error Details */}
            {this.state.error && (
              <details className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-700 max-h-48 overflow-auto">
                <summary className="font-semibold cursor-pointer text-gray-900 mb-3 select-none hover:text-red-600">
                  Error Details (click to expand)
                </summary>
                <div className="space-y-3">
                  <div>
                    <p className="font-mono text-red-600 break-all">{this.state.error.toString()}</p>
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Component Stack:</p>
                      <pre className="font-mono text-xs whitespace-pre-wrap break-words bg-white p-2 rounded border border-gray-200">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Session URL for LogRocket */}
            {this.state.sessionUrl && (
              <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-900 mb-2">
                  <strong>Session Recorded:</strong> Our support team can review your session.
                </p>
                <p className="text-xs font-mono text-blue-700 truncate">{this.state.sessionUrl}</p>
              </div>
            )}

            {/* Error Count Warning */}
            {this.state.errorCount > 2 && (
              <div className="mb-6 bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-900">
                  <strong>Multiple errors detected:</strong> Please try reloading the page or clearing your browser cache if the problem persists.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 font-semibold transition-colors duration-200"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 active:bg-gray-400 font-semibold transition-colors duration-200"
              >
                Reload Page
              </button>
            </div>

            {/* Additional Help */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                If problems persist, please contact support with reference ID: <span className="font-mono">{new Date().getTime()}</span>
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

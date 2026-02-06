import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { StreamingConfig } from '../types'
import { logUserAction, reportError } from '../utils/telemetry'

interface RealtimeLogInputProps {
  onConnect: (config: StreamingConfig) => void
  isConnecting?: boolean
  isConnected?: boolean
  error?: string | null
  onDisconnect?: () => void
}

export const RealtimeLogInput: React.FC<RealtimeLogInputProps> = ({
  onConnect,
  isConnecting = false,
  isConnected = false,
  error = null,
  onDisconnect,
}) => {
  const { t } = useTranslation()
  const [endpoint, setEndpoint] = useState('')
  const [method, setMethod] = useState<'GET' | 'POST'>('GET')
  const [useWebSocket, setUseWebSocket] = useState(false)
  const [pollingInterval, setPollingInterval] = useState('5000')
  const [retryAttempts, setRetryAttempts] = useState('3')
  const [headers, setHeaders] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleConnect = useCallback(() => {
    if (!endpoint.trim()) {
      reportError(new Error('Endpoint is required'))
      return
    }

    try {
      // Validate URL
      new URL(endpoint)

      const headerObj: Record<string, string> = {}
      if (headers.trim()) {
        try {
          const parsed = JSON.parse(headers)
          if (typeof parsed === 'object') {
            Object.assign(headerObj, parsed)
          }
        } catch {
          reportError(new Error('Invalid JSON format for headers'))
          return
        }
      }

      const config: StreamingConfig = {
        endpoint,
        method,
        useWebSocket,
        pollingInterval: parseInt(pollingInterval) || 5000,
        retryAttempts: parseInt(retryAttempts) || 3,
        headers: Object.keys(headerObj).length > 0 ? headerObj : undefined,
      }

      logUserAction('realtime_stream_connect', {
        endpoint,
        useWebSocket,
        pollingInterval: config.pollingInterval,
      })

      onConnect(config)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      reportError(error)
    }
  }, [endpoint, method, useWebSocket, pollingInterval, retryAttempts, headers, onConnect])

  const handleDisconnect = useCallback(() => {
    logUserAction('realtime_stream_disconnect')
    onDisconnect?.()
  }, [onDisconnect])

  return (
    <div className="w-full">
      <form className="space-y-6">
        {/* Endpoint Input */}
        <div>
          <label htmlFor="endpoint" className="block text-sm font-semibold text-white mb-2">
            API Endpoint <span className="text-red-400">*</span>
          </label>
          <input
            id="endpoint"
            type="url"
            placeholder="https://api.example.com/logs or wss://stream.example.com/logs"
            value={endpoint}
            onChange={e => setEndpoint(e.target.value)}
            disabled={isConnected || isConnecting}
            className="w-full px-4 py-2.5 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="API endpoint URL"
          />
          <p className="mt-1.5 text-xs text-zinc-400">{t('endpoint_helper') || 'Enter the HTTP(S) or WebSocket (wss://) endpoint.'}</p>
        </div>

        {/* Connection Type */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">{t('connection_type') || 'Connection Type'}</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setUseWebSocket(false)}
              disabled={isConnected || isConnecting}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                !useWebSocket
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-pressed={!useWebSocket}
            >
              <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('polling') || 'Polling'}
            </button>
            <button
              type="button"
              onClick={() => setUseWebSocket(true)}
              disabled={isConnected || isConnecting}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                useWebSocket
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-pressed={useWebSocket}
            >
              <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {t('websocket') || 'WebSocket'}
            </button>
          </div>
        </div>

        {/* Polling Interval (conditional) */}
        {!useWebSocket && (
          <div>
            <label htmlFor="polling-interval" className="block text-sm font-semibold text-white mb-2">{t('polling_interval_ms') || 'Polling Interval (ms)'}</label>
            <input
              id="polling-interval"
              type="number"
              min="1000"
              step="1000"
              value={pollingInterval}
              onChange={e => setPollingInterval(e.target.value)}
              disabled={isConnected || isConnecting}
              className="w-full px-4 py-2.5 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Polling interval in milliseconds"
            />
            <p className="mt-1.5 text-xs text-zinc-400">{t('min_interval_1000ms') || 'Minimum: 1000ms — lower values increase load'}</p>
          </div>
        )}

        {/* Advanced Options */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-2"
          >
            <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4 p-4 bg-zinc-700/50 rounded-lg border border-zinc-600">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="method" className="block text-sm font-semibold text-white mb-2">{t('http_method') || 'HTTP Method'}</label>
                  <select
                    id="method"
                    value={method}
                    onChange={e => setMethod(e.target.value as 'GET' | 'POST')}
                    disabled={isConnected || isConnecting}
                    className="w-full px-4 py-2.5 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="retry" className="block text-sm font-semibold text-white mb-2">{t('retry_attempts') || 'Retry Attempts'}</label>
                  <input
                    id="retry"
                    type="number"
                    min="0"
                    max="10"
                    value={retryAttempts}
                    onChange={e => setRetryAttempts(e.target.value)}
                    disabled={isConnected || isConnecting}
                    className="w-full px-4 py-2.5 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="headers" className="block text-sm font-semibold text-white mb-2">{t('headers_json') || 'Headers (JSON)'}</label>
                <textarea
                  id="headers"
                  placeholder='{"Authorization": "Bearer token", "X-Custom": "value"}'
                  value={headers}
                  onChange={e => setHeaders(e.target.value)}
                  disabled={isConnected || isConnecting}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />
                <p className="text-xs text-zinc-400 mt-1.5">{t('optional_headers') || 'Optional: JSON object with headers'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {isConnected && (
          <div className="p-3.5 bg-green-900/20 border border-green-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></span>
              <p className="text-sm font-semibold text-green-300">Connected to API</p>
            </div>
            <p className="text-xs text-green-200">{endpoint}</p>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-sm font-semibold text-red-300 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.366-.774 1.45-.774 1.816 0l6.518 13.793A1 1 0 0115.8 18H4.2a1 1 0 01-.79-1.108L8.257 3.1zM11 14a1 1 0 11-2 0 1 1 0 012 0zm-1-3a1 1 0 01-1-1V7a1 1 0 112 0v3a1 1 0 01-1 1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-zinc-700">
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting || !endpoint.trim()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
              {isConnecting ? (
                <>
                  <span className="animate-spin inline-block">⟳</span>
                  <span>{t('connecting') || 'Connecting...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>{t('connect') || 'Connect'}</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>{t('disconnect') || 'Disconnect'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => { setEndpoint(''); setHeaders(''); setPollingInterval('5000'); setRetryAttempts('3') }}
            className="inline-flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {t('clear') || 'Clear'}
          </button>
        </div>
      </form>
    </div>
  )
}

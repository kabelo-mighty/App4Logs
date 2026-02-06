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
    <div className="w-full bg-white rounded-lg border border-slate-200 p-6 shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-600 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
              </svg>
            </span>
            {t('realtime_logs') || 'Real-time Logs'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{t('realtime_logs_desc') || 'Connect to an API to stream logs in real-time.'}</p>
        </div>
        <div className="flex items-center gap-3">
          {isConnected && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 text-sm">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"/></svg>
              {t('connected_to_api') || 'Connected'}
            </div>
          )}

          {error && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-100 text-sm">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M8.257 3.099c.366-.774 1.45-.774 1.816 0l6.518 13.793A1 1 0 0115.8 18H4.2a1 1 0 01-.79-1.108L8.257 3.1zM11 14a1 1 0 11-2 0 1 1 0 012 0zm-1-3a1 1 0 01-1-1V7a1 1 0 112 0v3a1 1 0 01-1 1z"/></svg>
              {error}
            </div>
          )}
        </div>
      </div>

      <form className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 items-center">
        <label htmlFor="endpoint" className="text-sm font-medium text-slate-700 md:col-span-1">
          {t('api_endpoint') || 'API Endpoint'} <span className="text-red-500">*</span>
        </label>

        <div className="md:col-span-2">
          <input
            id="endpoint"
            type="url"
            placeholder="https://api.example.com/logs"
            value={endpoint}
            onChange={e => setEndpoint(e.target.value)}
            disabled={isConnected || isConnecting}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
            aria-label="API endpoint URL"
          />
          <p className="mt-2 text-xs text-slate-400">{t('endpoint_helper') || 'Enter the HTTP(S) or WebSocket (wss://) endpoint.'}</p>
        </div>

        <label className="text-sm font-medium text-slate-700 md:col-span-1">{t('connection_type') || 'Connection Type'}</label>
        <div className="md:col-span-2 flex gap-2">
          <button
            type="button"
            onClick={() => setUseWebSocket(false)}
            disabled={isConnected || isConnecting}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${!useWebSocket ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}
            aria-pressed={!useWebSocket}
          >
            {t('polling') || 'Polling'}
          </button>
          <button
            type="button"
            onClick={() => setUseWebSocket(true)}
            disabled={isConnected || isConnecting}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${useWebSocket ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}
            aria-pressed={useWebSocket}
          >
            {t('websocket') || 'WebSocket'}
          </button>
        </div>

        {!useWebSocket && (
          <>
            <label htmlFor="polling-interval" className="text-sm font-medium text-slate-700 md:col-span-1">{t('polling_interval_ms') || 'Polling Interval (ms)'}</label>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                id="polling-interval"
                type="number"
                min="1000"
                step="1000"
                value={pollingInterval}
                onChange={e => setPollingInterval(e.target.value)}
                disabled={isConnected || isConnecting}
                className="px-4 py-2 border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                aria-label="Polling interval in milliseconds"
              />
              <div className="sm:col-span-2 text-xs text-slate-400 self-center">{t('min_interval_1000ms') || 'Minimum: 1000ms — lower values increase load'}</div>
            </div>
          </>
        )}

        <div className="md:col-span-1 text-sm font-medium text-slate-700">{t('advanced') || 'Advanced'}</div>
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showAdvanced ? 'Hide options' : 'Show advanced options'}
            </button>
            <div className="text-xs text-slate-400">{t('advanced_helper') || 'Headers, retries, and method'}</div>
          </div>

          {showAdvanced && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label htmlFor="method" className="block text-sm font-medium text-slate-700 mb-1">{t('http_method') || 'HTTP Method'}</label>
                <select
                  id="method"
                  value={method}
                  onChange={e => setMethod(e.target.value as 'GET' | 'POST')}
                  disabled={isConnected || isConnecting}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="retry" className="block text-sm font-medium text-slate-700 mb-1">{t('retry_attempts') || 'Retry Attempts'}</label>
                <input
                  id="retry"
                  type="number"
                  min="0"
                  max="10"
                  value={retryAttempts}
                  onChange={e => setRetryAttempts(e.target.value)}
                  disabled={isConnected || isConnecting}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="headers" className="block text-sm font-medium text-slate-700 mb-1">{t('headers_json') || 'Headers (JSON)'}</label>
                <textarea
                  id="headers"
                  placeholder='{"Authorization": "Bearer token", "X-Custom": "value"}'
                  value={headers}
                  onChange={e => setHeaders(e.target.value)}
                  disabled={isConnected || isConnecting}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs disabled:bg-slate-50"
                />
                <p className="text-xs text-slate-400 mt-1">{t('optional_headers') || 'Optional: JSON object with headers'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-1" />
        <div className="md:col-span-2 flex items-center gap-3 mt-2">
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting || !endpoint.trim()}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (<span className="animate-spin">⟳</span>) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884l8-4a1 1 0 01.994 0l8 4A1 1 0 0119 6.764V14a2 2 0 01-2 2h-2v-4a2 2 0 00-2-2H7a2 2 0 00-2 2v4H3a2 2 0 01-2-2V6.764a1 1 0 01.003-.88z"/></svg>
              )}
              <span>{isConnecting ? (t('connecting') || 'Connecting...') : (t('connect') || 'Connect')}</span>
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a1 1 0 00-1 1v2h10V3a1 1 0 00-1-1H6zM4 7v8a2 2 0 002 2h8a2 2 0 002-2V7H4z"/></svg>
              <span>{t('disconnect') || 'Disconnect'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => { setEndpoint(''); setHeaders(''); setPollingInterval('5000'); setRetryAttempts('3') }}
            className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 px-3 rounded-lg border border-slate-200 text-sm"
          >
            {t('clear') || 'Clear'}
          </button>
        </div>

        {isConnected && (
          <div className="md:col-span-3 mt-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div><strong>{t('endpoint') || 'Endpoint'}:</strong> {endpoint}</div>
              <div><strong>{t('type') || 'Type'}:</strong> {useWebSocket ? 'WebSocket' : `Polling (${pollingInterval}ms)`}</div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

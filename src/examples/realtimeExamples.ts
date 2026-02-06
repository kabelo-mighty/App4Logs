/**
 * Real-time Log Streaming Examples
 * 
 * This file contains practical examples for integrating real-time log streaming
 * into your App4Logs application.
 */

import { StreamingConfig } from './types'

/**
 * Example 1: Simple Polling Setup
 * 
 * Polls a REST API every 5 seconds for new logs
 */
export const example1PollingConfig: StreamingConfig = {
  endpoint: 'https://api.example.com/logs',
  method: 'GET',
  pollingInterval: 5000,
  retryAttempts: 3,
  retryDelay: 3000
}

/**
 * Example 2: WebSocket Real-time Connection
 * 
 * Connects to a WebSocket server for real-time log streaming
 */
export const example2WebSocketConfig: StreamingConfig = {
  endpoint: 'wss://stream.example.com/logs',
  useWebSocket: true,
  retryAttempts: 5,
  retryDelay: 2000
}

/**
 * Example 3: Authenticated API with Headers
 * 
 * Polls an API with authentication token in headers
 */
export const example3AuthenticatedConfig: StreamingConfig = {
  endpoint: 'https://api.example.com/v1/logs',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'X-API-Key': 'your-api-key-here',
    'Content-Type': 'application/json'
  },
  pollingInterval: 10000,
  retryAttempts: 3
}

/**
 * Example 4: Custom Log Parser
 * 
 * Parses API response with non-standard format
 */
export const example4CustomParserConfig: StreamingConfig = {
  endpoint: 'https://api.example.com/events',
  method: 'GET',
  pollingInterval: 5000,
  parser: (data: unknown) => {
    // Handle nested response structure
    const response = data as {
      data: {
        events: Array<{
          id: string
          createdAt: string
          type: string
          service: string
          description: string
        }>
      }
    }

    return response.data.events.map(event => ({
      id: event.id,
      timestamp: event.createdAt,
      level: mapEventTypeToLevel(event.type),
      source: event.service,
      message: event.description,
      metadata: event
    }))
  }
}

function mapEventTypeToLevel(type: string): 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG' | 'TRACE' {
  const mapping: Record<string, 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG' | 'TRACE'> = {
    'error': 'ERROR',
    'critical': 'ERROR',
    'warning': 'WARNING',
    'warn': 'WARNING',
    'info': 'INFO',
    'information': 'INFO',
    'debug': 'DEBUG',
    'trace': 'TRACE'
  }
  return mapping[type.toLowerCase()] || 'INFO'
}

/**
 * Example 5: POST Request with Payload
 * 
 * Sends a POST request to fetch logs with specific filters
 */
export const example5PostConfig: StreamingConfig = {
  endpoint: 'https://api.example.com/logs/query',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token...'
  },
  pollingInterval: 3000,
  retryAttempts: 3
  // Note: To send a POST body, you would need to extend StreamingConfig
  // or use a custom parser wrapper
}

/**
 * Example 6: High-Frequency Polling
 * 
 * Fast polling for development/testing environments
 */
export const example6DevelopmentConfig: StreamingConfig = {
  endpoint: 'http://localhost:3000/api/logs',
  method: 'GET',
  pollingInterval: 2000,  // 2 seconds
  retryAttempts: 2,
  retryDelay: 1000
}

/**
 * Example 7: Production Configuration
 * 
 * Conservative settings for production use
 */
export const example7ProductionConfig: StreamingConfig = {
  endpoint: 'https://logs.production.example.com/stream',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer prod-token',
    'User-Agent': 'App4Logs/1.0',
    'X-Request-Source': 'log-analyzer'
  },
  pollingInterval: 15000,  // 15 seconds
  retryAttempts: 5,
  retryDelay: 5000        // 5 second base delay with exponential backoff
}

/**
 * Example 8: Multiple Source Aggregation
 * 
 * Parser that handles responses from multiple log sources
 */
export const example8AggregationConfig: StreamingConfig = {
  endpoint: 'https://api.example.com/logs/aggregated',
  method: 'GET',
  pollingInterval: 5000,
  parser: (data: unknown) => {
    const response = data as {
      logs: Array<{
        id: string
        ts: string
        lvl: string
        src: string
        msg: string
      }>
    }

    return response.logs.map(log => ({
      id: log.id,
      timestamp: new Date(log.ts).toISOString(),
      level: log.lvl.toUpperCase() as any,
      source: log.src,
      message: log.msg,
      metadata: log
    }))
  }
}

/**
 * Example Usage in a React Component
 * 
 * Shows how to use the real-time streaming in a component
 */
export const componentExample = `
import React, { useState } from 'react'
import { useRealtimeLogStream } from './hooks/useRealtimeLogStream'
import { RealtimeLogInput } from './components/RealtimeLogInput'
import { example1PollingConfig } from './examples'

function LogStreamComponent() {
  const { logs, status, connect, disconnect } = useRealtimeLogStream(
    (newLogs) => {
      console.log(\`Received \${newLogs.length} new logs\`)
    },
    5000 // Max 5000 logs in memory
  )

  const handleQuickConnect = async () => {
    try {
      await connect(example1PollingConfig)
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  return (
    <div>
      <RealtimeLogInput
        onConnect={connect}
        isConnected={status.isConnected}
        isConnecting={status.isLoading}
        error={status.error}
        onDisconnect={disconnect}
      />

      <button onClick={handleQuickConnect}>
        Quick Connect (Example)
      </button>

      {status.isConnected && (
        <div>
          <p>Connected! Received {logs.length} logs</p>
          <p>Last update: {status.lastUpdate?.toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  )
}

export default LogStreamComponent
`

/**
 * Common API Endpoints to Test With
 * 
 * These are publicly available APIs you can use for testing
 */
export const testApiExamples = {
  // JSONPlaceholder - Mock API
  jsonplaceholder: {
    endpoint: 'https://jsonplaceholder.typicode.com/logs',
    description: 'Mock API (requires parsing)'
  },

  // httpbin.org - Request inspection service
  httpbin: {
    endpoint: 'https://httpbin.org/json',
    description: 'Returns JSON object'
  },

  // Local development server example
  localhost: {
    endpoint: 'http://localhost:3000/api/logs',
    description: 'Local Node.js/Express server'
  },

  // AWS API Gateway example
  awsApiGateway: {
    endpoint: 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/logs',
    headers: {
      'Authorization': 'Bearer your-token'
    }
  },

  // Firebase Realtime Database (REST API)
  firebase: {
    endpoint: 'https://your-project.firebaseio.com/logs.json',
    headers: {
      'Authorization': 'Bearer your-firebase-token'
    }
  }
}

/**
 * Debugging Tips
 * 
 * Enable verbose logging in the console:
 */
export function enableDebugLogging() {
  if (typeof window !== 'undefined') {
    ;(window as any).DEBUG_STREAMING = true

    // Override console methods to add timestamps
    const originalLog = console.log
    console.log = (...args) => {
      originalLog(new Date().toISOString(), ...args)
    }
  }
}

/**
 * Configuration Validator
 * 
 * Validates streaming configuration before use
 */
export function validateStreamingConfig(config: StreamingConfig): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check endpoint
  if (!config.endpoint) {
    errors.push('Endpoint is required')
  } else {
    try {
      new URL(config.endpoint)
    } catch {
      errors.push('Endpoint must be a valid URL')
    }
  }

  // Check polling interval
  if (!config.useWebSocket && config.pollingInterval && config.pollingInterval < 1000) {
    errors.push('Polling interval must be at least 1000ms')
  }

  // Check retry attempts
  if (config.retryAttempts && config.retryAttempts < 0) {
    errors.push('Retry attempts cannot be negative')
  }

  // Check headers
  if (config.headers) {
    if (typeof config.headers !== 'object') {
      errors.push('Headers must be an object')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export default {
  example1PollingConfig,
  example2WebSocketConfig,
  example3AuthenticatedConfig,
  example4CustomParserConfig,
  example5PostConfig,
  example6DevelopmentConfig,
  example7ProductionConfig,
  example8AggregationConfig,
  componentExample,
  testApiExamples,
  enableDebugLogging,
  validateStreamingConfig
}

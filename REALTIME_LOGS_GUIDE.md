# Real-time Log Streaming Implementation

## Overview

A comprehensive real-time log streaming solution has been added to the App4Logs application, enabling users to connect to API endpoints and receive live log updates via WebSocket or polling mechanisms.

## Features

### 1. **Multiple Connection Types**
- **WebSocket**: For true real-time bidirectional communication
- **Polling**: For REST API endpoints that don't support WebSocket
- **Auto-retry**: Configurable retry mechanism for resilience

### 2. **Flexible Configuration**
- Custom API endpoints (HTTP/HTTPS or WebSocket)
- HTTP method selection (GET/POST)
- Custom headers for authentication
- Configurable polling intervals
- Retry attempts and delays

### 3. **Log Management**
- Automatic log normalization from various API formats
- Memory-efficient log storage (configurable limits)
- Real-time log streaming with append/replace modes
- Thread-safe log updates

### 4. **Error Handling & Monitoring**
- Comprehensive error tracking and reporting
- Real-time status updates (connected, loading, error states)
- Telemetry logging for streaming events
- User-friendly error messages

## Architecture

### Core Components

#### 1. **logStreamingService.ts** (`src/services/logStreamingService.ts`)

The main service that handles all streaming operations.

**Key Classes:**
- `LogStreamingService`: Singleton service for managing connections

**Methods:**
- `startStream(config)`: Establish connection to API
- `stopStream()`: Close connection and cleanup
- `onStream(callback)`: Subscribe to log updates
- `onStatusChange(callback)`: Subscribe to status changes
- `onError(callback)`: Subscribe to error events
- `getStatus()`: Get current connection status

**Features:**
```typescript
// WebSocket Support
- Automatic WebSocket URL conversion (http → ws)
- Header transmission for authentication
- Auto-reconnect with exponential backoff

// Polling Support
- Interval-based fetch requests
- Response parsing and normalization
- Duplicate handling in polling mode

// Log Parsing
- Custom parser support
- Automatic field normalization
- Multiple log format detection
```

#### 2. **RealtimeLogInput.tsx** (`src/components/RealtimeLogInput.tsx`)

User interface component for configuring and managing real-time connections.

**Features:**
- Endpoint URL input with validation
- Connection type selector (WebSocket/Polling)
- Polling interval configuration
- Advanced options (headers, retry attempts, HTTP method)
- Connection status indicator
- Error display
- Connect/Disconnect controls

**Props:**
```typescript
interface RealtimeLogInputProps {
  onConnect: (config: StreamingConfig) => void
  isConnecting?: boolean
  isConnected?: boolean
  error?: string | null
  onDisconnect?: () => void
}
```

#### 3. **useRealtimeLogStream.ts** (`src/hooks/useRealtimeLogStream.ts`)

Custom React hook for managing real-time streaming in components.

**Return Value:**
```typescript
interface UseRealtimeLogStreamResult {
  logs: LogEntry[]
  status: StreamingStatus
  connect: (config: StreamingConfig) => Promise<void>
  disconnect: () => void
  clearLogs: () => void
  maxLogsInMemory?: number
}
```

**Features:**
- Automatic subscription/unsubscription
- Memory-efficient log storage
- Cleanup on component unmount
- Status and error tracking
- Parent callback support for custom log handling

#### 4. **Types** (`src/types/index.ts`)

**StreamingConfig:**
```typescript
interface StreamingConfig {
  endpoint: string           // Required: API endpoint URL
  method?: 'GET' | 'POST'   // HTTP method (default: GET)
  headers?: Record<string, string>  // Custom headers
  pollingInterval?: number   // Polling interval in ms (default: 5000)
  useWebSocket?: boolean     // Use WebSocket (default: false)
  parser?: (data: unknown) => LogEntry[] | LogEntry  // Custom log parser
  retryAttempts?: number     // Max retry attempts (default: 3)
  retryDelay?: number        // Retry delay in ms (default: 3000)
}
```

**StreamingStatus:**
```typescript
interface StreamingStatus {
  isConnected: boolean       // Connection state
  isLoading: boolean         // Loading/connecting state
  error: string | null       // Error message if any
  lastUpdate?: Date          // Last update timestamp
  messagesReceived?: number  // Total messages received
}
```

## Usage Examples

### Basic Usage - Polling

```typescript
import { useRealtimeLogStream } from './hooks/useRealtimeLogStream'

function MyComponent() {
  const { logs, status, connect, disconnect } = useRealtimeLogStream()

  const handleConnect = async () => {
    await connect({
      endpoint: 'https://api.example.com/logs',
      method: 'GET',
      pollingInterval: 5000
    })
  }

  return (
    <div>
      <button onClick={handleConnect}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
      <p>Status: {status.isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Logs: {logs.length}</p>
    </div>
  )
}
```

### WebSocket Connection with Custom Headers

```typescript
const config: StreamingConfig = {
  endpoint: 'wss://api.example.com/logs',
  useWebSocket: true,
  headers: {
    'Authorization': 'Bearer token123',
    'X-API-Key': 'your-api-key'
  }
}

await realtimeStream.connect(config)
```

### Custom Log Parser

```typescript
const config: StreamingConfig = {
  endpoint: 'https://api.example.com/logs',
  parser: (data: unknown) => {
    // data might be an object with a 'items' property
    const apiResponse = data as { items: any[] }
    return apiResponse.items.map(item => ({
      id: item.logId,
      timestamp: item.createdAt,
      level: item.severity,
      source: item.service,
      message: item.description,
      metadata: item
    }))
  }
}
```

### Integration in App.tsx

The App component now includes real-time streaming:

```tsx
function AppContent() {
  // ... other state ...
  
  // Real-time streaming hook with 10,000 log limit
  const realtimeStream = useRealtimeLogStream((newLogs) => {
    // Handle new logs
    setLogs(prevLogs => [...prevLogs, ...newLogs])
  }, 10000)

  // Handle connection
  const handleRealtimeConnect = async (config: StreamingConfig) => {
    setUseRealtimeMode(true)
    await realtimeStream.connect(config)
  }

  // Handle disconnection
  const handleRealtimeDisconnect = () => {
    realtimeStream.disconnect()
    setUseRealtimeMode(false)
  }

  return (
    <RealtimeLogInput
      onConnect={handleRealtimeConnect}
      isConnecting={realtimeStream.status.isLoading}
      isConnected={realtimeStream.status.isConnected}
      error={realtimeStream.status.error}
      onDisconnect={handleRealtimeDisconnect}
    />
  )
}
```

## API Response Format Support

The streaming service automatically normalizes logs from various formats:

### JSON Array
```json
[
  {
    "id": "log-1",
    "timestamp": "2024-02-06T10:30:00Z",
    "level": "ERROR",
    "source": "api-service",
    "message": "Database connection failed"
  }
]
```

### Single Log Object
```json
{
  "timestamp": "2024-02-06T10:30:00Z",
  "severity": "ERROR",
  "logger": "api-service",
  "msg": "Database connection failed"
}
```

### Alternative Field Names (Auto-normalized)
- `timestamp`, `time`, `date` → timestamp
- `level`, `severity` → level
- `source`, `logger`, `service` → source
- `message`, `msg`, `text` → message

## Error Handling

The service provides comprehensive error handling:

```typescript
// Subscribe to errors
const unsubscribe = logStreamingService.onError((error) => {
  console.error('Streaming error:', error.message)
})

// Or via hook
const { status } = useRealtimeLogStream()
if (status.error) {
  console.error('Error:', status.error)
}
```

## Performance Considerations

1. **Memory Management**
   - Default log limit: 10,000 logs
   - Configurable per hook instantiation
   - Oldest logs are discarded when limit exceeded

2. **Polling Optimization**
   - Minimum interval: 1,000ms (frontend validation)
   - Recommended: 5,000ms or higher
   - No duplicate log tracking in polling mode

3. **WebSocket Benefits**
   - True real-time delivery
   - Bidirectional communication
   - Lower latency than polling

4. **Retry Strategy**
   - Exponential backoff: delay × attempt count
   - Default: 3 attempts with 3,000ms base delay
   - Total max wait: 27,000ms (3 + 6 + 9 seconds)

## Telemetry Events

The following events are logged for monitoring:

```
realtime_stream_connect       - Connection initiated
realtime_stream_started       - Stream successfully started
realtime_logs_received        - Logs received from API
realtime_stream_error         - Error during streaming
realtime_stream_disconnect    - Connection closed
realtime_logs_cleared         - Logs cleared by user
```

## Configuration Best Practices

### For Production APIs
```typescript
{
  endpoint: 'https://api.production.com/logs',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer {token}',
    'User-Agent': 'App4Logs/1.0'
  },
  pollingInterval: 10000,    // 10 seconds
  retryAttempts: 5,
  retryDelay: 5000
}
```

### For WebSocket (Real-time)
```typescript
{
  endpoint: 'wss://stream.production.com/logs',
  useWebSocket: true,
  headers: {
    'Authorization': 'Bearer {token}'
  },
  retryAttempts: 3,
  retryDelay: 3000
}
```

### For Development/Testing
```typescript
{
  endpoint: 'http://localhost:3000/logs',
  method: 'GET',
  pollingInterval: 3000,     // 3 seconds
  retryAttempts: 2
}
```

## Troubleshooting

### Connection fails immediately
- Verify endpoint URL is correct
- Check CORS headers if using browser
- Ensure API is accessible and running

### No logs appearing
- Check custom parser if provided
- Verify API response format matches expected structure
- Check browser console for parsing errors

### High memory usage
- Reduce `maxLogsInMemory` in hook
- Increase polling interval to receive fewer logs
- Consider filtering logs on API side

### WebSocket not connecting
- Ensure WebSocket protocol is supported (wss for HTTPS)
- Check for proxy/firewall blocking WebSocket
- Fall back to polling if WebSocket unavailable

## Future Enhancements

Potential improvements for future versions:

1. **Filters at Stream Level**: Filter logs before they reach the client
2. **Compression**: gzip compression for polling responses
3. **Authentication Presets**: Saved connection profiles
4. **Log Buffering**: Batch processing for high-frequency streams
5. **Backpressure Handling**: Managing fast log streams
6. **Persistent Storage**: Optional IndexedDB for offline access
7. **Stream Analytics**: Real-time statistics from streaming logs
8. **Custom Transformers**: User-defined log transformations

## Migration from File Upload

Users can now:
1. Upload historical logs via FileUpload (existing functionality)
2. Stream live logs via RealtimeLogInput (new functionality)
3. Mix both: Upload past logs and stream new ones in parallel

## Browser Compatibility

- **WebSocket**: Supported in all modern browsers (IE 10+)
- **Fetch/Polling**: Supported in all modern browsers
- **Fallback**: System automatically uses polling if WebSocket unavailable

# Error Handling & Recovery Guide

This guide explains the comprehensive error handling system implemented in the Log Analyzer application.

## Architecture Overview

The error handling system consists of three layers:

1. **Error Boundary** - React-level crash prevention
2. **Error Recovery** - Graceful error UI with retry mechanisms
3. **Telemetry** - Automatic error tracking and analytics

## 1. React Error Boundary

The `ErrorBoundary` component catches all React rendering errors and prevents white-screen crashes.

### Features

- ✅ Catches all child component errors
- ✅ Displays graceful error UI
- ✅ Auto-reports to Sentry and LogRocket
- ✅ Session recording (LogRocket integration)
- ✅ Retry and reload options
- ✅ Error count tracking with warnings

### Usage

```tsx
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <YourAppContent />
    </ErrorBoundary>
  )
}
```

### How it Works

```tsx
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  // 1. Reports to Sentry
  Sentry.captureException(error)
  
  // 2. Records to LogRocket
  LogRocket.captureException(error)
  
  // 3. Displays graceful UI to user
  // 4. Shows session URL if LogRocket available
}
```

## 2. Error Recovery Component

The `ErrorRecovery` component provides context-aware error messages with automatic retry logic.

### Error Contexts

- `upload` - File upload errors (red)
- `parsing` - Log parsing errors (orange)
- `filtering` - Filter operation errors (yellow)
- `export` - Export operation errors (red)
- `network` - Network connectivity errors (red)
- `unknown` - Generic errors (gray)

### Usage

```tsx
import { ErrorRecovery, useErrorRecovery } from './components/ErrorRecovery'

function MyComponent() {
  const { error, showError, clearError } = useErrorRecovery()

  const handleUpload = async (file: File) => {
    try {
      // ... upload logic
    } catch (err) {
      showError(err, 'upload', async () => {
        // Retry logic
        await handleUpload(file)
      })
    }
  }

  return (
    <>
      {error && (
        <ErrorRecovery
          error={error.message}
          context={error.context}
          onRetry={error.retryFn}
          onDismiss={clearError}
        />
      )}
      {/* Component UI */}
    </>
  )
}
```

### Features

- ✅ Context-aware error messages
- ✅ Automatic retry with count tracking (max 3 attempts)
- ✅ Error type specific icons and colors
- ✅ Helpful recovery suggestions
- ✅ Auto-dismissal support
- ✅ Full error reporting integration

## 3. Telemetry & Error Tracking

The `telemetry.ts` module integrates with Sentry and LogRocket for comprehensive error tracking.

### Sentry Integration

Sentry captures all errors with full stack traces and context.

#### Setup

```typescript
import { initErrorTracking } from './utils/telemetry'

// Call once on app startup
initErrorTracking()
```

#### Reporting Errors

```typescript
import { reportError } from './utils/telemetry'

try {
  // code
} catch (error) {
  reportError(error, {
    context: 'my_operation',
    userId: user.id,
  })
}
```

### LogRocket Integration

LogRocket records user sessions with full reproduceability.

#### Features

- **Session Recording**: Captures DOM changes, network requests, console logs
- **User Identification**: Link sessions to user IDs
- **Masked Sensitive Data**: Auto-masks inputs, sensitive elements

#### Setup

```typescript
import { setUserContext, getSessionUrl } from './utils/telemetry'

// Set user context
setUserContext('user123', {
  name: 'John Doe',
  email: 'john@example.com',
})

// Get session URL for support
const sessionUrl = getSessionUrl()
// Share with support team
```

### Available Telemetry Functions

#### Error Tracking

```typescript
// Report an error
reportError(new Error('Upload failed'), {
  fileName: 'app.log',
  fileSize: 1024,
})

// Track warnings
trackWarning('High memory usage detected', {
  memory: 512,
})
```

#### Analytics

```typescript
// Track events
trackEvent('user_uploaded_file', {
  fileName: 'app.log',
  size: 1024,
  format: 'json',
})

// Track user actions
logUserAction('logs_filtered', {
  filterCount: 3,
  resultCount: 150,
})
```

#### Performance Monitoring

```typescript
// Mark performance point
markPerformance('parse-start')

// ... do work ...

// Measure performance
measurePerformance('parse-duration', 'parse-start', 'parse-end')
// Auto-reports: { metric: 'parse-duration', value: 234, unit: 'ms' }
```

#### User Context

```typescript
// Set user information
setUserContext('user123', {
  name: 'John Doe',
  email: 'john@example.com',
  plan: 'pro',
})

// Get session URL
const sessionUrl = getSessionUrl()
```

## 4. Enhanced FileUpload Component

The `FileUpload` component includes comprehensive error handling:

### Error Handling Flow

```
1. File Selection
   ↓
2. Validation (size, extension)
   ├─ PASS → Continue
   └─ FAIL → Show error
3. File Reading
   ├─ SUCCESS → Continue
   └─ ERROR → Show error with retry
4. Log Parsing
   ├─ SUCCESS → Load logs
   └─ ERROR → Show error with retry
5. Display Results
   ├─ LOGS FOUND → Show filtered view
   └─ NO LOGS → Show error message
```

### Error Types

| Error | Context | Retry | Suggestion |
|-------|---------|-------|-----------|
| File too large (>100MB) | upload | No | Split into smaller files |
| Invalid file extension | upload | No | Upload .log, .json, .csv, .xml, .txt |
| File read failed | upload | Yes | Check file permissions |
| Parsing failed | parsing | Yes | Verify log format |
| No logs found | parsing | No | Check file content |
| Network error | network | Yes | Check connection |

## 5. Environment Configuration

### Required Environment Variables

```bash
# .env.local
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_LOGROCKET_ID=app-id
VITE_API_ERROR_ENDPOINT=https://api.example.com/errors
```

### Setup Instructions

1. **Copy .env.example**
   ```bash
   cp .env.example .env.local
   ```

2. **Get Sentry DSN**
   - Go to https://sentry.io
   - Create project
   - Copy DSN from Settings → Projects → [Project] → Client Keys (DSN)

3. **Get LogRocket ID**
   - Go to https://logrocket.com
   - Create project
   - Copy App ID from Settings

4. **Restart dev server**
   ```bash
   npm run dev
   ```

## 6. Error Recovery Best Practices

### In Custom Components

```tsx
import { useErrorRecovery } from './components/ErrorRecovery'
import { reportError, trackEvent } from './utils/telemetry'

function MyComponent() {
  const { error, showError, clearError } = useErrorRecovery()

  const handleAction = async () => {
    try {
      trackEvent('action_started')
      await performAction()
      trackEvent('action_completed')
    } catch (err) {
      const retryFn = async () => {
        trackEvent('action_retry')
        await performAction()
      }
      showError(err, 'upload', retryFn)
    }
  }

  return (
    <>
      {error && (
        <ErrorRecovery
          error={error.message}
          context={error.context}
          onRetry={error.retryFn}
          onDismiss={clearError}
        />
      )}
      <button onClick={handleAction}>Perform Action</button>
    </>
  )
}
```

### Error Context Selection

- Use `context` parameter to match the operation type
- Provides better error messages and icons
- Helps with analytics and debugging

```typescript
// ✅ Good
showError(error, 'parsing', retryFn)
showError(error, 'upload', retryFn)

// ❌ Avoid
showError(error, 'unknown', undefined)
```

## 7. Monitoring & Debugging

### Local Development

Errors are logged to console with `[Error Report]` prefix:

```
[Error Report] {
  message: "Failed to parse file",
  stack: "...",
  context: { fileName: "app.log", ... }
}
```

### Production Monitoring

1. **Sentry Dashboard**
   - View all errors by type/severity
   - See stack traces and context
   - Set up alerts for critical errors

2. **LogRocket Dashboard**
   - Replay user sessions
   - See what user did before error
   - Identify session-specific patterns

3. **Custom API Endpoint**
   - Receive POST requests with errors
   - Log to custom analytics service
   - Process and alert

## 8. Common Error Scenarios

### Scenario: Large File Upload

**Error**: File too large
**Solution**: Show message, suggest splitting file
**Code**:
```typescript
const validation = validateFile(file)
if (!validation.valid) {
  showError(validation.error, 'upload')
}
```

### Scenario: Unsupported Format

**Error**: No valid logs found
**Solution**: Show supported formats, suggest checking file
**Code**:
```typescript
if (logs.length === 0) {
  showError('No valid logs found. Please check the file format.', 'parsing')
}
```

### Scenario: Network Failure

**Error**: API call failed
**Solution**: Show retry button, check connection
**Code**:
```typescript
const retryFn = async () => {
  return await fetchData()
}
showError(error, 'network', retryFn)
```

## 9. Analytics & Metrics

### Key Events to Track

```typescript
// User uploads file
logUserAction('file_uploaded', {
  fileName: 'app.log',
  size: 1024,
  format: 'json',
  logCount: 500,
})

// Error occurs
logUserAction('error_occurred', {
  type: 'parsing_error',
  fileName: 'app.log',
})

// User retries
logUserAction('error_retry', {
  context: 'upload',
  retryCount: 2,
})
```

### Metrics Dashboard

Recommended Sentry dashboard setup:

- Error count by type
- Top 10 errors
- Errors over time
- Error rate trends
- User impact (affected sessions)

## 10. Testing Error Scenarios

### Test Error Boundary

```tsx
// App.tsx - Uncomment to test
function BuggyComponent() {
  throw new Error('Test error boundary')
}

// In AppContent
return <BuggyComponent /> // Will be caught by ErrorBoundary
```

### Test Error Recovery

```tsx
const { showError } = useErrorRecovery()

// Show error
showError(new Error('Test error'), 'upload')

// Click retry/dismiss
```

### Test Telemetry

```typescript
// In console
import { reportError, trackEvent } from './utils/telemetry'
reportError(new Error('Test'), { test: true })
trackEvent('test_event', { data: 'value' })

// Check Sentry and LogRocket dashboards
```

## Summary

The error handling system provides:

- ✅ **Crash Prevention** - ErrorBoundary catches all React errors
- ✅ **Graceful Recovery** - ErrorRecovery shows helpful messages
- ✅ **Automatic Tracking** - Sentry/LogRocket record all errors
- ✅ **User Context** - Session recording with full reproduceability
- ✅ **Analytics** - Track errors, performance, user actions
- ✅ **Best UX** - Context-aware errors with retry mechanisms

For issues or questions, refer to:
- Sentry: https://docs.sentry.io/
- LogRocket: https://docs.logrocket.com/
- React Error Boundaries: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary

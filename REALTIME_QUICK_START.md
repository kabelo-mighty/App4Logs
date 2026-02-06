# Real-time Logs Quick Start Guide

Get real-time logs streaming into your App4Logs application in 5 minutes.

## 🚀 Quick Start

### Step 1: Access the UI
Open your App4Logs application and scroll down past the **File Upload** section. You'll see the new **Real-time Logs** panel.

### Step 2: Enter Your API Endpoint
```
API Endpoint: https://api.your-server.com/logs
```

### Step 3: Choose Connection Type
- **Polling** (default): Good for REST APIs - fetches new logs at intervals
- **WebSocket**: Better for real-time - establishes persistent connection

### Step 4: Set Polling Interval (if using Polling)
- Recommended: 5000ms (5 seconds) for production
- Minimum: 1000ms

### Step 5: Add Headers (Optional)
If your API requires authentication, click "Advanced Options" and add headers:
```json
{
  "Authorization": "Bearer your-token-here",
  "X-API-Key": "your-api-key"
}
```

### Step 6: Click Connect
The application will start fetching/streaming logs in real-time.

## 📋 Common Scenarios

### Scenario 1: REST API (Polling)
```
Endpoint: https://logs.example.com/api/logs
Connection: Polling
Interval: 5000ms
Method: GET
```

### Scenario 2: WebSocket Server
```
Endpoint: wss://stream.example.com/logs
Connection: WebSocket
Authentication: (add Bearer token in headers)
```

### Scenario 3: Cloud Logging Service
```
Endpoint: https://logging-service.com/v1/logs
Connection: Polling
Headers:
{
  "Authorization": "Bearer cloud-token",
  "X-Service-ID": "my-service"
}
```

### Scenario 4: Local Development
```
Endpoint: http://localhost:3000/api/logs
Connection: Polling
Interval: 3000ms
```

## 🧪 Test with Public APIs

### JSONPlaceholder (Mock API)
```
Endpoint: https://jsonplaceholder.typicode.com/logs
Connection: Polling
Interval: 5000ms
Note: Requires custom parser
```

### Local Test Server
Create a simple Node.js server:
```javascript
const express = require('express');
const app = express();

app.get('/api/logs', (req, res) => {
  res.json([
    {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      level: 'INFO',
      source: 'test-server',
      message: 'Sample log entry'
    }
  ]);
});

app.listen(3000, () => console.log('Server on :3000'));
```

Then connect with:
```
Endpoint: http://localhost:3000/api/logs
Connection: Polling
Interval: 3000ms
```

## 🔐 Authentication Examples

### Bearer Token
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### API Key
```json
{
  "X-API-Key": "sk-1234567890abcdef"
}
```

### Basic Auth (Base64 encoded)
```json
{
  "Authorization": "Basic dXNlcm5hbWU6cGFzc3dvcmQ="
}
```

### Multiple Headers
```json
{
  "Authorization": "Bearer token",
  "X-API-Key": "api-key",
  "User-Agent": "App4Logs/1.0",
  "X-Custom-Header": "custom-value"
}
```

## 🎯 What You Can Do

Once connected, all existing App4Logs features work with real-time logs:

✅ **View Logs** - Logs appear in real-time as they're received
✅ **Filter** - Use the filter panel to search/filter logs
✅ **Statistics** - View real-time statistics (ERROR, WARNING, etc.)
✅ **Export** - Export real-time logs to JSON/CSV
✅ **Search** - Full-text search across incoming logs
✅ **Sort** - Sort by any field

## ⚠️ Important Notes

### Connection Management
- Only one real-time stream can be active at a time
- Disconnect before connecting to a different API
- The application will auto-retry 3 times if connection fails

### Memory Usage
- Logs are kept in memory (default: 10,000 logs)
- Oldest logs are automatically removed when limit is reached
- For high-volume streams, consider filtering on the API side

### Performance
- Use WebSocket for true real-time (lower latency)
- Use Polling for simpler REST APIs
- Adjust polling interval based on needs:
  - 3-5 seconds: High-frequency monitoring
  - 10-30 seconds: General monitoring
  - 60+ seconds: Low-frequency checks

### CORS Issues
If you get a "CORS" error:
1. Make sure the API supports browser requests
2. Check that Access-Control-Allow-Origin headers are set
3. Contact your API provider to enable CORS
4. Use a CORS proxy if API doesn't support it (not recommended for production)

## 🛠️ Troubleshooting

### "Connection failed immediately"
- ✓ Check endpoint URL is correct
- ✓ Check API is running and accessible
- ✓ Verify network connectivity
- ✓ Check browser console for detailed errors

### "No logs appearing"
- ✓ Check polling interval isn't too long
- ✓ Verify API is returning logs
- ✓ Check API response format matches expected structure
- ✓ Use browser DevTools Network tab to inspect API responses

### "Connection drops frequently"
- ✓ Try increasing polling interval
- ✓ Check API server health
- ✓ Verify network stability
- ✓ Check retry attempts and delay settings

### "Too much memory usage"
- ✓ Reduce max logs in memory
- ✓ Increase polling interval (fewer fetches)
- ✓ Filter logs on API side
- ✓ Disconnect and reconnect periodically

## 💡 Tips & Tricks

### Tip 1: Filter Streams by Level
Connect to API, then use the Filter panel to show only ERROR logs:
```
Levels: ERROR
```

### Tip 2: Search in Real-time
Use the search/keyword filter to find specific messages while stream is active:
```
Keyword: "database"
```

### Tip 3: Monitor Multiple Services
1. Upload historical logs from one service
2. Stream real-time logs from another service
3. Compare and analyze both datasets

### Tip 4: Export Snapshots
At any time during streaming, export current logs to CSV/JSON for analysis or sharing.

### Tip 5: Custom Refresh Rates
- Very fast (1-2 sec): Aggressive monitoring, higher CPU
- Balanced (5-10 sec): Standard monitoring
- Slow (30+ sec): Occasional checks, minimal CPU

## 📊 Example Response Formats

### Standard JSON Array
```json
[
  {
    "id": "log-123",
    "timestamp": "2024-02-06T10:30:00Z",
    "level": "ERROR",
    "source": "api-service",
    "message": "Connection timeout"
  },
  {
    "id": "log-124",
    "timestamp": "2024-02-06T10:31:00Z",
    "level": "INFO",
    "source": "api-service",
    "message": "Request processed successfully"
  }
]
```

### Nested Structure (requires custom parser)
```json
{
  "status": "success",
  "data": {
    "logs": [
      {
        "logId": "123",
        "timestamp": "2024-02-06T10:30:00Z",
        "severity": "ERROR",
        "service": "api",
        "description": "Connection timeout"
      }
    ]
  }
}
```

## 🔗 Documentation Links

- **Full Guide**: See `REALTIME_LOGS_GUIDE.md` for complete documentation
- **Code Examples**: Check `src/examples/realtimeExamples.ts` for 8+ examples
- **API Types**: See `src/types/index.ts` for type definitions
- **Implementation**: See `src/services/logStreamingService.ts` for internals

## 📞 Getting Help

### Check These Resources
1. Browser Developer Tools → Console (for error messages)
2. Network tab (to inspect API calls)
3. Application tab → Local Storage (to see stored logs)

### Common Error Messages
- **"Invalid URL"** - Check endpoint format
- **"CORS error"** - API doesn't support browser requests
- **"401 Unauthorized"** - Check authentication headers
- **"Connection timeout"** - API is slow or unreachable

## 🎓 Next Steps

1. **Test Locally** - Use the local server example above
2. **Try Public APIs** - Test with JSONPlaceholder
3. **Connect to Your API** - Configure your actual log source
4. **Monitor Production** - Deploy for production monitoring
5. **Automate** - Integrate into monitoring workflows

---

**Enjoy real-time log streaming in App4Logs! 🎉**

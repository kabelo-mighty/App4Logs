# Dummy API Server (for App4Logs testing)

This tiny server provides two endpoints for testing real-time log streaming:

- `GET /logs`  — returns the last 50 logs as JSON (use for polling)
- `GET /sse`   — Server-Sent Events stream that emits one log per second

No dependencies required — just run with Node.js (v12+).

Run:

```bash
node dev/dummy-server/server.js
```

Open in browser or your app:

- Polling: `http://localhost:4000/logs` (use `Polling` mode, `GET`, interval `2000`)
- SSE (for browsers or tools that support it): `http://localhost:4000/sse`

CORS is enabled for quick local testing.

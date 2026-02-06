const http = require('http')
const url = require('url')

const PORT = process.env.PORT || 4000

const LEVELS = ['ERROR','WARNING','INFO','DEBUG','TRACE']

let logs = []
let counter = 1

function randomLevel(){
  return LEVELS[Math.floor(Math.random()*LEVELS.length)]
}

function generateLog(){
  const now = new Date()
  const log = {
    id: `dummy-${Date.now()}-${counter++}`,
    timestamp: now.toISOString(),
    level: randomLevel(),
    source: 'dummy-api',
    message: `Dummy log message ${Math.floor(Math.random()*1000)}`,
    metadata: { sample: true }
  }
  return log
}

// keep generating logs in background so polling returns new items
setInterval(() => {
  const l = generateLog()
  logs.push(l)
  if (logs.length > 1000) logs.shift()
}, 1000)

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true)
  const path = parsed.pathname || '/'

  // Allow CORS for testing
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }

  if (path === '/logs') {
    // Return last 50 logs by default
    const last = logs.slice(-50)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify(last))
  }

  if (path === '/sse') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    })

    const id = setInterval(() => {
      const log = generateLog()
      logs.push(log)
      if (logs.length > 1000) logs.shift()
      res.write(`data: ${JSON.stringify(log)}\n\n`)
    }, 1000)

    req.on('close', () => {
      clearInterval(id)
    })

    return
  }

  // Default response
  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('Not found')
})

server.listen(PORT, () => {
  console.log(`Dummy server running at http://localhost:${PORT}`)
  console.log('Endpoints:')
  console.log(`  GET  /logs   -> returns last 50 logs (JSON)`) 
  console.log(`  GET  /sse    -> Server-Sent Events stream (one log/sec)`) 
})

import { LogEntry, LogLevel } from '../types'

export class LogParser {
  static parseFile(content: string, fileName: string): LogEntry[] {
    const ext = fileName.split('.').pop()?.toLowerCase()

    switch (ext) {
      case 'json':
        return this.parseJSON(content)
      case 'csv':
        return this.parseCSV(content)
      case 'xml':
        return this.parseXML(content)
      default:
        return this.parsePlainText(content)
    }
  }

  private static parseJSON(content: string): LogEntry[] {
    try {
      const data = JSON.parse(content)
      const logsArray = Array.isArray(data) ? data : [data]
      return logsArray.map((log, idx) => this.normalizeLogEntry(log, idx))
    } catch {
      return this.parsePlainText(content)
    }
  }

  private static parseCSV(content: string): LogEntry[] {
    const lines = content.split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const logs: LogEntry[] = []

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      const values = this.parseCSVLine(lines[i])
      const log: Record<string, unknown> = {}

      headers.forEach((header, idx) => {
        log[header] = values[idx] || ''
      })

      logs.push(this.normalizeLogEntry(log, i))
    }

    return logs
  }

  private static parseCSVLine(line: string): string[] {
    const result = []
    let current = ''
    let insideQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        insideQuotes = !insideQuotes
      } else if (char === ',' && !insideQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }

  private static parseXML(content: string): LogEntry[] {
    const logs: LogEntry[] = []
    const logPattern = /<log[^>]*>([\s\S]*?)<\/log>/gi
    let match

    while ((match = logPattern.exec(content)) !== null) {
      const logContent = match[1]
      const log: Record<string, unknown> = {}

      const fieldPattern = /<([^>]+)>([^<]*)<\/\1>/g
      let fieldMatch

      while ((fieldMatch = fieldPattern.exec(logContent)) !== null) {
        log[fieldMatch[1].toLowerCase()] = fieldMatch[2]
      }

      logs.push(this.normalizeLogEntry(log, logs.length))
    }

    return logs
  }

  private static parsePlainText(content: string): LogEntry[] {
    const lines = content.split('\n')
    const logs: LogEntry[] = []

    // Framework-specific and common log patterns
    const patterns = [
      // Java Log4j: 2024-01-27 08:15:22,123 [ThreadName] LEVEL ClassName - Message
      /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d+)\s+\[([^\]]+)\]\s+(\w+)\s+([^\s]+)\s*-\s*(.+)$/,
      // Java SLF4j: TIMESTAMP [ThreadName] LEVEL ClassName Message
      /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+\[([^\]]+)\]\s+(\w+)\s+([^\s]+)\s+(.+)$/,
      // Node.js/Express Morgan: GET /path 200 123 - 45ms
      /^(\w+)\s+(\/\S*)\s+(\d{3})\s+(\d+)\s+-\s+(.+)$/,
      // [LEVEL] TIMESTAMP SOURCE MESSAGE
      /^\[(\w+)\]\s+(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})\s+([^\s]+)\s+(.+)$/,
      // TIMESTAMP [LEVEL] MESSAGE
      /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})\s+\[(\w+)\]\s+(.+)$/,
      // TIMESTAMP LEVEL SOURCE MESSAGE
      /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})\s+(ERROR|WARNING|INFO|DEBUG|TRACE)\s+([^\s]+)\s+(.+)$/,
      // Python logging: LEVEL:SOURCE:MESSAGE (with optional timestamp prefix)
      /^(\w+):([^\s:]+):(.+)$/,
    ]

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue

      let matched = false

      // Java Log4j pattern
      let match = line.match(patterns[0])
      if (match) {
        const [, timestamp, thread, level, source, message] = match
        logs.push({
          id: `log-${logs.length}`,
          timestamp: this.parseTimestamp(timestamp),
          level: this.normalizeLevel(level),
          source: source || thread,
          message,
          metadata: { thread, className: source }
        })
        matched = true
      }

      // Java SLF4j pattern
      if (!matched) {
        match = line.match(patterns[1])
        if (match) {
          const [, timestamp, thread, level, source, message] = match
          logs.push({
            id: `log-${logs.length}`,
            timestamp: this.parseTimestamp(timestamp),
            level: this.normalizeLevel(level),
            source: source || thread,
            message,
            metadata: { thread, className: source }
          })
          matched = true
        }
      }

      // Express/Morgan HTTP pattern
      if (!matched) {
        match = line.match(patterns[2])
        if (match) {
          const [, method, path, statusCode, responseTime, message] = match
          logs.push({
            id: `log-${logs.length}`,
            timestamp: new Date().toISOString(),
            level: this.getHttpLogLevel(parseInt(statusCode)),
            source: 'Express HTTP',
            message: `${method} ${path} ${statusCode} ${responseTime}`,
            metadata: { method, path, statusCode, responseTime, details: message }
          })
          matched = true
        }
      }

      // [LEVEL] TIMESTAMP SOURCE MESSAGE
      if (!matched) {
        match = line.match(patterns[3])
        if (match) {
          const [, level, timestamp, source, message] = match
          logs.push({
            id: `log-${logs.length}`,
            timestamp: this.parseTimestamp(timestamp),
            level: this.normalizeLevel(level),
            source,
            message,
          })
          matched = true
        }
      }

      // TIMESTAMP [LEVEL] MESSAGE
      if (!matched) {
        match = line.match(patterns[4])
        if (match) {
          const [, timestamp, level, message] = match
          logs.push({
            id: `log-${logs.length}`,
            timestamp: this.parseTimestamp(timestamp),
            level: this.normalizeLevel(level),
            source: 'System',
            message,
          })
          matched = true
        }
      }

      // TIMESTAMP LEVEL SOURCE MESSAGE
      if (!matched) {
        match = line.match(patterns[5])
        if (match) {
          const [, timestamp, level, source, message] = match
          logs.push({
            id: `log-${logs.length}`,
            timestamp: this.parseTimestamp(timestamp),
            level: this.normalizeLevel(level),
            source,
            message,
          })
          matched = true
        }
      }

      // Python logging pattern
      if (!matched) {
        match = line.match(patterns[6])
        if (match) {
          const [, level, source, message] = match
          // Only match if it looks like a valid log level
          if (/^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$/i.test(level)) {
            logs.push({
              id: `log-${logs.length}`,
              timestamp: new Date().toISOString(),
              level: this.normalizeLevel(level),
              source,
              message,
            })
            matched = true
          }
        }
      }

      if (!matched) {
        logs.push({
          id: `log-${logs.length}`,
          timestamp: new Date().toISOString(),
          level: 'INFO',
          source: 'System',
          message: line,
        })
      }
    }

    return logs
  }

  private static parseTimestamp(timestamp: string): string {
    try {
      // Handle Java format with comma: 2024-01-27 08:15:22,123
      const javaFormat = timestamp.replace(',', '.')
      const date = new Date(javaFormat)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    } catch (e) {
      // Fall through
    }

    try {
      const date = new Date(timestamp)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    } catch (e) {
      // Fall through
    }

    return new Date().toISOString()
  }

  private static getHttpLogLevel(statusCode: number): LogLevel {
    if (statusCode >= 500) return 'ERROR'
    if (statusCode >= 400) return 'WARNING'
    return 'INFO'
  }

  private static normalizeLogEntry(log: Record<string, unknown>, idx: number): LogEntry {
    const timestamp = this.findField(log, ['timestamp', 'time', 'date', 'datetime', '@timestamp']) as string
    const level = this.normalizeLevel(this.findField(log, ['level', 'severity', 'priority', 'type']) as string)
    const source = (this.findField(log, ['source', 'component', 'logger', 'service']) as string) || 'System'
    const message = (this.findField(log, ['message', 'msg', 'text', 'content', 'event']) as string) || JSON.stringify(log)

    return {
      id: `log-${idx}`,
      timestamp: timestamp || new Date().toISOString(),
      level,
      source,
      message,
      metadata: log,
    }
  }

  private static findField(obj: Record<string, unknown>, keys: string[]): unknown {
    for (const key of keys) {
      if (obj[key]) return obj[key]
      const lowerKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase())
      if (lowerKey) return obj[lowerKey]
    }
    return null
  }

  private static normalizeLevel(level: unknown): LogLevel {
    const str = String(level).toUpperCase()
    if (str.includes('ERROR') || str.includes('ERR')) return 'ERROR'
    if (str.includes('WARNING') || str.includes('WARN')) return 'WARNING'
    if (str.includes('DEBUG')) return 'DEBUG'
    if (str.includes('TRACE')) return 'TRACE'
    return 'INFO'
  }
}

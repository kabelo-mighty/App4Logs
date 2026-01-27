import { LogParser } from '../services/logParser'
import { LogEntry } from '../types'

interface ParseMessage {
  type: 'parse'
  content: string
  fileName: string
}

interface ParseResultMessage {
  type: 'result'
  logs: LogEntry[]
  error?: string
}

export type { ParseMessage, ParseResultMessage }

// Handle messages from main thread
self.onmessage = (event: MessageEvent<ParseMessage>) => {
  if (event.data.type === 'parse') {
    try {
      const { content, fileName } = event.data

      // Parse the file
      const logs = LogParser.parseFile(content, fileName)

      // Send results back to main thread
      const result: ParseResultMessage = {
        type: 'result',
        logs,
      }
      self.postMessage(result)
    } catch (error) {
      // Send error back to main thread
      const result: ParseResultMessage = {
        type: 'result',
        logs: [],
        error: error instanceof Error ? error.message : 'Unknown parsing error',
      }
      self.postMessage(result)
    }
  }
}

// Export for TypeScript
export {}

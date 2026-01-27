import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react'
import { FileUpload } from '../components/FileUpload'

describe('FileUpload Component', () => {
  it('should render upload area', () => {
    render(<FileUpload onLogsLoaded={() => {}} />)
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
  })

  it('should show loading state during upload', async () => {
    const onLogsLoaded = jest.fn()
    render(<FileUpload onLogsLoaded={onLogsLoaded} />)

    const input = screen.getByRole('button', { name: /upload/i })
    fireEvent.click(input)

    // Upload should start
    expect(screen.getByText(/processing/i)).toBeInTheDocument()
  })

  it('should handle file upload errors', async () => {
    const onLogsLoaded = jest.fn()
    render(<FileUpload onLogsLoaded={onLogsLoaded} />)

    // Try uploading invalid file
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['invalid'], 'test.invalid', { type: 'application/json' })

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/invalid file format/i)).toBeInTheDocument()
    })
  })
})

describe('Validation Utils', () => {
  it('should validate file size', () => {
    const largeFile = new File(['x'.repeat(101 * 1024 * 1024)], 'large.log')
    expect(() => validateFile(largeFile)).toThrow()
  })

  it('should validate log format', () => {
    const invalidLogs = [{ id: '1' }] // Missing required fields
    expect(() => validateLogs(invalidLogs as any)).toThrow()
  })

  it('should sanitize user input', () => {
    const dirty = '<script>alert("xss")</script>'
    const clean = sanitizeInput(dirty)
    expect(clean).not.toContain('<')
    expect(clean).not.toContain('>')
  })
})

describe('Performance', () => {
  it('should handle large log files efficiently', () => {
    const largeLogs = Array.from({ length: 10000 }, (_, i) => ({
      id: `log-${i}`,
      timestamp: new Date().toISOString(),
      level: 'INFO' as const,
      source: 'Test',
      message: 'Test message',
    }))

    const start = performance.now()
    // Process logs
    const end = performance.now()

    expect(end - start).toBeLessThan(1000) // Should process in < 1 second
  })
})

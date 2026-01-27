import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { LogParser } from '../services/logParser'
import { LogEntry } from '../types'
import { ErrorRecovery, useErrorRecovery } from './ErrorRecovery'
import { reportError, trackEvent, logUserAction } from '../utils/telemetry'
import { validateFile } from '../utils/validation'

interface FileUploadProps {
  onLogsLoaded: (logs: LogEntry[]) => void
}

export const FileUpload: React.FC<FileUploadProps> = ({ onLogsLoaded }) => {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { error, showError, clearError } = useErrorRecovery()
  const [lastFile, setLastFile] = useState<File | null>(null)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    if (!isLoading) setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    processFiles(e.dataTransfer.files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
    }
  }

  const processFiles = useCallback((files: FileList) => {
    clearError()
    setUploadProgress(0)

    if (files.length === 0) return

    const file = files[0]
    setFileName(file.name)
    setLastFile(file)
    setIsLoading(true)

    // Validate file first
    try {
      validateFile(file)
    } catch (err) {
      const validationError = err instanceof Error ? err.message : 'Invalid file'
      showError(validationError, 'upload')
      setIsLoading(false)
      logUserAction('file_validation_failed', {
        fileName: file.name,
        error: validationError,
      })
      return
    }

    const reader = new FileReader()
    let progressInterval: ReturnType<typeof setInterval>

    const progressInterval2 = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 30, 90))
    }, 100)
    progressInterval = progressInterval2

    reader.onload = (event) => {
      clearInterval(progressInterval)
      try {
        const content = event.target?.result as string
        setUploadProgress(95)

        trackEvent('log_parsing_started', {
          fileName: file.name,
          fileSize: file.size,
        })

        const logs = LogParser.parseFile(content, file.name)

        if (logs.length === 0) {
          const emptyError = 'No valid logs found in file. Please check the file format.'
          showError(emptyError, 'parsing')
          setIsLoading(false)
          setUploadProgress(0)
          logUserAction('no_logs_found', { fileName: file.name })
          return
        }

        setUploadProgress(100)
        logUserAction('file_parsed_successfully', {
          fileName: file.name,
          logCount: logs.length,
        })

        setTimeout(() => {
          onLogsLoaded(logs)
          setIsLoading(false)
          setUploadProgress(0)
          setFileName(null)
        }, 300)
      } catch (err) {
        clearInterval(progressInterval)
        const errorMsg = err instanceof Error ? err.message : 'Unknown parsing error'
        showError(
          `Failed to parse file: ${errorMsg}`,
          'parsing'
        )
        reportError(err as Error, {
          context: 'file_parsing',
          fileName: file.name,
        })
        setIsLoading(false)
        setUploadProgress(0)
        logUserAction('file_parsing_failed', {
          fileName: file.name,
          error: errorMsg,
        })
      }
    }

    reader.onerror = () => {
      clearInterval(progressInterval)
      const readError = 'Failed to read file. Please try again.'
      showError(readError, 'upload')
      setIsLoading(false)
      setUploadProgress(0)
      reportError(new Error('FileReader error'), {
        context: 'file_read',
        fileName: file.name,
      })
      logUserAction('file_read_failed', { fileName: file.name })
    }

    reader.onabort = () => {
      clearInterval(progressInterval)
      const abortError = 'File upload was cancelled.'
      showError(abortError, 'upload')
      setIsLoading(false)
      setUploadProgress(0)
      logUserAction('file_upload_cancelled', { fileName: file.name })
    }

    try {
      reader.readAsText(file)
    } catch (err) {
      clearInterval(progressInterval)
      const readError = 'Error reading file. This file type may not be supported.'
      showError(readError, 'upload')
      reportError(err as Error, {
        context: 'file_read_error',
        fileName: file.name,
      })
      setIsLoading(false)
    }
  }, [showError, clearError, onLogsLoaded])

  const handleRetryUpload = useCallback(async () => {
    if (lastFile) {
      const dt = new DataTransfer()
      dt.items.add(lastFile)
      processFiles(dt.files)
    }
  }, [lastFile, processFiles])

  return (
    <div className="w-full">
      {/* Error Recovery UI */}
      {error && (
        <ErrorRecovery
          error={error.message}
          context={error.context}
          onRetry={error.context === 'upload' ? handleRetryUpload : undefined}
          onDismiss={clearError}
        />
      )}

      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
          isLoading
            ? 'border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed'
            : isDragging
            ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
            : 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 hover:border-blue-400 hover:shadow-md'
        }`}
      >
        {!isLoading ? (
          <>
            <svg className="mx-auto h-16 w-16 text-blue-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-6-6l-8-8m0 0l-8 8m8-8v20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-3 text-base font-semibold text-gray-900">{t('dragDrop')}</p>
            <p className="text-sm text-gray-500 mt-2">{t('orClickBrowse')}</p>

            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileInput}
              accept=".log,.json,.csv,.xml,.txt"
              disabled={isLoading}
            />

            <label htmlFor="file-upload" className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-md text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 cursor-pointer transition-all duration-200 transform hover:scale-105 active:scale-95">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('uploadFile')}
            </label>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="mt-4 text-base font-semibold text-gray-900">{fileName}</p>
            <p className="text-sm text-gray-500 mt-2">Processing your log file...</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{uploadProgress}%</p>
          </>
        )}
      </div>
    </div>
  )
}

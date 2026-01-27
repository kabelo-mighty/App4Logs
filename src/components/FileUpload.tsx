import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LogParser } from '../services/logParser'
import { LogEntry } from '../types'

interface FileUploadProps {
  onLogsLoaded: (logs: LogEntry[]) => void
}

export const FileUpload: React.FC<FileUploadProps> = ({ onLogsLoaded }) => {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

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

  const processFiles = (files: FileList) => {
    setError(null)
    setUploadProgress(0)

    if (files.length === 0) return

    const file = files[0]
    setFileName(file.name)
    setIsLoading(true)
    const reader = new FileReader()

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 30, 90))
    }, 100)

    reader.onload = (event) => {
      clearInterval(progressInterval)
      try {
        const content = event.target?.result as string
        setUploadProgress(95)
        const logs = LogParser.parseFile(content, file.name)

        if (logs.length === 0) {
          setError('No valid logs found in file')
          setIsLoading(false)
          setUploadProgress(0)
          return
        }

        setUploadProgress(100)
        setTimeout(() => {
          onLogsLoaded(logs)
          setIsLoading(false)
          setUploadProgress(0)
          setFileName(null)
        }, 300)
      } catch (err) {
        clearInterval(progressInterval)
        setError(`Error reading file: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setIsLoading(false)
        setUploadProgress(0)
      }
    }

    reader.onerror = () => {
      clearInterval(progressInterval)
      setError('Failed to read file')
      setIsLoading(false)
      setUploadProgress(0)
    }

    reader.readAsText(file)
  }

  return (
    <div className="w-full">
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

      {error && (
        <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-md animate-pulse">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}

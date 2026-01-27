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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
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

    if (files.length === 0) return

    const file = files[0]
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const logs = LogParser.parseFile(content, file.name)

        if (logs.length === 0) {
          setError('No valid logs found in file')
          return
        }

        onLogsLoaded(logs)
      } catch (err) {
        setError(`Error reading file: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    reader.onerror = () => {
      setError('Failed to read file')
    }

    reader.readAsText(file)
  }

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-6-6l-8-8m0 0l-8 8m8-8v20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mt-2 text-sm font-medium text-gray-900">{t('dragDrop')}</p>
        <p className="text-xs text-gray-500 mt-1">{t('orClickBrowse')}</p>

        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileInput}
          accept=".log,.json,.csv,.xml,.txt"
        />

        <label htmlFor="file-upload" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
          {t('uploadFile')}
        </label>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  )
}

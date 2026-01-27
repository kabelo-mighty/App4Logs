import React, { useMemo, useCallback } from 'react'
import { LogEntry } from '../types'
import { VirtualizedLogViewer } from './VirtualizedLogViewer'

interface PaginatedLogViewerProps {
  logs: LogEntry[]
  itemsPerPage?: number
  isLoading?: boolean
  onPageChange?: (page: number) => void
}

export const PaginatedLogViewer: React.FC<PaginatedLogViewerProps> = ({
  logs,
  itemsPerPage = 50,
  isLoading = false,
  onPageChange,
}) => {
  const [currentPage, setCurrentPage] = React.useState(1)

  // Calculate pagination
  const pagination = useMemo(() => {
    const total = logs.length
    const totalPages = Math.ceil(total / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, total)
    const paginatedLogs = logs.slice(startIndex, endIndex)

    return {
      currentPage,
      totalPages,
      total,
      startIndex,
      endIndex,
      paginatedLogs,
      itemsPerPage,
    }
  }, [logs, currentPage, itemsPerPage])

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= pagination.totalPages) {
        setCurrentPage(page)
        onPageChange?.(page)
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    },
    [pagination.totalPages, onPageChange]
  )

  const handlePreviousPage = useCallback(() => {
    handlePageChange(currentPage - 1)
  }, [currentPage, handlePageChange])

  const handleNextPage = useCallback(() => {
    handlePageChange(currentPage + 1)
  }, [currentPage, handlePageChange])

  // Memoize page buttons
  const pageButtons = useMemo(() => {
    const buttons = []
    const maxButtons = 7
    let startPage = Math.max(1, pagination.currentPage - 3)
    let endPage = Math.min(pagination.totalPages, startPage + maxButtons - 1)

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1)
    }

    if (startPage > 1) {
      buttons.push(
        <button
          key="first"
          onClick={() => handlePageChange(1)}
          className="px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          First
        </button>
      )
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`
            px-3 py-1 text-xs font-semibold rounded transition-colors
            ${
              i === pagination.currentPage
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
            }
          `}
        >
          {i}
        </button>
      )
    }

    if (endPage < pagination.totalPages) {
      buttons.push(
        <button
          key="last"
          onClick={() => handlePageChange(pagination.totalPages)}
          className="px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          Last
        </button>
      )
    }

    return buttons
  }, [pagination.currentPage, pagination.totalPages, handlePageChange])

  return (
    <div className="space-y-4">
      {/* Log Viewer */}
      <VirtualizedLogViewer logs={pagination.paginatedLogs} isLoading={isLoading} height={500} />

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Info Text */}
            <div className="text-sm text-gray-600 font-medium">
              Showing{' '}
              <span className="font-semibold text-gray-900">
                {pagination.startIndex + 1}-{pagination.endIndex}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-gray-900">
                {pagination.total.toLocaleString()}
              </span>{' '}
              logs
            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Previous Button */}
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`
                  px-3 py-1 text-xs font-semibold rounded transition-colors
                  ${
                    currentPage === 1
                      ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }
                `}
              >
                ← Previous
              </button>

              {/* Page Buttons */}
              <div className="flex gap-1">{pageButtons}</div>

              {/* Next Button */}
              <button
                onClick={handleNextPage}
                disabled={currentPage === pagination.totalPages}
                className={`
                  px-3 py-1 text-xs font-semibold rounded transition-colors
                  ${
                    currentPage === pagination.totalPages
                      ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }
                `}
              >
                Next →
              </button>
            </div>

            {/* Page Info */}
            <div className="text-sm text-gray-600 font-medium">
              Page{' '}
              <span className="font-semibold text-gray-900">{pagination.currentPage}</span> of{' '}
              <span className="font-semibold text-gray-900">{pagination.totalPages}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

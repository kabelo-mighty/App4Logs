import { useEffect, useRef, useCallback, useState } from 'react'
import { KeyboardEvents, isKeyEvent, FocusManager, useHighContrastMode } from '../utils/accessibility'

/**
 * Hook for managing keyboard navigation
 */
export const useKeyboardNavigation = (onEnter?: () => void, onEscape?: () => void) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isKeyEvent(e, KeyboardEvents.ENTER) && onEnter) {
        e.preventDefault()
        onEnter()
      }
      if (isKeyEvent(e, KeyboardEvents.ESCAPE) && onEscape) {
        e.preventDefault()
        onEscape()
      }
    },
    [onEnter, onEscape]
  )

  return { handleKeyDown }
}

/**
 * Hook for focus management
 */
export const useFocusManagement = () => {
  const focusableRef = useRef<HTMLElement>(null)

  const focusElement = useCallback((element: HTMLElement | null) => {
    FocusManager.focus(element)
  }, [])

  const focusNext = useCallback(() => {
    if (focusableRef.current) {
      const next = FocusManager.getNextFocusable(focusableRef.current)
      if (next) focusElement(next)
    }
  }, [focusElement])

  const focusPrevious = useCallback(() => {
    if (focusableRef.current) {
      const prev = FocusManager.getPreviousFocusable(focusableRef.current)
      if (prev) focusElement(prev)
    }
  }, [focusElement])

  return { focusableRef, focusElement, focusNext, focusPrevious }
}

/**
 * Hook for focus trapping (modals, dialogs)
 */
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isActive && isKeyEvent(e, KeyboardEvents.TAB)) {
        FocusManager.trapFocus(e, containerRef)
      }
    },
    [isActive]
  )

  return { containerRef, handleKeyDown }
}

/**
 * Hook for managing ARIA live regions
 */
export const useAriaLiveRegion = () => {
  const [announcement, setAnnouncement] = useState('')

  const announce = useCallback((message: string) => {
    setAnnouncement(message)
    // Reset after announcement
    setTimeout(() => setAnnouncement(''), 1000)
  }, [])

  return { announcement, announce }
}

/**
 * Hook for detecting screen reader
 */
export const useScreenReaderDetection = (): boolean => {
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false)

  useEffect(() => {
    // Detect if user is using a screen reader
    // This is a heuristic based on accessibility API usage
    const checkScreenReader = () => {
      // Check if a live region is being accessed (common with screen readers)
      const liveRegions = document.querySelectorAll('[aria-live], [role="status"], [role="alert"]')
      setIsScreenReaderActive(liveRegions.length > 0)
    }

    checkScreenReader()
    const timer = setInterval(checkScreenReader, 5000)

    return () => clearInterval(timer)
  }, [])

  return isScreenReaderActive
}

/**
 * Hook for keyboard shortcuts
 */
export const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = `${e.ctrlKey || e.metaKey ? 'ctrl+' : ''}${e.shiftKey ? 'shift+' : ''}${e.key.toLowerCase()}`

      if (shortcuts[key]) {
        e.preventDefault()
        shortcuts[key]()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

/**
 * Hook for high contrast mode
 */
export const useHighContrast = () => {
  const isHighContrast = useHighContrastMode()

  return {
    isHighContrast,
    getClasses: (baseClasses: string, highContrastClasses: string) =>
      isHighContrast ? highContrastClasses : baseClasses,
  }
}

/**
 * Hook for managing page title for screen readers
 */
export const usePageTitle = (title: string) => {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title
    return () => {
      document.title = previousTitle
    }
  }, [title])
}

/**
 * Hook for skip links
 */
export const useSkipLink = (targetId: string) => {
  const handleSkipClick = useCallback(() => {
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [targetId])

  return { handleSkipClick }
}

/**
 * Hook for managing focus after dynamic content changes
 */
export const useDynamicContentFocus = (contentReady: boolean, focusId?: string) => {
  useEffect(() => {
    if (contentReady && focusId) {
      const element = document.getElementById(focusId)
      if (element) {
        // Small delay to ensure rendering is complete
        setTimeout(() => {
          element.focus()
        }, 0)
      }
    }
  }, [contentReady, focusId])
}

/**
 * Hook for accessible form submission
 */
export const useAccessibleFormSubmit = (onSubmit: () => void | Promise<void>) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isKeyEvent(e, KeyboardEvents.ENTER) && (e.target as HTMLElement)?.closest('form')) {
        e.preventDefault()
        onSubmit()
      }
    },
    [onSubmit]
  )

  const handleClick = useCallback(() => {
    onSubmit()
  }, [onSubmit])

  return { handleKeyDown, handleClick }
}

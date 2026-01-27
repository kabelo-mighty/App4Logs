/**
 * Accessibility Utilities
 * 
 * Provides helpers for ARIA labels, keyboard navigation,
 * focus management, and WCAG 2.1 compliance
 */

/**
 * Generate ARIA label for buttons
 */
export const generateAriaLabel = (text: string, description?: string): string => {
  return description ? `${text}. ${description}` : text
}

/**
 * Keyboard event handler utilities
 */
export const KeyboardEvents = {
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  SPACE: ' ',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
} as const

/**
 * Check if a keyboard event is for a specific key
 */
export const isKeyEvent = (event: React.KeyboardEvent, key: string): boolean => {
  return event.key === key || event.code === key
}

/**
 * Check if keyboard navigation was triggered (Enter or Space)
 */
export const isNavigationKey = (event: React.KeyboardEvent): boolean => {
  return isKeyEvent(event, KeyboardEvents.ENTER) || isKeyEvent(event, KeyboardEvents.SPACE)
}

/**
 * Prevent event propagation and default for navigation keys
 */
export const handleNavigationKey = (event: React.KeyboardEvent): void => {
  if (isNavigationKey(event)) {
    event.preventDefault()
    event.stopPropagation()
  }
}

/**
 * Handle escape key press
 */
export const isEscapeKey = (event: React.KeyboardEvent): boolean => {
  return isKeyEvent(event, KeyboardEvents.ESCAPE)
}

/**
 * Focus management utilities
 */
export const FocusManager = {
  /**
   * Focus an element with smooth scrolling
   */
  focus: (element: HTMLElement | null, options?: ScrollIntoViewOptions): void => {
    if (!element) return
    element.focus()
    element.scrollIntoView(options || { behavior: 'smooth', block: 'center' })
  },

  /**
   * Get next focusable element
   */
  getNextFocusable: (element: HTMLElement): HTMLElement | null => {
    const focusableElements = Array.from(
      document.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[]

    const currentIndex = focusableElements.indexOf(element)
    if (currentIndex === -1) return null

    const nextIndex = (currentIndex + 1) % focusableElements.length
    return focusableElements[nextIndex]
  },

  /**
   * Get previous focusable element
   */
  getPreviousFocusable: (element: HTMLElement): HTMLElement | null => {
    const focusableElements = Array.from(
      document.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[]

    const currentIndex = focusableElements.indexOf(element)
    if (currentIndex === -1) return null

    const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1
    return focusableElements[prevIndex]
  },

  /**
   * Trap focus within an element
   */
  trapFocus: (event: React.KeyboardEvent, containerRef: React.RefObject<HTMLElement>): void => {
    if (!isKeyEvent(event, KeyboardEvents.TAB) || !containerRef.current) return

    const focusableElements = Array.from(
      containerRef.current.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[]

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    const activeElement = document.activeElement as HTMLElement

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  },
}

/**
 * Screen reader announcements
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Create accessible button attributes
 */
export const createAccessibleButton = (
  label: string,
  description?: string,
  disabled = false
): {
  'aria-label': string
  'aria-disabled': boolean
  role: 'button'
  tabIndex: number
} => ({
  'aria-label': generateAriaLabel(label, description),
  'aria-disabled': disabled,
  role: 'button',
  tabIndex: disabled ? -1 : 0,
})

/**
 * Create accessible form field attributes
 */
export const createAccessibleInput = (
  id: string,
  label: string,
  type: string = 'text',
  required = false,
  disabled = false,
  error?: string
): {
  id: string
  'aria-label': string
  'aria-required': boolean
  'aria-disabled': boolean
  'aria-invalid': boolean
  'aria-describedby': string | undefined
  type: string
} => ({
  id,
  'aria-label': label,
  'aria-required': required,
  'aria-disabled': disabled,
  'aria-invalid': !!error,
  'aria-describedby': error ? `${id}-error` : undefined,
  type,
})

/**
 * High contrast colors for accessibility
 */
export const HighContrastColors = {
  dark: {
    background: '#000000',
    text: '#FFFFFF',
    primary: '#FFFF00',
    error: '#FF0000',
    warning: '#FFA500',
    success: '#00FF00',
    info: '#00FFFF',
  },
  light: {
    background: '#FFFFFF',
    text: '#000000',
    primary: '#0000FF',
    error: '#CC0000',
    warning: '#FF6600',
    success: '#008000',
    info: '#0066CC',
  },
}

/**
 * Tailwind classes for high contrast mode
 */
export const HighContrastClasses = {
  dark: {
    background: 'bg-black',
    text: 'text-white',
    primary: 'bg-yellow-300 text-black',
    border: 'border-white',
    focus: 'focus:outline-4 focus:outline-offset-2 focus:outline-yellow-300',
  },
  light: {
    background: 'bg-white',
    text: 'text-black',
    primary: 'bg-blue-600 text-white',
    border: 'border-black',
    focus: 'focus:outline-4 focus:outline-offset-2 focus:outline-blue-600',
  },
}

/**
 * Get high contrast classes based on preference
 */
export const useHighContrastMode = (): boolean => {
  const [isHighContrast, setIsHighContrast] = React.useState(false)

  React.useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-contrast: more)')
    setIsHighContrast(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isHighContrast
}

/**
 * Get high contrast class set
 */
export const getHighContrastClasses = (isDark = false): typeof HighContrastClasses.dark => {
  return isDark ? HighContrastClasses.dark : HighContrastClasses.light
}

/**
 * Skip link for keyboard navigation
 */
export const SkipLink = {
  /**
   * Create skip to main content link
   */
  createSkipLink: (): string => 'skip-to-main-content',

  /**
   * Get skip link target ID
   */
  getMainContentId: (): string => 'main-content',
}

/**
 * Announce dynamic content changes
 */
export const announceContentChange = (
  message: string,
  type: 'logs_loaded' | 'filters_applied' | 'export_started' | 'error' = 'logs_loaded'
): void => {
  const messages = {
    logs_loaded: `${message} logs loaded successfully`,
    filters_applied: `${message} logs after applying filters`,
    export_started: `Exporting ${message} logs`,
    error: `Error: ${message}`,
  }

  announceToScreenReader(messages[type] || messages.logs_loaded, type === 'error' ? 'assertive' : 'polite')
}

// Re-export React for use in hooks
import * as React from 'react'

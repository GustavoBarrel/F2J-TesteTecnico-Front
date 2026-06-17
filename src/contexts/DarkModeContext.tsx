import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

interface DarkModeContextValue {
  isDark: boolean
  toggle: () => void
}

const DarkModeContext = createContext<DarkModeContextValue | null>(null)

function getInitialDark(): boolean {
  const stored = localStorage.getItem('theme')
  if (stored) return stored === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(getInitialDark)

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggle = useCallback(() => setIsDark((prev) => !prev), [])

  const value = useMemo(() => ({ isDark, toggle }), [isDark, toggle])

  return <DarkModeContext.Provider value={value}>{children}</DarkModeContext.Provider>
}

export function useDarkMode() {
  const context = useContext(DarkModeContext)
  if (!context) throw new Error('useDarkMode deve ser usado dentro de DarkModeProvider')
  return context
}

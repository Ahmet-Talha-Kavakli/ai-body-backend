import React, { createContext, useEffect } from 'react'

export const AppContext = createContext<any>(null)

export function AppProvider({ children }: any) {
  const [dbInitialized, setDbInitialized] = React.useState(false)

  useEffect(() => {
    initializeApp()
  }, [])

  async function initializeApp() {
    try {
      // Initialize database if needed
      setDbInitialized(true)
    } catch (error) {
      console.error('Failed to initialize app:', error)
    }
  }

  if (!dbInitialized) {
    return null
  }

  return <AppContext.Provider value={{}}>{children}</AppContext.Provider>
}

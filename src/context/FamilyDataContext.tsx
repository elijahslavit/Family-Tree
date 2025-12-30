import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { FamilyDataStore } from '../utils/family-data-store'
import type { Person, ParsedGedcomData } from '../types'

interface FamilyDataContextType {
  store: FamilyDataStore
  loadData: (data: ParsedGedcomData) => void
  clearData: () => void
  isLoaded: boolean
}

const FamilyDataContext = createContext<FamilyDataContextType | undefined>(undefined)

export function FamilyDataProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new FamilyDataStore())
  const [isLoaded, setIsLoaded] = useState(false)

  const loadData = useCallback((data: ParsedGedcomData) => {
    store.loadFromGedcom(data)
    setIsLoaded(true)
  }, [store])

  const clearData = useCallback(() => {
    store.clearData()
    setIsLoaded(false)
  }, [store])

  return (
    <FamilyDataContext.Provider value={{ store, loadData, clearData, isLoaded }}>
      {children}
    </FamilyDataContext.Provider>
  )
}

export function useFamilyData() {
  const context = useContext(FamilyDataContext)
  if (!context) {
    throw new Error('useFamilyData must be used within FamilyDataProvider')
  }
  return context
}


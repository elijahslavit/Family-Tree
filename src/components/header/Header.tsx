import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useFamilyData } from '../../context/FamilyDataContext'
import type { ViewType, Person } from '../../types'
import styles from './Header.module.scss'

interface HeaderProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  onPersonSelect: (person: Person) => void
  onUploadClick: () => void
}

const VIEWS: Array<{ id: ViewType; label: string; icon: string }> = [
  { id: 'tree', label: 'Tree', icon: '👨‍👩‍👧‍👦' },
  { id: 'timeline', label: 'Timeline', icon: '📅' },
  { id: 'map', label: 'Map', icon: '🗺️' },
  { id: 'gallery', label: 'Gallery', icon: '📷' },
  { id: 'stories', label: 'Stories', icon: '📖' }
]

export function Header({ currentView, onViewChange, onPersonSelect, onUploadClick }: HeaderProps) {
  const { store } = useFamilyData()
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return []
    return store.searchPeople(searchQuery).slice(0, 10)
  }, [searchQuery, store])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.trim()
    setSearchQuery(query)
    setShowResults(query.length >= 2)
  }, [])

  const handlePersonClick = useCallback((person: Person) => {
    onPersonSelect(person)
    setSearchQuery('')
    setShowResults(false)
  }, [onPersonSelect])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const formatLifespan = useCallback((person: Person): string => {
    const birthYear = person.birth?.dateObject?.year
    const deathYear = person.death?.dateObject?.year

    if (birthYear && deathYear) {
      return `${birthYear} – ${deathYear}`
    } else if (birthYear) {
      return `b. ${birthYear}`
    } else if (deathYear) {
      return `d. ${deathYear}`
    }
    return ''
  }, [])

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.siteTitle}>
          <span className={styles.treeEmoji}>🌳</span>
          Family Tree Explorer
        </h1>
        <nav className={styles.mainNav}>
          {VIEWS.map(view => (
            <button
              key={view.id}
              className={`${styles.navBtn} ${currentView === view.id ? styles.active : ''}`}
              onClick={() => onViewChange(view.id)}
            >
              <span className={styles.icon}>{view.icon}</span>
              {view.label}
            </button>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <div ref={searchContainerRef} className={styles.searchContainer}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search family members..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            />
            {showResults && (
              <div className={styles.searchResults}>
                {searchResults.length === 0 ? (
                  <div className={styles.searchResultItem}>
                    <div className={styles.info}>No results found</div>
                  </div>
                ) : (
                  searchResults.map(person => (
                    <div
                      key={person.id}
                      className={styles.searchResultItem}
                      onClick={() => handlePersonClick(person)}
                    >
                      <div className={styles.thumb}>
                        {person.gender === 'male' ? '👨' : person.gender === 'female' ? '👩' : '👤'}
                      </div>
                      <div className={styles.info}>
                        <div className={styles.name}>{person.name}</div>
                        <div className={styles.dates}>{formatLifespan(person)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button
            className={styles.actionBtn}
            onClick={onUploadClick}
            title="Upload GEDCOM"
          >
            <span className={styles.icon}>📁</span>
          </button>
        </div>
      </div>
    </header>
  )
}


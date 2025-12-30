import React, { useState } from 'react'
import { useFamilyData } from '../../context/FamilyDataContext'
import type { Person } from '../../types'
import styles from './PersonModal.module.scss'

interface PersonModalProps {
  person: Person
  onClose: () => void
  onPersonSelect: (person: Person) => void
}

export function PersonModal({ person, onClose, onPersonSelect }: PersonModalProps) {
  const { store } = useFamilyData()
  const [activeTab, setActiveTab] = useState<'overview' | 'family' | 'events' | 'photos' | 'stories'>('overview')

  const formatLifespan = (): string => {
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
  }

  const parents = store.getParents(person.id)
  const siblings = store.getSiblings(person.id)
  const spouses = store.getSpouses(person.id)
  const children = store.getChildren(person.id)

  return (
    <div className={styles.modal} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modalContent}>
        <button className={styles.modalClose} onClick={onClose}>&times;</button>
        <div className={styles.modalBody}>
          <div className={styles.personHeader}>
            <div className={styles.personPhotoLarge}>
              {person.photo ? (
                <img src={person.photo} alt={person.name} />
              ) : (
                <div className={styles.photoPlaceholder}>
                  {person.gender === 'male' ? '👨' : person.gender === 'female' ? '👩' : '👤'}
                </div>
              )}
            </div>
            <div className={styles.personTitle}>
              <h2>{person.name}</h2>
              <p className={styles.dates}>{formatLifespan()}</p>
              {person.birth?.place && <p className={styles.birthplace}>📍 {person.birth.place}</p>}
            </div>
          </div>
          <div className={styles.personTabs}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'family' ? styles.active : ''}`}
              onClick={() => setActiveTab('family')}
            >
              Family
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'events' ? styles.active : ''}`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
          </div>
          <div className={styles.personTabContent}>
            {activeTab === 'overview' && (
              <div className={styles.tabPane}>
                <div className={styles.infoGrid}>
                  {person.birth && (
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>Born</div>
                      <div className={styles.infoValue}>{person.birth.date || 'Unknown'}</div>
                      {person.birth.place && (
                        <div className={styles.infoValueSmall}>📍 {person.birth.place}</div>
                      )}
                    </div>
                  )}
                  {person.death && (
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>Died</div>
                      <div className={styles.infoValue}>{person.death.date || 'Unknown'}</div>
                      {person.death.place && (
                        <div className={styles.infoValueSmall}>📍 {person.death.place}</div>
                      )}
                    </div>
                  )}
                  {person.occupation && (
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>Occupation</div>
                      <div className={styles.infoValue}>{person.occupation}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'family' && (
              <div className={styles.tabPane}>
                {parents.length > 0 && (
                  <div className={styles.familySection}>
                    <h4>Parents</h4>
                    {parents.map(p => (
                      <div key={p.id} className={styles.familyMember} onClick={() => onPersonSelect(p)}>
                        <div className={styles.familyMemberPhoto}>
                          {p.gender === 'male' ? '👨' : p.gender === 'female' ? '👩' : '👤'}
                        </div>
                        <div className={styles.familyMemberInfo}>
                          <div className={styles.familyMemberName}>{p.name}</div>
                          <div className={styles.familyMemberRelation}>Parent</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {children.length > 0 && (
                  <div className={styles.familySection}>
                    <h4>Children</h4>
                    {children.map(c => (
                      <div key={c.id} className={styles.familyMember} onClick={() => onPersonSelect(c)}>
                        <div className={styles.familyMemberPhoto}>
                          {c.gender === 'male' ? '👨' : c.gender === 'female' ? '👩' : '👤'}
                        </div>
                        <div className={styles.familyMemberInfo}>
                          <div className={styles.familyMemberName}>{c.name}</div>
                          <div className={styles.familyMemberRelation}>Child</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'events' && (
              <div className={styles.tabPane}>
                <p>Events will be displayed here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


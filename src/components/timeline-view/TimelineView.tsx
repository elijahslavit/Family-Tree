import React from 'react'
import { useFamilyData } from '../../context/FamilyDataContext'
import type { Person } from '../../types'
import styles from './TimelineView.module.scss'

interface TimelineViewProps {
  onPersonSelect: (person: Person) => void
}

export function TimelineView({ onPersonSelect }: TimelineViewProps) {
  const { store } = useFamilyData()
  const events = store.getTimelineEvents()

  return (
    <section className={styles.timelineView}>
      <div className={styles.viewHeader}>
        <h2>Family Timeline</h2>
      </div>
      <div className={styles.timelineContainer}>
        {events.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.icon}>📅</div>
            <h3>No timeline events</h3>
            <p>Upload a GEDCOM file to see your family timeline.</p>
          </div>
        ) : (
          <div className={styles.timeline}>
            {events.map((event, index) => (
              <div key={index} className={`${styles.timelineEvent} ${styles[event.type]}`}>
                <div className={styles.timelineEventHeader}>
                  <span className={styles.timelineEventType}>
                    {event.type === 'birth' ? '👶' : event.type === 'death' ? '🕯️' : event.type === 'marriage' ? '💒' : '📌'}
                  </span>
                  <span className={styles.timelineEventTitle}>{event.title}</span>
                  <span className={styles.timelineEventDate}>{event.displayDate || ''}</span>
                </div>
                {event.place && (
                  <div className={styles.timelineEventLocation}>📍 {event.place}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}


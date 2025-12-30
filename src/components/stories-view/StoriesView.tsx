import React from 'react'
import type { Person } from '../../types'
import styles from './StoriesView.module.scss'

interface StoriesViewProps {
  onPersonSelect: (person: Person) => void
}

export function StoriesView({ onPersonSelect }: StoriesViewProps) {
  return (
    <section className={styles.storiesView}>
      <div className={styles.viewHeader}>
        <h2>Family Stories & History</h2>
      </div>
      <div className={styles.storiesContainer}>
        <div className={styles.emptyState}>
          <div className={styles.icon}>📖</div>
          <h3>No stories yet</h3>
          <p>Family stories will appear here.</p>
        </div>
      </div>
    </section>
  )
}


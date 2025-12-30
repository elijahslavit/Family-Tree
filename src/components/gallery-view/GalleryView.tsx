import React from 'react'
import type { Person } from '../../types'
import styles from './GalleryView.module.scss'

interface GalleryViewProps {
  onPersonSelect: (person: Person) => void
}

export function GalleryView({ onPersonSelect }: GalleryViewProps) {
  return (
    <section className={styles.galleryView}>
      <div className={styles.viewHeader}>
        <h2>Photo Gallery</h2>
      </div>
      <div className={styles.galleryContainer}>
        <div className={styles.emptyState}>
          <div className={styles.icon}>📷</div>
          <h3>No photos available</h3>
          <p>Upload a GEDCOM file with media references to see photos.</p>
        </div>
      </div>
    </section>
  )
}


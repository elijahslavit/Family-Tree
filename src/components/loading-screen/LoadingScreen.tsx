import React from 'react'
import styles from './LoadingScreen.module.scss'

interface LoadingScreenProps {
  isLoading: boolean
}

export function LoadingScreen({ isLoading }: LoadingScreenProps) {
  if (!isLoading) return null

  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loader}>
        <div className={styles.treeIcon}>🌳</div>
        <h2>Loading Your Family Tree...</h2>
        <div className={styles.loadingBar}>
          <div className={styles.loadingProgress}></div>
        </div>
      </div>
    </div>
  )
}


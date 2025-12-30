import React, { useCallback, useRef, useState } from 'react'
import { useFamilyData } from '../../context/FamilyDataContext'
import { GedcomParser } from '../../utils/gedcom-parser'
import styles from './UploadModal.module.scss'

interface UploadModalProps {
  onClose: () => void
  onLoadStart: () => void
  onLoadComplete: () => void
}

export function UploadModal({ onClose, onLoadStart, onLoadComplete }: UploadModalProps) {
  const { loadData } = useFamilyData()
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const processFile = useCallback(async (file: File) => {
    try {
      onLoadStart()
      setStatus(null)

      const content = await file.text()
      const parser = new GedcomParser()
      const data = parser.parse(content)

      loadData(data)

      setStatus({
        type: 'success',
        message: `✓ Successfully loaded ${data.people.length} people from your family tree!`
      })

      setTimeout(() => {
        onLoadComplete()
        onClose()
      }, 2000)
    } catch (error) {
      onLoadComplete()
      setStatus({
        type: 'error',
        message: `✗ Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }, [loadData, onClose, onLoadStart, onLoadComplete])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.ged') || file.name.endsWith('.gedcom'))) {
      processFile(file)
    }
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  return (
    <div className={styles.modal} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modalContent}>
        <button className={styles.modalClose} onClick={onClose}>&times;</button>
        <h2>Upload GEDCOM File</h2>
        <p>Upload your .ged file exported from Gramps or any other genealogy software.</p>
        <div
          className={`${styles.uploadArea} ${isDragging ? styles.dragover : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className={styles.uploadIcon}>📁</div>
          <p>Drag & drop your .ged file here</p>
          <p>or</p>
          <label className={styles.uploadBtn}>
            Browse Files
            <input
              ref={fileInputRef}
              type="file"
              accept=".ged,.gedcom"
              onChange={handleFileSelect}
              hidden
            />
          </label>
        </div>
        {status && (
          <div className={`${styles.uploadStatus} ${styles[status.type]}`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  )
}


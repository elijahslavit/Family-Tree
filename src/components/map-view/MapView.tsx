import React, { useEffect, useRef } from 'react'
import { useFamilyData } from '../../context/FamilyDataContext'
import L from 'leaflet'
import type { Person } from '../../types'
import styles from './MapView.module.scss'

interface MapViewProps {
  onPersonSelect: (person: Person) => void
}

export function MapView({ onPersonSelect }: MapViewProps) {
  const { store } = useFamilyData()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current).setView([40.7128, -74.0060], 3)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <section className={styles.mapView}>
      <div className={styles.viewHeader}>
        <h2>Migration Map</h2>
      </div>
      <div ref={mapRef} className={styles.mapContainer}></div>
    </section>
  )
}


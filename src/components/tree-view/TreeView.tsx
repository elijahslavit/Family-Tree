import React, { useEffect, useRef, useState } from 'react'
import { useFamilyData } from '../../context/FamilyDataContext'
import * as d3 from 'd3'
import type { Person, TreeMode } from '../../types'
import styles from './TreeView.module.scss'

interface TreeViewProps {
  onPersonSelect: (person: Person) => void
}

export function TreeView({ onPersonSelect }: TreeViewProps) {
  const { store } = useFamilyData()
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentMode, setCurrentMode] = useState<TreeMode>('pedigree')
  const [currentPerson, setCurrentPerson] = useState<Person | null>(null)

  useEffect(() => {
    const people = store.getAllPeople()
    if (people.length > 0 && !currentPerson) {
      setCurrentPerson(people[0])
    }
  }, [store, currentPerson])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !currentPerson) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    const svg = d3.select(svgRef.current)
    svg.attr('width', width).attr('height', height)

    const g = svg.append('g').attr('class', 'tree-group')

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString())
      })

    svg.call(zoom)

    // Simple tree rendering - will be enhanced
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#F5F2EE')
      .attr('font-size', '24px')
      .text(currentPerson.name)

    return () => {
      svg.selectAll('*').remove()
    }
  }, [currentPerson, currentMode])

  const handleModeChange = (mode: TreeMode) => {
    setCurrentMode(mode)
  }

  return (
    <section className={styles.treeView}>
      <div className={styles.viewHeader}>
        <h2>Interactive Family Tree</h2>
        <div className={styles.treeControls}>
          <div className={styles.viewModeToggle}>
            <button
              className={`${styles.modeBtn} ${currentMode === 'pedigree' ? styles.active : ''}`}
              onClick={() => handleModeChange('pedigree')}
            >
              Pedigree
            </button>
            <button
              className={`${styles.modeBtn} ${currentMode === 'descendants' ? styles.active : ''}`}
              onClick={() => handleModeChange('descendants')}
            >
              Descendants
            </button>
            <button
              className={`${styles.modeBtn} ${currentMode === 'fan' ? styles.active : ''}`}
              onClick={() => handleModeChange('fan')}
            >
              Fan Chart
            </button>
          </div>
        </div>
      </div>
      <div ref={containerRef} className={styles.treeContainer}>
        <svg ref={svgRef} className={styles.treeSvg}></svg>
      </div>
    </section>
  )
}


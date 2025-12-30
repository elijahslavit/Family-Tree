import React, { useState } from 'react'
import { FamilyDataProvider } from './context/FamilyDataContext'
import { Header } from './components/header/Header'
import { TreeView } from './components/tree-view/TreeView'
import { TimelineView } from './components/timeline-view/TimelineView'
import { MapView } from './components/map-view/MapView'
import { GalleryView } from './components/gallery-view/GalleryView'
import { StoriesView } from './components/stories-view/StoriesView'
import { PersonModal } from './components/modals/PersonModal'
import { UploadModal } from './components/modals/UploadModal'
import { LoadingScreen } from './components/loading-screen/LoadingScreen'
import type { ViewType, Person } from './types'

export function App() {
  const [currentView, setCurrentView] = useState<ViewType>('tree')
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handlePersonSelect = (person: Person) => {
    setSelectedPerson(person)
  }

  const handleClosePersonModal = () => {
    setSelectedPerson(null)
  }

  return (
    <FamilyDataProvider>
      <div className="app">
        <LoadingScreen isLoading={isLoading} />
        <Header
          currentView={currentView}
          onViewChange={setCurrentView}
          onPersonSelect={handlePersonSelect}
          onUploadClick={() => setShowUploadModal(true)}
        />
        <main className="main-content">
          {currentView === 'tree' && (
            <TreeView onPersonSelect={handlePersonSelect} />
          )}
          {currentView === 'timeline' && (
            <TimelineView onPersonSelect={handlePersonSelect} />
          )}
          {currentView === 'map' && (
            <MapView onPersonSelect={handlePersonSelect} />
          )}
          {currentView === 'gallery' && (
            <GalleryView onPersonSelect={handlePersonSelect} />
          )}
          {currentView === 'stories' && (
            <StoriesView onPersonSelect={handlePersonSelect} />
          )}
        </main>
        {selectedPerson && (
          <PersonModal
            person={selectedPerson}
            onClose={handleClosePersonModal}
            onPersonSelect={handlePersonSelect}
          />
        )}
        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            onLoadStart={() => setIsLoading(true)}
            onLoadComplete={() => setIsLoading(false)}
          />
        )}
      </div>
    </FamilyDataProvider>
  )
}


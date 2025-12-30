export interface DateObject {
  year?: number
  month?: number
  day?: number
  full?: string
}

export interface Event {
  date?: string
  dateObject?: DateObject
  place?: string
}

export interface Spouse {
  person: string
  marriage?: Event
}

export interface Person {
  id: string
  name: string
  firstName?: string
  lastName?: string
  gender?: 'male' | 'female' | 'unknown'
  birth?: Event
  death?: Event
  baptism?: Event
  occupation?: string
  education?: string
  notes?: string[]
  photo?: string
  parents: string[]
  spouses: Spouse[]
  children: string[]
}

export interface Family {
  id: string
  husband?: string
  wife?: string
  children: string[]
  marriage?: Event
  divorce?: Event
}

export interface Source {
  id: string
  title?: string
  author?: string
  publication?: string
  text?: string
}

export interface Media {
  id: string
  title?: string
  file?: string
  format?: string
  type?: string
}

export interface Photo {
  id: string
  title: string
  date?: string
  people: string[]
  category?: 'portraits' | 'families' | 'events' | 'documents'
  url?: string
  placeholder?: string
}

export interface Story {
  id: string
  title: string
  content: string
  type: 'biography' | 'memory' | 'history' | 'tradition'
  people: string[]
  date?: string
}

export interface ParsedGedcomData {
  people: Person[]
  families: Family[]
  sources: Source[]
  media: Media[]
}

export type ViewType = 'tree' | 'timeline' | 'map' | 'gallery' | 'stories'

export type TreeMode = 'pedigree' | 'descendants' | 'fan'


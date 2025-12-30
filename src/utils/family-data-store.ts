import type { Person, Family, Source, Media, ParsedGedcomData, DateObject } from '../types'

export interface TimelineEvent {
  type: 'birth' | 'death' | 'marriage' | 'event'
  person: Person
  spouse?: Person
  date: DateObject
  displayDate?: string
  place?: string
  title: string
  year: number
}

export class FamilyDataStore {
  private people: Person[] = []
  private families: Family[] = []
  private sources: Source[] = []
  private media: Media[] = []
  private peopleMap = new Map<string, Person>()
  private isLoaded = false

  loadFromGedcom(parsedData: ParsedGedcomData): void {
    this.people = parsedData.people || []
    this.families = parsedData.families || []
    this.sources = parsedData.sources || []
    this.media = parsedData.media || []
    this.buildIndex()
    this.isLoaded = true
  }

  clearData(): void {
    this.people = []
    this.families = []
    this.sources = []
    this.media = []
    this.peopleMap.clear()
    this.isLoaded = false
  }

  private buildIndex(): void {
    this.peopleMap = new Map(this.people.map(p => [p.id, p]))
    
    this.families.forEach(family => {
      if (family.husband) {
        const husband = this.peopleMap.get(family.husband)
        if (husband) {
          family.children.forEach(childId => {
            if (!husband.children.includes(childId)) {
              husband.children.push(childId)
            }
          })
        }
      }
      if (family.wife) {
        const wife = this.peopleMap.get(family.wife)
        if (wife) {
          family.children.forEach(childId => {
            if (!wife.children.includes(childId)) {
              wife.children.push(childId)
            }
          })
        }
      }
    })
  }

  getPerson(id: string): Person | undefined {
    return this.peopleMap.get(id)
  }

  getAllPeople(): Person[] {
    return this.people
  }

  searchPeople(query: string): Person[] {
    const lowerQuery = query.toLowerCase()
    return this.people.filter(person =>
      person.name.toLowerCase().includes(lowerQuery) ||
      (person.firstName && person.firstName.toLowerCase().includes(lowerQuery)) ||
      (person.lastName && person.lastName.toLowerCase().includes(lowerQuery))
    )
  }

  getAncestors(personId: string, maxGenerations = 10): Person[] {
    const ancestors: Person[] = []
    const visited = new Set<string>()

    const traverse = (id: string, generation: number): void => {
      if (generation > maxGenerations || visited.has(id)) return
      visited.add(id)

      const person = this.getPerson(id)
      if (!person) return

      person.parents.forEach(parentId => {
        const parent = this.getPerson(parentId)
        if (parent) {
          ancestors.push({ ...parent, generation } as Person & { generation: number })
          traverse(parentId, generation + 1)
        }
      })
    }

    traverse(personId, 1)
    return ancestors
  }

  getDescendants(personId: string, maxGenerations = 10): Person[] {
    const descendants: Person[] = []
    const visited = new Set<string>()

    const traverse = (id: string, generation: number): void => {
      if (generation > maxGenerations || visited.has(id)) return
      visited.add(id)

      const person = this.getPerson(id)
      if (!person) return

      person.children.forEach(childId => {
        const child = this.getPerson(childId)
        if (child) {
          descendants.push({ ...child, generation } as Person & { generation: number })
          traverse(childId, generation + 1)
        }
      })
    }

    traverse(personId, 1)
    return descendants
  }

  getParents(personId: string): Person[] {
    const person = this.getPerson(personId)
    if (!person) return []
    return person.parents.map(id => this.getPerson(id)).filter((p): p is Person => Boolean(p))
  }

  getChildren(personId: string): Person[] {
    const person = this.getPerson(personId)
    if (!person) return []
    return person.children.map(id => this.getPerson(id)).filter((p): p is Person => Boolean(p))
  }

  getSiblings(personId: string): Person[] {
    const person = this.getPerson(personId)
    if (!person) return []

    const siblingIds = new Set<string>()
    person.parents.forEach(parentId => {
      const parent = this.getPerson(parentId)
      if (parent) {
        parent.children.forEach(childId => {
          if (childId !== personId) {
            siblingIds.add(childId)
          }
        })
      }
    })

    return Array.from(siblingIds).map(id => this.getPerson(id)).filter((p): p is Person => Boolean(p))
  }

  getSpouses(personId: string): Array<{ person: Person; marriage?: { date?: string; place?: string }; divorce?: { date?: string; place?: string } }> {
    const person = this.getPerson(personId)
    if (!person) return []
    return person.spouses.map(s => {
      const spousePerson = this.getPerson(s.person)
      if (!spousePerson) return null
      return {
        person: spousePerson,
        marriage: s.marriage,
        divorce: undefined
      }
    }).filter((s): s is { person: Person; marriage?: { date?: string; place?: string }; divorce?: { date?: string; place?: string } } => Boolean(s))
  }

  getTimelineEvents(): TimelineEvent[] {
    const events: TimelineEvent[] = []

    this.people.forEach(person => {
      if (person.birth?.dateObject?.year) {
        events.push({
          type: 'birth',
          person,
          date: person.birth.dateObject,
          displayDate: person.birth.date,
          place: person.birth.place,
          title: `${person.name} was born`,
          year: person.birth.dateObject.year
        })
      }

      if (person.death?.dateObject?.year) {
        events.push({
          type: 'death',
          person,
          date: person.death.dateObject,
          displayDate: person.death.date,
          place: person.death.place,
          title: `${person.name} passed away`,
          year: person.death.dateObject.year
        })
      }

      person.spouses.forEach(spouse => {
        if (spouse.marriage?.dateObject?.year) {
          const spousePerson = this.getPerson(spouse.person)
          if (spousePerson && person.gender === 'male') {
            events.push({
              type: 'marriage',
              person,
              spouse: spousePerson,
              date: spouse.marriage.dateObject,
              displayDate: spouse.marriage.date,
              place: spouse.marriage.place,
              title: `${person.name} married ${spousePerson.name}`,
              year: spouse.marriage.dateObject.year
            })
          }
        }
      })
    })

    return events.sort((a, b) => a.year - b.year)
  }

  getLoaded(): boolean {
    return this.isLoaded
  }

  getAllFamilies(): Family[] {
    return this.families
  }

  getAllSources(): Source[] {
    return this.sources
  }

  getAllMedia(): Media[] {
    return this.media
  }
}


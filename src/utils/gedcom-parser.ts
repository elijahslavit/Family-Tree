import type { ParsedGedcomData, Person, Family, Source, Media, Event, DateObject } from '../types'

interface GedcomLine {
  level: number
  tag: string
  xref?: string
  value?: string
}

interface GedcomRecord {
  tag: string
  xref?: string
  [key: string]: any
}

export class GedcomParser {
  private individuals = new Map<string, GedcomRecord>()
  private families = new Map<string, GedcomRecord>()
  private sources = new Map<string, GedcomRecord>()
  private media = new Map<string, GedcomRecord>()
  private notes = new Map<string, string>()
  private header: Record<string, any> = {}
  private rawLines: string[] = []

  parse(content: string): ParsedGedcomData {
    this.rawLines = content.split(/\r?\n/).filter(line => line.trim())
    this.individuals.clear()
    this.families.clear()
    this.sources.clear()
    this.media.clear()
    this.notes.clear()

    let currentRecord: GedcomRecord | null = null
    let recordStack: GedcomRecord[] = []

    for (let i = 0; i < this.rawLines.length; i++) {
      const line = this.rawLines[i]
      const parsed = this.parseLine(line)

      if (!parsed) continue

      const { level, tag, xref, value } = parsed

      if (level === 0) {
        this.saveCurrentRecord(currentRecord)
        currentRecord = this.createRecord(tag, xref, value)
        recordStack = [currentRecord]
      } else if (currentRecord) {
        while (recordStack.length > level) {
          recordStack.pop()
        }

        const parent = recordStack[recordStack.length - 1]
        const newItem = this.addToRecord(parent, tag, value, level)

        if (newItem && level < recordStack.length) {
          recordStack.push(newItem)
        }
      }
    }

    this.saveCurrentRecord(currentRecord)

    return this.convertToStructuredData()
  }

  private parseLine(line: string): GedcomLine | null {
    const match = line.match(/^(\d+)\s+(?:@([^@]+)@\s+)?(\S+)(?:\s+(.+))?$/)
    if (!match) return null

    const [, levelStr, xref, tag, value] = match
    return {
      level: parseInt(levelStr, 10),
      tag: tag.toUpperCase(),
      xref: xref || undefined,
      value: value || undefined
    }
  }

  private createRecord(tag: string, xref: string | undefined, value: string | undefined): GedcomRecord {
    const record: GedcomRecord = { tag, xref }

    if (tag === 'HEAD') {
      this.header = record
    }

    return record
  }

  private addToRecord(parent: GedcomRecord, tag: string, value: string | undefined, level: number): any {
    if (tag === 'NOTE' && value && value.startsWith('@') && value.endsWith('@')) {
      const noteId = value
      const noteText = this.notes.get(noteId) || ''
      parent.notes = parent.notes || []
      parent.notes.push(noteText)
      return null
    }

    if (tag === 'CONT' || tag === 'CONC') {
      const lastNote = Array.isArray(parent.notes) ? parent.notes[parent.notes.length - 1] : parent.notes
      if (typeof lastNote === 'string') {
        if (tag === 'CONT') {
          parent.notes = (Array.isArray(parent.notes) ? parent.notes : [parent.notes]).slice(0, -1)
          parent.notes.push(lastNote + '\n' + (value || ''))
        } else {
          parent.notes = (Array.isArray(parent.notes) ? parent.notes : [parent.notes]).slice(0, -1)
          parent.notes.push(lastNote + (value || ''))
        }
      }
      return null
    }

    if (value) {
      if (!parent[tag]) {
        parent[tag] = value
      } else if (Array.isArray(parent[tag])) {
        parent[tag].push(value)
      } else {
        parent[tag] = [parent[tag], value]
      }
    } else {
      const subRecord: any = {}
      parent[tag] = parent[tag] ? (Array.isArray(parent[tag]) ? parent[tag] : [parent[tag]]) : []
      parent[tag].push(subRecord)
      return subRecord
    }

    return null
  }

  private saveCurrentRecord(record: GedcomRecord | null): void {
    if (!record) return

    if (record.tag === 'INDI' && record.xref) {
      this.individuals.set(record.xref, record)
    } else if (record.tag === 'FAM' && record.xref) {
      this.families.set(record.xref, record)
    } else if (record.tag === 'SOUR' && record.xref) {
      this.sources.set(record.xref, record)
    } else if (record.tag === 'OBJE' && record.xref) {
      this.media.set(record.xref, record)
    } else if (record.tag === 'NOTE' && record.xref) {
      this.notes.set(record.xref, this.extractNoteText(record))
    }
  }

  private extractNoteText(record: GedcomRecord): string {
    if (typeof record.NOTE === 'string') {
      return record.NOTE
    }
    if (Array.isArray(record.NOTE)) {
      return record.NOTE.join(' ')
    }
    return ''
  }

  private convertToStructuredData(): ParsedGedcomData {
    const people: Person[] = []
    const families: Family[] = []
    const sources: Source[] = []
    const media: Media[] = []

    this.individuals.forEach((record, id) => {
      const person = this.convertIndividual(record, id)
      if (person) people.push(person)
    })

    this.families.forEach((record, id) => {
      const family = this.convertFamily(record, id)
      if (family) families.push(family)
    })

    this.sources.forEach((record, id) => {
      const source = this.convertSource(record, id)
      if (source) sources.push(source)
    })

    this.media.forEach((record, id) => {
      const mediaItem = this.convertMedia(record, id)
      if (mediaItem) media.push(mediaItem)
    })

    return { people, families, sources, media }
  }

  private convertIndividual(record: GedcomRecord, id: string): Person | null {
    const name = this.extractName(record)
    if (!name) return null

    const person: Person = {
      id: `@${id}@`,
      name,
      firstName: this.extractFirstName(record),
      lastName: this.extractLastName(record),
      gender: this.extractGender(record),
      birth: this.extractEvent(record.BIRT),
      death: this.extractEvent(record.DEAT),
      baptism: this.extractEvent(record.BAPM),
      occupation: this.extractValue(record.OCCU),
      education: this.extractValue(record.EDUC),
      notes: this.extractNotes(record),
      photo: this.extractPhoto(record),
      parents: [],
      spouses: [],
      children: []
    }

    if (record.FAMS) {
      const familyIds = Array.isArray(record.FAMS) ? record.FAMS : [record.FAMS]
      familyIds.forEach((famId: any) => {
        const famIdStr = String(famId).replace(/@/g, '')
        const family = this.families.get(famIdStr)
        if (family) {
          const husbandId = family.HUSB ? (String(family.HUSB).startsWith('@') ? family.HUSB : `@${family.HUSB}@`) : undefined
          const wifeId = family.WIFE ? (String(family.WIFE).startsWith('@') ? family.WIFE : `@${family.WIFE}@`) : undefined
          const spouseId = husbandId === person.id ? wifeId : husbandId
          if (spouseId) {
            person.spouses.push({
              person: spouseId,
              marriage: this.extractEvent(family.MARR)
            })
          }
        }
      })
    }

    if (record.FAMC) {
      const familyIds = Array.isArray(record.FAMC) ? record.FAMC : [record.FAMC]
      familyIds.forEach((famId: any) => {
        const famIdStr = String(famId).replace(/@/g, '')
        const family = this.families.get(famIdStr)
        if (family) {
          if (family.HUSB) {
            const husbId = String(family.HUSB).startsWith('@') ? family.HUSB : `@${family.HUSB}@`
            person.parents.push(husbId)
          }
          if (family.WIFE) {
            const wifeId = String(family.WIFE).startsWith('@') ? family.WIFE : `@${family.WIFE}@`
            person.parents.push(wifeId)
          }
        }
      })
    }

    return person
  }

  private convertFamily(record: GedcomRecord, id: string): Family | null {
    const husband = record.HUSB ? (String(record.HUSB).startsWith('@') ? record.HUSB : `@${record.HUSB}@`) : undefined
    const wife = record.WIFE ? (String(record.WIFE).startsWith('@') ? record.WIFE : `@${record.WIFE}@`) : undefined
    const children = Array.isArray(record.CHIL)
      ? record.CHIL.map((c: any) => String(c).startsWith('@') ? c : `@${c}@`)
      : record.CHIL
        ? [String(record.CHIL).startsWith('@') ? record.CHIL : `@${record.CHIL}@`]
        : []

    return {
      id: `@${id}@`,
      husband,
      wife,
      children,
      marriage: this.extractEvent(record.MARR),
      divorce: this.extractEvent(record.DIV)
    }
  }

  private convertSource(record: GedcomRecord, id: string): Source {
    return {
      id: `@${id}@`,
      title: this.extractValue(record.TITL),
      author: this.extractValue(record.AUTH),
      publication: this.extractValue(record.PUBL),
      text: this.extractValue(record.TEXT)
    }
  }

  private convertMedia(record: GedcomRecord, id: string): Media {
    return {
      id: `@${id}@`,
      title: this.extractValue(record.TITL),
      file: this.extractValue(record.FILE),
      format: this.extractValue(record.FORM),
      type: this.extractValue(record.TYPE)
    }
  }

  private extractName(record: GedcomRecord): string {
    if (!record.NAME) return 'Unknown'

    const nameRecord = Array.isArray(record.NAME) ? record.NAME[0] : record.NAME
    if (typeof nameRecord === 'string') {
      return nameRecord.replace(/\//g, '').trim()
    }

    if (nameRecord && typeof nameRecord === 'object') {
      const given = nameRecord.GIVN || ''
      const surname = nameRecord.SURN || ''
      return `${given} ${surname}`.trim() || 'Unknown'
    }

    return 'Unknown'
  }

  private extractFirstName(record: GedcomRecord): string | undefined {
    const nameRecord = Array.isArray(record.NAME) ? record.NAME[0] : record.NAME
    if (nameRecord && typeof nameRecord === 'object') {
      return nameRecord.GIVN
    }
    return undefined
  }

  private extractLastName(record: GedcomRecord): string | undefined {
    const nameRecord = Array.isArray(record.NAME) ? record.NAME[0] : record.NAME
    if (nameRecord && typeof nameRecord === 'object') {
      return nameRecord.SURN
    }
    return undefined
  }

  private extractGender(record: GedcomRecord): 'male' | 'female' | 'unknown' {
    const gender = this.extractValue(record.SEX)
    if (gender === 'M') return 'male'
    if (gender === 'F') return 'female'
    return 'unknown'
  }

  private extractEvent(eventData: any): Event | undefined {
    if (!eventData) return undefined

    const eventRecord = Array.isArray(eventData) ? eventData[0] : eventData
    if (typeof eventRecord === 'string') {
      return { date: eventRecord, dateObject: this.parseDate(eventRecord) }
    }

    if (eventRecord && typeof eventRecord === 'object') {
      return {
        date: eventRecord.DATE || undefined,
        dateObject: eventRecord.DATE ? this.parseDate(eventRecord.DATE) : undefined,
        place: eventRecord.PLAC || undefined
      }
    }

    return undefined
  }

  private parseDate(dateStr: string): DateObject | undefined {
    if (!dateStr) return undefined

    const yearMatch = dateStr.match(/(\d{4})/)
    const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined

    const monthMatch = dateStr.match(/(\d{1,2})/)
    const month = monthMatch ? parseInt(monthMatch[1], 10) : undefined

    return {
      year,
      month,
      full: dateStr
    }
  }

  private extractValue(value: any): string | undefined {
    if (typeof value === 'string') return value
    if (Array.isArray(value) && value.length > 0) {
      return typeof value[0] === 'string' ? value[0] : undefined
    }
    return undefined
  }

  private extractNotes(record: GedcomRecord): string[] {
    if (!record.NOTE) return []

    if (typeof record.NOTE === 'string') {
      return [record.NOTE]
    }

    if (Array.isArray(record.NOTE)) {
      return record.NOTE.filter((n): n is string => typeof n === 'string')
    }

    return []
  }

  private extractPhoto(record: GedcomRecord): string | undefined {
    if (record.OBJE) {
      const obje = Array.isArray(record.OBJE) ? record.OBJE[0] : record.OBJE
      if (obje && typeof obje === 'object' && obje.FILE) {
        return obje.FILE
      }
    }
    return undefined
  }
}


/**
 * GEDCOM Parser
 * Parses GEDCOM files (versions 5.5, 5.5.1, 7.0) into a structured JavaScript object
 */

class GedcomParser {
    constructor() {
        this.individuals = new Map();
        this.families = new Map();
        this.sources = new Map();
        this.media = new Map();
        this.notes = new Map();
        this.header = {};
        this.rawLines = [];
    }

    /**
     * Parse a GEDCOM file content string
     * @param {string} content - The raw GEDCOM file content
     * @returns {Object} Parsed family tree data
     */
    parse(content) {
        this.rawLines = content.split(/\r?\n/).filter(line => line.trim());

        let currentRecord = null;
        let currentSubRecord = null;
        let recordStack = [];

        for (let i = 0; i < this.rawLines.length; i++) {
            const line = this.rawLines[i];
            const parsed = this.parseLine(line);

            if (!parsed) continue;

            const { level, tag, xref, value } = parsed;

            // Level 0 starts a new record
            if (level === 0) {
                this.saveCurrentRecord(currentRecord);
                currentRecord = this.createRecord(tag, xref, value);
                recordStack = [currentRecord];
            } else if (currentRecord) {
                // Manage the record stack based on level
                while (recordStack.length > level) {
                    recordStack.pop();
                }

                const parent = recordStack[recordStack.length - 1];
                const newItem = this.addToRecord(parent, tag, value, level);

                if (newItem && typeof newItem === 'object') {
                    recordStack.push(newItem);
                }
            }
        }

        // Save the last record
        this.saveCurrentRecord(currentRecord);

        return this.buildFamilyTree();
    }

    /**
     * Parse a single GEDCOM line
     */
    parseLine(line) {
        // GEDCOM line format: LEVEL [XREF] TAG [VALUE]
        // Examples:
        // 0 @I1@ INDI
        // 1 NAME John /Smith/
        // 2 GIVN John

        const match = line.match(/^(\d+)\s+(?:(@\S+@)\s+)?(\S+)(?:\s+(.*))?$/);

        if (!match) return null;

        return {
            level: parseInt(match[1], 10),
            xref: match[2] || null,
            tag: match[3],
            value: match[4] || ''
        };
    }

    /**
     * Create a new record based on tag type
     */
    createRecord(tag, xref, value) {
        switch (tag) {
            case 'HEAD':
                return { type: 'HEAD', data: {} };
            case 'INDI':
                return { type: 'INDI', xref, data: { id: xref } };
            case 'FAM':
                return { type: 'FAM', xref, data: { id: xref } };
            case 'SOUR':
                return { type: 'SOUR', xref, data: { id: xref } };
            case 'OBJE':
                return { type: 'OBJE', xref, data: { id: xref } };
            case 'NOTE':
                return { type: 'NOTE', xref, data: { id: xref, text: value } };
            case 'REPO':
                return { type: 'REPO', xref, data: { id: xref } };
            case 'SUBM':
                return { type: 'SUBM', xref, data: { id: xref } };
            default:
                return { type: tag, xref, data: { value } };
        }
    }

    /**
     * Add data to the current record
     */
    addToRecord(record, tag, value, level) {
        if (!record || !record.data) return null;

        const data = record.data;

        switch (tag) {
            // Name components
            case 'NAME':
                data.name = this.parseName(value);
                return data.name;
            case 'GIVN':
                if (data.given !== undefined) data.given = value;
                else if (record.given !== undefined) record.given = value;
                return null;
            case 'SURN':
                if (data.surname !== undefined) data.surname = value;
                else if (record.surname !== undefined) record.surname = value;
                return null;
            case 'NPFX':
                record.prefix = value;
                return null;
            case 'NSFX':
                record.suffix = value;
                return null;
            case 'NICK':
                record.nickname = value;
                return null;

            // Gender
            case 'SEX':
                data.gender = value === 'M' ? 'male' : value === 'F' ? 'female' : 'unknown';
                return null;

            // Events
            case 'BIRT':
                data.birth = data.birth || {};
                return data.birth;
            case 'DEAT':
                data.death = data.death || {};
                return data.death;
            case 'MARR':
                data.marriage = data.marriage || {};
                return data.marriage;
            case 'DIV':
                data.divorce = data.divorce || {};
                return data.divorce;
            case 'BURI':
                data.burial = data.burial || {};
                return data.burial;
            case 'BAPM':
            case 'CHR':
                data.baptism = data.baptism || {};
                return data.baptism;
            case 'CONF':
                data.confirmation = data.confirmation || {};
                return data.confirmation;
            case 'GRAD':
                data.graduation = data.graduation || {};
                return data.graduation;
            case 'EMIG':
                data.emigration = data.emigration || {};
                return data.emigration;
            case 'IMMI':
                data.immigration = data.immigration || {};
                return data.immigration;
            case 'NATU':
                data.naturalization = data.naturalization || {};
                return data.naturalization;
            case 'RESI':
                if (!data.residences) data.residences = [];
                const resi = {};
                data.residences.push(resi);
                return resi;
            case 'OCCU':
                data.occupation = value;
                return null;
            case 'EDUC':
                data.education = value;
                return null;
            case 'RELI':
                data.religion = value;
                return null;
            case 'EVEN':
                if (!data.events) data.events = [];
                const event = { type: value };
                data.events.push(event);
                return event;

            // Event details
            case 'DATE':
                record.date = this.parseDate(value);
                return null;
            case 'PLAC':
                record.place = value;
                return null;
            case 'ADDR':
                record.address = value;
                return null;
            case 'CAUS':
                record.cause = value;
                return null;
            case 'AGE':
                record.age = value;
                return null;
            case 'TYPE':
                record.type = value;
                return null;

            // Family links
            case 'HUSB':
                data.husband = value;
                return null;
            case 'WIFE':
                data.wife = value;
                return null;
            case 'CHIL':
                if (!data.children) data.children = [];
                data.children.push(value);
                return null;
            case 'FAMC':
                data.familyChild = value;
                return null;
            case 'FAMS':
                if (!data.familySpouse) data.familySpouse = [];
                data.familySpouse.push(value);
                return null;

            // Media
            case 'OBJE':
                if (!data.media) data.media = [];
                if (value.startsWith('@')) {
                    data.media.push({ ref: value });
                } else {
                    const mediaObj = {};
                    data.media.push(mediaObj);
                    return mediaObj;
                }
                return null;
            case 'FILE':
                record.file = value;
                return null;
            case 'FORM':
                record.format = value;
                return null;
            case 'TITL':
                record.title = value;
                return null;

            // Notes
            case 'NOTE':
                if (!data.notes) data.notes = [];
                if (value.startsWith('@')) {
                    data.notes.push({ ref: value });
                } else {
                    data.notes.push({ text: value });
                }
                return null;
            case 'CONT':
                // Continuation of previous text
                if (record.text !== undefined) {
                    record.text += '\n' + value;
                } else if (record.note !== undefined) {
                    record.note += '\n' + value;
                }
                return null;
            case 'CONC':
                // Concatenation (no newline)
                if (record.text !== undefined) {
                    record.text += value;
                } else if (record.note !== undefined) {
                    record.note += value;
                }
                return null;

            // Sources
            case 'SOUR':
                if (!data.sources) data.sources = [];
                if (value.startsWith('@')) {
                    data.sources.push({ ref: value });
                } else {
                    data.sources.push({ text: value });
                }
                return null;
            case 'PAGE':
                record.page = value;
                return null;
            case 'AUTH':
                data.author = value;
                return null;
            case 'PUBL':
                data.publication = value;
                return null;

            // Header info
            case 'VERS':
                data.version = value;
                return null;
            case 'CHAR':
                data.charset = value;
                return null;
            case 'GEDC':
                data.gedcom = {};
                return data.gedcom;
            case 'LANG':
                data.language = value;
                return null;

            // Reference numbers
            case 'REFN':
                data.refn = value;
                return null;
            case 'RIN':
                data.rin = value;
                return null;
            case 'AFN':
                data.afn = value;
                return null;

            // Change tracking
            case 'CHAN':
                data.changed = {};
                return data.changed;

            default:
                // Store unknown tags
                if (!data._unknown) data._unknown = {};
                data._unknown[tag] = value;
                return null;
        }
    }

    /**
     * Save the current record to appropriate collection
     */
    saveCurrentRecord(record) {
        if (!record) return;

        switch (record.type) {
            case 'HEAD':
                this.header = record.data;
                break;
            case 'INDI':
                this.individuals.set(record.xref, record.data);
                break;
            case 'FAM':
                this.families.set(record.xref, record.data);
                break;
            case 'SOUR':
                this.sources.set(record.xref, record.data);
                break;
            case 'OBJE':
                this.media.set(record.xref, record.data);
                break;
            case 'NOTE':
                this.notes.set(record.xref, record.data);
                break;
        }
    }

    /**
     * Parse a GEDCOM name into components
     */
    parseName(nameString) {
        // GEDCOM name format: "Given /Surname/" or "Given /Surname/ Suffix"
        const match = nameString.match(/^([^/]*?)(?:\s*\/([^/]*)\/)?\s*(.*)$/);

        if (match) {
            return {
                full: nameString.replace(/\//g, '').trim(),
                given: match[1].trim(),
                surname: match[2] ? match[2].trim() : '',
                suffix: match[3] ? match[3].trim() : ''
            };
        }

        return {
            full: nameString,
            given: nameString,
            surname: '',
            suffix: ''
        };
    }

    /**
     * Parse a GEDCOM date into a structured object
     */
    parseDate(dateString) {
        if (!dateString) return null;

        const result = {
            original: dateString,
            year: null,
            month: null,
            day: null,
            approximate: false,
            range: null
        };

        // Handle modifiers
        let working = dateString.toUpperCase();

        if (working.startsWith('ABT') || working.startsWith('ABOUT')) {
            result.approximate = true;
            working = working.replace(/^ABT\.?\s*|^ABOUT\s*/i, '');
        } else if (working.startsWith('EST')) {
            result.approximate = true;
            working = working.replace(/^EST\.?\s*/i, '');
        } else if (working.startsWith('CAL')) {
            result.approximate = true;
            working = working.replace(/^CAL\.?\s*/i, '');
        } else if (working.startsWith('BEF')) {
            result.range = 'before';
            working = working.replace(/^BEF\.?\s*/i, '');
        } else if (working.startsWith('AFT')) {
            result.range = 'after';
            working = working.replace(/^AFT\.?\s*/i, '');
        } else if (working.startsWith('BET')) {
            result.range = 'between';
            working = working.replace(/^BET\.?\s*/i, '');
        }

        // Month mapping
        const months = {
            'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAY': 5, 'JUN': 6,
            'JUL': 7, 'AUG': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12
        };

        // Try to parse: DD MMM YYYY, MMM YYYY, or YYYY
        const fullMatch = working.match(/(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/);
        const monthYearMatch = working.match(/([A-Z]{3})\s+(\d{4})/);
        const yearMatch = working.match(/(\d{4})/);

        if (fullMatch) {
            result.day = parseInt(fullMatch[1], 10);
            result.month = months[fullMatch[2]] || null;
            result.year = parseInt(fullMatch[3], 10);
        } else if (monthYearMatch) {
            result.month = months[monthYearMatch[1]] || null;
            result.year = parseInt(monthYearMatch[2], 10);
        } else if (yearMatch) {
            result.year = parseInt(yearMatch[1], 10);
        }

        return result;
    }

    /**
     * Build the final family tree structure
     */
    buildFamilyTree() {
        const people = [];
        const familyLinks = [];

        // Process individuals
        this.individuals.forEach((data, id) => {
            const person = {
                id: id,
                name: data.name ? data.name.full : 'Unknown',
                firstName: data.name ? data.name.given : '',
                lastName: data.name ? data.name.surname : '',
                gender: data.gender || 'unknown',
                birth: this.formatEventData(data.birth),
                death: this.formatEventData(data.death),
                burial: this.formatEventData(data.burial),
                baptism: this.formatEventData(data.baptism),
                occupation: data.occupation,
                education: data.education,
                religion: data.religion,
                residences: data.residences || [],
                events: data.events || [],
                notes: this.resolveNotes(data.notes),
                media: this.resolveMedia(data.media),
                sources: this.resolveSources(data.sources),
                familyChild: data.familyChild,
                familySpouse: data.familySpouse || [],
                // These will be populated from family records
                parents: [],
                spouses: [],
                children: []
            };

            people.push(person);
        });

        // Create a lookup map
        const personMap = new Map(people.map(p => [p.id, p]));

        // Process families to establish relationships
        this.families.forEach((famData, famId) => {
            const husband = famData.husband ? personMap.get(famData.husband) : null;
            const wife = famData.wife ? personMap.get(famData.wife) : null;
            const children = (famData.children || []).map(id => personMap.get(id)).filter(Boolean);

            // Link spouses
            if (husband && wife) {
                husband.spouses.push({
                    person: wife.id,
                    marriage: this.formatEventData(famData.marriage),
                    divorce: this.formatEventData(famData.divorce)
                });
                wife.spouses.push({
                    person: husband.id,
                    marriage: this.formatEventData(famData.marriage),
                    divorce: this.formatEventData(famData.divorce)
                });
            }

            // Link parents and children
            children.forEach(child => {
                if (husband) {
                    child.parents.push(husband.id);
                    husband.children.push(child.id);
                }
                if (wife) {
                    child.parents.push(wife.id);
                    wife.children.push(child.id);
                }
            });

            familyLinks.push({
                id: famId,
                husband: famData.husband,
                wife: famData.wife,
                children: famData.children || [],
                marriage: this.formatEventData(famData.marriage),
                divorce: this.formatEventData(famData.divorce)
            });
        });

        return {
            header: this.header,
            people,
            families: familyLinks,
            sources: Array.from(this.sources.values()),
            media: Array.from(this.media.values())
        };
    }

    /**
     * Format event data for output
     */
    formatEventData(event) {
        if (!event) return null;

        return {
            date: event.date ? this.formatDate(event.date) : null,
            dateObject: event.date || null,
            place: event.place || null,
            address: event.address || null,
            cause: event.cause || null,
            age: event.age || null,
            notes: this.resolveNotes(event.notes)
        };
    }

    /**
     * Format a parsed date for display
     */
    formatDate(dateObj) {
        if (!dateObj) return null;
        if (typeof dateObj === 'string') return dateObj;

        const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        let str = '';
        if (dateObj.approximate) str += 'Abt ';
        if (dateObj.range === 'before') str += 'Bef ';
        if (dateObj.range === 'after') str += 'Aft ';
        if (dateObj.range === 'between') str += 'Bet ';

        if (dateObj.day) str += dateObj.day + ' ';
        if (dateObj.month) str += months[dateObj.month] + ' ';
        if (dateObj.year) str += dateObj.year;

        return str.trim() || dateObj.original;
    }

    /**
     * Resolve note references
     */
    resolveNotes(notes) {
        if (!notes) return [];

        return notes.map(note => {
            if (note.ref) {
                const resolved = this.notes.get(note.ref);
                return resolved ? resolved.text : '';
            }
            return note.text || '';
        }).filter(Boolean);
    }

    /**
     * Resolve media references
     */
    resolveMedia(media) {
        if (!media) return [];

        return media.map(m => {
            if (m.ref) {
                const resolved = this.media.get(m.ref);
                return resolved || null;
            }
            return m;
        }).filter(Boolean);
    }

    /**
     * Resolve source references
     */
    resolveSources(sources) {
        if (!sources) return [];

        return sources.map(s => {
            if (s.ref) {
                const resolved = this.sources.get(s.ref);
                return resolved || null;
            }
            return s;
        }).filter(Boolean);
    }
}

// Export for use
window.GedcomParser = GedcomParser;

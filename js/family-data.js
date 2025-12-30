/**
 * Family Data Store
 * Manages family tree data and provides access methods
 */

class FamilyDataStore {
    constructor() {
        this.people = [];
        this.families = [];
        this.sources = [];
        this.media = [];
        this.peopleMap = new Map();
        this.isLoaded = false;
    }

    /**
     * Load data from parsed GEDCOM
     */
    loadFromGedcom(parsedData) {
        this.people = parsedData.people || [];
        this.families = parsedData.families || [];
        this.sources = parsedData.sources || [];
        this.media = parsedData.media || [];
        this.buildIndex();
        this.isLoaded = true;
    }

    /**
     * Clear all data
     */
    clearData() {
        this.people = [];
        this.families = [];
        this.sources = [];
        this.media = [];
        this.peopleMap = new Map();
        this.isLoaded = false;
    }

    /**
     * Build lookup index
     */
    buildIndex() {
        this.peopleMap = new Map(this.people.map(p => [p.id, p]));
    }

    /**
     * Get person by ID
     */
    getPerson(id) {
        return this.peopleMap.get(id);
    }

    /**
     * Get all people
     */
    getAllPeople() {
        return this.people;
    }

    /**
     * Search people by name
     */
    searchPeople(query) {
        const lowerQuery = query.toLowerCase();
        return this.people.filter(person =>
            person.name.toLowerCase().includes(lowerQuery) ||
            (person.firstName && person.firstName.toLowerCase().includes(lowerQuery)) ||
            (person.lastName && person.lastName.toLowerCase().includes(lowerQuery))
        );
    }

    /**
     * Get ancestors of a person
     */
    getAncestors(personId, maxGenerations = 10) {
        const ancestors = [];
        const visited = new Set();

        const traverse = (id, generation) => {
            if (generation > maxGenerations || visited.has(id)) return;
            visited.add(id);

            const person = this.getPerson(id);
            if (!person) return;

            person.parents.forEach(parentId => {
                const parent = this.getPerson(parentId);
                if (parent) {
                    ancestors.push({ ...parent, generation });
                    traverse(parentId, generation + 1);
                }
            });
        };

        traverse(personId, 1);
        return ancestors;
    }

    /**
     * Get descendants of a person
     */
    getDescendants(personId, maxGenerations = 10) {
        const descendants = [];
        const visited = new Set();

        const traverse = (id, generation) => {
            if (generation > maxGenerations || visited.has(id)) return;
            visited.add(id);

            const person = this.getPerson(id);
            if (!person) return;

            person.children.forEach(childId => {
                const child = this.getPerson(childId);
                if (child) {
                    descendants.push({ ...child, generation });
                    traverse(childId, generation + 1);
                }
            });
        };

        traverse(personId, 1);
        return descendants;
    }

    /**
     * Get parents of a person
     */
    getParents(personId) {
        const person = this.getPerson(personId);
        if (!person) return [];
        return person.parents.map(id => this.getPerson(id)).filter(Boolean);
    }

    /**
     * Get children of a person
     */
    getChildren(personId) {
        const person = this.getPerson(personId);
        if (!person) return [];
        return person.children.map(id => this.getPerson(id)).filter(Boolean);
    }

    /**
     * Get siblings of a person
     */
    getSiblings(personId) {
        const person = this.getPerson(personId);
        if (!person) return [];

        const siblingIds = new Set();
        person.parents.forEach(parentId => {
            const parent = this.getPerson(parentId);
            if (parent) {
                parent.children.forEach(childId => {
                    if (childId !== personId) {
                        siblingIds.add(childId);
                    }
                });
            }
        });

        return Array.from(siblingIds).map(id => this.getPerson(id)).filter(Boolean);
    }

    /**
     * Get spouses of a person
     */
    getSpouses(personId) {
        const person = this.getPerson(personId);
        if (!person) return [];
        return person.spouses.map(s => ({
            person: this.getPerson(s.person),
            marriage: s.marriage,
            divorce: s.divorce
        })).filter(s => s.person);
    }

    /**
     * Get timeline events
     */
    getTimelineEvents() {
        const events = [];

        this.people.forEach(person => {
            if (person.birth && person.birth.dateObject && person.birth.dateObject.year) {
                events.push({
                    type: 'birth',
                    person: person,
                    date: person.birth.dateObject,
                    displayDate: person.birth.date,
                    place: person.birth.place,
                    title: `${person.name} was born`,
                    year: person.birth.dateObject.year
                });
            }

            if (person.death && person.death.dateObject && person.death.dateObject.year) {
                events.push({
                    type: 'death',
                    person: person,
                    date: person.death.dateObject,
                    displayDate: person.death.date,
                    place: person.death.place,
                    title: `${person.name} passed away`,
                    year: person.death.dateObject.year
                });
            }

            person.spouses.forEach(spouse => {
                if (spouse.marriage && spouse.marriage.dateObject && spouse.marriage.dateObject.year) {
                    const spousePerson = this.getPerson(spouse.person);
                    if (spousePerson && person.gender === 'male') {
                        events.push({
                            type: 'marriage',
                            person: person,
                            spouse: spousePerson,
                            date: spouse.marriage.dateObject,
                            displayDate: spouse.marriage.date,
                            place: spouse.marriage.place,
                            title: `${person.name} married ${spousePerson.name}`,
                            year: spouse.marriage.dateObject.year
                        });
                    }
                }
            });

            if (person.events) {
                person.events.forEach(event => {
                    if (event.date && event.date.year) {
                        events.push({
                            type: 'event',
                            person: person,
                            date: event.date,
                            displayDate: event.displayDate,
                            place: event.place,
                            title: `${person.name}: ${event.type}`,
                            year: event.date.year
                        });
                    }
                });
            }
        });

        return events.sort((a, b) => a.year - b.year);
    }

    /**
     * Get locations for map
     */
    getLocations() {
        const locations = [];
        const locationMap = new Map();

        this.people.forEach(person => {
            if (person.birth && person.birth.place && person.birth.coordinates) {
                const key = `${person.birth.coordinates.lat},${person.birth.coordinates.lng}`;
                if (!locationMap.has(key)) {
                    locationMap.set(key, {
                        type: 'birth',
                        place: person.birth.place,
                        coordinates: person.birth.coordinates,
                        people: []
                    });
                }
                locationMap.get(key).people.push({
                    person,
                    event: 'birth',
                    date: person.birth.date
                });
            }

            if (person.death && person.death.place && person.death.coordinates) {
                const key = `${person.death.coordinates.lat},${person.death.coordinates.lng}`;
                if (!locationMap.has(key)) {
                    locationMap.set(key, {
                        type: 'death',
                        place: person.death.place,
                        coordinates: person.death.coordinates,
                        people: []
                    });
                }
                locationMap.get(key).people.push({
                    person,
                    event: 'death',
                    date: person.death.date
                });
            }

            if (person.residences) {
                person.residences.forEach(res => {
                    if (res.place && res.coordinates) {
                        const key = `${res.coordinates.lat},${res.coordinates.lng}`;
                        if (!locationMap.has(key)) {
                            locationMap.set(key, {
                                type: 'residence',
                                place: res.place,
                                coordinates: res.coordinates,
                                people: []
                            });
                        }
                        locationMap.get(key).people.push({
                            person,
                            event: 'residence',
                            date: res.date
                        });
                    }
                });
            }
        });

        return Array.from(locationMap.values());
    }

    /**
     * Calculate relationship between two people
     */
    calculateRelationship(person1Id, person2Id) {
        if (person1Id === person2Id) {
            return { relationship: 'Same person', path: [] };
        }

        // BFS to find shortest path
        const queue = [[person1Id, []]];
        const visited = new Set([person1Id]);

        while (queue.length > 0) {
            const [currentId, path] = queue.shift();
            const current = this.getPerson(currentId);
            if (!current) continue;

            // Check all connections
            const connections = [
                ...current.parents.map(id => ({ id, type: 'parent' })),
                ...current.children.map(id => ({ id, type: 'child' })),
                ...current.spouses.map(s => ({ id: s.person, type: 'spouse' }))
            ];

            for (const conn of connections) {
                if (conn.id === person2Id) {
                    const fullPath = [...path, conn];
                    return {
                        relationship: this.describeRelationship(fullPath),
                        path: fullPath
                    };
                }

                if (!visited.has(conn.id)) {
                    visited.add(conn.id);
                    queue.push([conn.id, [...path, conn]]);
                }
            }
        }

        return { relationship: 'No direct relationship found', path: [] };
    }

    /**
     * Describe a relationship path in human-readable terms
     */
    describeRelationship(path) {
        if (path.length === 0) return 'Self';
        if (path.length === 1) {
            const rel = path[0].type;
            if (rel === 'parent') return 'Parent';
            if (rel === 'child') return 'Child';
            if (rel === 'spouse') return 'Spouse';
        }

        // Count parent/child steps
        let parentSteps = 0;
        let childSteps = 0;
        let hasSpouse = false;

        path.forEach(step => {
            if (step.type === 'parent') parentSteps++;
            else if (step.type === 'child') childSteps++;
            else if (step.type === 'spouse') hasSpouse = true;
        });

        // Direct relationships
        if (parentSteps === 1 && childSteps === 0) return hasSpouse ? "Parent's spouse" : 'Parent';
        if (parentSteps === 0 && childSteps === 1) return hasSpouse ? "Spouse's child" : 'Child';
        if (parentSteps === 2 && childSteps === 0) return 'Grandparent';
        if (parentSteps === 0 && childSteps === 2) return 'Grandchild';
        if (parentSteps === 3 && childSteps === 0) return 'Great-grandparent';
        if (parentSteps === 0 && childSteps === 3) return 'Great-grandchild';
        if (parentSteps === 1 && childSteps === 1) return 'Sibling';
        if (parentSteps === 2 && childSteps === 1) return 'Aunt/Uncle';
        if (parentSteps === 1 && childSteps === 2) return 'Niece/Nephew';
        if (parentSteps === 2 && childSteps === 2) return 'First cousin';

        // Calculate cousin relationships
        if (parentSteps > 0 && childSteps > 0) {
            const minGen = Math.min(parentSteps, childSteps);
            const diff = Math.abs(parentSteps - childSteps);

            if (minGen >= 2) {
                const cousinNum = minGen - 1;
                const ordinal = cousinNum === 1 ? '1st' : cousinNum === 2 ? '2nd' : cousinNum === 3 ? '3rd' : `${cousinNum}th`;
                let result = `${ordinal} cousin`;
                if (diff > 0) result += ` ${diff}x removed`;
                return result;
            }
        }

        return `Related (${path.length} steps)`;
    }
}

// Initialize the data store
window.familyDataStore = new FamilyDataStore();

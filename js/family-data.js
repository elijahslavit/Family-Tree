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
     * Load sample data
     */
    loadSampleData() {
        this.people = SAMPLE_FAMILY_DATA.people;
        this.families = SAMPLE_FAMILY_DATA.families;
        this.sources = SAMPLE_FAMILY_DATA.sources || [];
        this.media = SAMPLE_FAMILY_DATA.media || [];
        this.buildIndex();
        this.isLoaded = true;
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

// Sample family data based on Lathrop family structure
const SAMPLE_FAMILY_DATA = {
    people: [
        // Generation 1 - Great-great grandparents
        {
            id: '@I1@',
            name: 'William Lathrop Sr.',
            firstName: 'William',
            lastName: 'Lathrop',
            gender: 'male',
            birth: {
                date: '15 Mar 1890',
                dateObject: { year: 1890, month: 3, day: 15 },
                place: 'Boston, Massachusetts, USA',
                coordinates: { lat: 42.3601, lng: -71.0589 }
            },
            death: {
                date: '22 Nov 1965',
                dateObject: { year: 1965, month: 11, day: 22 },
                place: 'Hartford, Connecticut, USA',
                coordinates: { lat: 41.7658, lng: -72.6734 }
            },
            occupation: 'Factory Foreman',
            parents: [],
            spouses: [{ person: '@I2@', marriage: { date: '12 Jun 1915', dateObject: { year: 1915, month: 6, day: 12 }, place: 'Boston, Massachusetts, USA' }}],
            children: ['@I3@'],
            notes: ['William immigrated with his family as a young child and worked his way up from factory floor to foreman.'],
            media: [],
            photo: null
        },
        {
            id: '@I2@',
            name: 'Margaret O\'Brien Lathrop',
            firstName: 'Margaret',
            lastName: 'O\'Brien',
            gender: 'female',
            birth: {
                date: '8 Sep 1894',
                dateObject: { year: 1894, month: 9, day: 8 },
                place: 'Dublin, Ireland',
                coordinates: { lat: 53.3498, lng: -6.2603 }
            },
            death: {
                date: '3 Apr 1978',
                dateObject: { year: 1978, month: 4, day: 3 },
                place: 'Hartford, Connecticut, USA',
                coordinates: { lat: 41.7658, lng: -72.6734 }
            },
            occupation: 'Homemaker',
            parents: [],
            spouses: [{ person: '@I1@', marriage: { date: '12 Jun 1915', dateObject: { year: 1915, month: 6, day: 12 }, place: 'Boston, Massachusetts, USA' }}],
            children: ['@I3@'],
            notes: ['Margaret came to America at age 16 with dreams of a better life. She was known for her Irish soda bread and storytelling.'],
            media: [],
            photo: null
        },

        // Generation 2 - Great grandparents
        {
            id: '@I3@',
            name: 'William Lathrop Jr.',
            firstName: 'William',
            lastName: 'Lathrop',
            gender: 'male',
            birth: {
                date: '4 Jul 1920',
                dateObject: { year: 1920, month: 7, day: 4 },
                place: 'Hartford, Connecticut, USA',
                coordinates: { lat: 41.7658, lng: -72.6734 }
            },
            death: {
                date: '15 Dec 2005',
                dateObject: { year: 2005, month: 12, day: 15 },
                place: 'Phoenix, Arizona, USA',
                coordinates: { lat: 33.4484, lng: -112.0740 }
            },
            occupation: 'WWII Veteran, Auto Mechanic',
            parents: ['@I1@', '@I2@'],
            spouses: [{ person: '@I4@', marriage: { date: '20 Aug 1946', dateObject: { year: 1946, month: 8, day: 20 }, place: 'San Diego, California, USA' }}],
            children: ['@I5@', '@I6@'],
            notes: ['William served in the Pacific Theater during WWII. He met his wife Dorothy while stationed in San Diego. After the war, he opened his own auto repair shop.'],
            media: [],
            photo: null
        },
        {
            id: '@I4@',
            name: 'Dorothy Mae Chen Lathrop',
            firstName: 'Dorothy Mae',
            lastName: 'Chen',
            gender: 'female',
            birth: {
                date: '12 Feb 1924',
                dateObject: { year: 1924, month: 2, day: 12 },
                place: 'San Francisco, California, USA',
                coordinates: { lat: 37.7749, lng: -122.4194 }
            },
            death: {
                date: '8 Oct 2010',
                dateObject: { year: 2010, month: 10, day: 8 },
                place: 'Phoenix, Arizona, USA',
                coordinates: { lat: 33.4484, lng: -112.0740 }
            },
            occupation: 'Nurse',
            parents: [],
            spouses: [{ person: '@I3@', marriage: { date: '20 Aug 1946', dateObject: { year: 1946, month: 8, day: 20 }, place: 'San Diego, California, USA' }}],
            children: ['@I5@', '@I6@'],
            notes: ['Dorothy was a second-generation Chinese-American. She worked as a Navy nurse during WWII, where she met William. She continued nursing until retirement.'],
            media: [],
            photo: null
        },

        // Generation 3 - Grandparents
        {
            id: '@I5@',
            name: 'Darryl James Lathrop',
            firstName: 'Darryl',
            lastName: 'Lathrop',
            gender: 'male',
            birth: {
                date: '18 May 1950',
                dateObject: { year: 1950, month: 5, day: 18 },
                place: 'Phoenix, Arizona, USA',
                coordinates: { lat: 33.4484, lng: -112.0740 }
            },
            death: null,
            occupation: 'High School Teacher',
            parents: ['@I3@', '@I4@'],
            spouses: [
                { person: '@I7@', marriage: { date: '5 Sep 1972', dateObject: { year: 1972, month: 9, day: 5 }, place: 'Denver, Colorado, USA' }, divorce: { date: '1985', dateObject: { year: 1985 }}},
                { person: '@I8@', marriage: { date: '14 Feb 1988', dateObject: { year: 1988, month: 2, day: 14 }, place: 'Austin, Texas, USA' }}
            ],
            children: ['@I10@', '@I11@', '@I12@'],
            notes: ['Darryl is the central figure connecting three family branches through his daughters Aimee, Gina, and Rosie. He taught history for 35 years and inspired a love of learning in all his children.'],
            media: [],
            photo: null
        },
        {
            id: '@I6@',
            name: 'Susan Marie Lathrop Garcia',
            firstName: 'Susan Marie',
            lastName: 'Lathrop',
            gender: 'female',
            birth: {
                date: '30 Jan 1953',
                dateObject: { year: 1953, month: 1, day: 30 },
                place: 'Phoenix, Arizona, USA',
                coordinates: { lat: 33.4484, lng: -112.0740 }
            },
            death: null,
            occupation: 'Librarian',
            parents: ['@I3@', '@I4@'],
            spouses: [{ person: '@I9@', marriage: { date: '22 Jun 1975', dateObject: { year: 1975, month: 6, day: 22 }, place: 'Phoenix, Arizona, USA' }}],
            children: ['@I13@', '@I14@'],
            notes: ['Susan became the family historian and genealogist, preserving stories and photos for future generations.'],
            media: [],
            photo: null
        },

        // Spouses of Generation 3
        {
            id: '@I7@',
            name: 'Linda Marie Johnson',
            firstName: 'Linda Marie',
            lastName: 'Johnson',
            gender: 'female',
            birth: {
                date: '22 Oct 1951',
                dateObject: { year: 1951, month: 10, day: 22 },
                place: 'Denver, Colorado, USA',
                coordinates: { lat: 39.7392, lng: -104.9903 }
            },
            death: null,
            occupation: 'Real Estate Agent',
            parents: [],
            spouses: [{ person: '@I5@', marriage: { date: '5 Sep 1972', dateObject: { year: 1972, month: 9, day: 5 }, place: 'Denver, Colorado, USA' }, divorce: { date: '1985', dateObject: { year: 1985 }}}],
            children: ['@I10@'],
            notes: ['Linda is mother to Aimee. After her divorce from Darryl, she remained close with her daughter and later became a successful real estate agent.'],
            media: [],
            photo: null
        },
        {
            id: '@I8@',
            name: 'Maria Elena Finelli Lathrop',
            firstName: 'Maria Elena',
            lastName: 'Finelli',
            gender: 'female',
            birth: {
                date: '7 Aug 1958',
                dateObject: { year: 1958, month: 8, day: 7 },
                place: 'Brooklyn, New York, USA',
                coordinates: { lat: 40.6782, lng: -73.9442 }
            },
            death: null,
            occupation: 'Restaurant Owner',
            parents: ['@I15@', '@I16@'],
            spouses: [{ person: '@I5@', marriage: { date: '14 Feb 1988', dateObject: { year: 1988, month: 2, day: 14 }, place: 'Austin, Texas, USA' }}],
            children: ['@I11@', '@I12@'],
            notes: ['Maria is the mother of Gina and Rosie. She brought Italian culinary traditions to the family and runs a beloved neighborhood restaurant.'],
            media: [],
            photo: null
        },
        {
            id: '@I9@',
            name: 'Roberto Garcia',
            firstName: 'Roberto',
            lastName: 'Garcia',
            gender: 'male',
            birth: {
                date: '14 Mar 1950',
                dateObject: { year: 1950, month: 3, day: 14 },
                place: 'Tucson, Arizona, USA',
                coordinates: { lat: 32.2226, lng: -110.9747 }
            },
            death: null,
            occupation: 'Civil Engineer',
            parents: [],
            spouses: [{ person: '@I6@', marriage: { date: '22 Jun 1975', dateObject: { year: 1975, month: 6, day: 22 }, place: 'Phoenix, Arizona, USA' }}],
            children: ['@I13@', '@I14@'],
            notes: ['Roberto is Susan\'s husband. His family has roots in Arizona going back to the 1800s.'],
            media: [],
            photo: null
        },

        // Generation 4 - The Three Daughters (Central Figures) and Cousins
        {
            id: '@I10@',
            name: 'Aimee Lynn Slavit',
            firstName: 'Aimee',
            lastName: 'Slavit',
            gender: 'female',
            birth: {
                date: '3 Mar 1975',
                dateObject: { year: 1975, month: 3, day: 3 },
                place: 'Denver, Colorado, USA',
                coordinates: { lat: 39.7392, lng: -104.9903 }
            },
            death: null,
            occupation: 'Software Engineer',
            parents: ['@I5@', '@I7@'],
            spouses: [{ person: '@I17@', marriage: { date: '15 Jul 2000', dateObject: { year: 2000, month: 7, day: 15 }, place: 'Seattle, Washington, USA' }}],
            children: ['@I20@', '@I21@'],
            notes: ['Aimee is the eldest daughter of Darryl Lathrop. She followed her passion for technology and moved to Seattle where she works for a major tech company. She is devoted to preserving family history.'],
            media: [],
            photo: null
        },
        {
            id: '@I11@',
            name: 'Gina Rose McFadden',
            firstName: 'Gina',
            lastName: 'McFadden',
            gender: 'female',
            birth: {
                date: '28 Nov 1989',
                dateObject: { year: 1989, month: 11, day: 28 },
                place: 'Austin, Texas, USA',
                coordinates: { lat: 30.2672, lng: -97.7431 }
            },
            death: null,
            occupation: 'Veterinarian',
            parents: ['@I5@', '@I8@'],
            spouses: [{ person: '@I18@', marriage: { date: '10 Oct 2015', dateObject: { year: 2015, month: 10, day: 10 }, place: 'Austin, Texas, USA' }}],
            children: ['@I22@'],
            notes: ['Gina is the second daughter, from Darryl\'s marriage to Maria. She inherited her mother\'s warmth and her father\'s love of learning. She runs a veterinary clinic in Austin.'],
            media: [],
            photo: null
        },
        {
            id: '@I12@',
            name: 'Rosie Marie Finelli',
            firstName: 'Rosie',
            lastName: 'Finelli',
            gender: 'female',
            birth: {
                date: '14 Feb 1992',
                dateObject: { year: 1992, month: 2, day: 14 },
                place: 'Austin, Texas, USA',
                coordinates: { lat: 30.2672, lng: -97.7431 }
            },
            death: null,
            occupation: 'Chef',
            parents: ['@I5@', '@I8@'],
            spouses: [],
            children: [],
            notes: ['Rosie is the youngest of Darryl\'s three daughters. Born on Valentine\'s Day, she took her mother\'s maiden name to honor the Finelli family tradition. She trained as a chef in Italy and now works at her mother\'s restaurant.'],
            media: [],
            photo: null
        },
        {
            id: '@I13@',
            name: 'Michael Anthony Garcia',
            firstName: 'Michael',
            lastName: 'Garcia',
            gender: 'male',
            birth: {
                date: '8 Jun 1978',
                dateObject: { year: 1978, month: 6, day: 8 },
                place: 'Phoenix, Arizona, USA',
                coordinates: { lat: 33.4484, lng: -112.0740 }
            },
            death: null,
            occupation: 'Architect',
            parents: ['@I9@', '@I6@'],
            spouses: [{ person: '@I23@', marriage: { date: '20 May 2005', dateObject: { year: 2005, month: 5, day: 20 }, place: 'Phoenix, Arizona, USA' }}],
            children: ['@I24@', '@I25@'],
            notes: ['Michael is Susan and Roberto\'s son, making him a first cousin to Aimee, Gina, and Rosie.'],
            media: [],
            photo: null
        },
        {
            id: '@I14@',
            name: 'Elena Christina Garcia',
            firstName: 'Elena',
            lastName: 'Garcia',
            gender: 'female',
            birth: {
                date: '19 Dec 1980',
                dateObject: { year: 1980, month: 12, day: 19 },
                place: 'Phoenix, Arizona, USA',
                coordinates: { lat: 33.4484, lng: -112.0740 }
            },
            death: null,
            occupation: 'Doctor',
            parents: ['@I9@', '@I6@'],
            spouses: [],
            children: [],
            notes: ['Elena is a pediatrician and the younger child of Susan and Roberto. She is close with all three of her cousins.'],
            media: [],
            photo: null
        },

        // Finelli Grandparents
        {
            id: '@I15@',
            name: 'Giuseppe Finelli',
            firstName: 'Giuseppe',
            lastName: 'Finelli',
            gender: 'male',
            birth: {
                date: '3 May 1925',
                dateObject: { year: 1925, month: 5, day: 3 },
                place: 'Naples, Italy',
                coordinates: { lat: 40.8518, lng: 14.2681 }
            },
            death: {
                date: '12 Jan 2008',
                dateObject: { year: 2008, month: 1, day: 12 },
                place: 'Brooklyn, New York, USA',
                coordinates: { lat: 40.6782, lng: -73.9442 }
            },
            occupation: 'Baker',
            parents: [],
            spouses: [{ person: '@I16@', marriage: { date: '18 Apr 1950', dateObject: { year: 1950, month: 4, day: 18 }, place: 'Naples, Italy' }}],
            children: ['@I8@'],
            notes: ['Giuseppe immigrated to America in 1952 and opened a beloved bakery in Brooklyn. His recipes have been passed down through the family.'],
            media: [],
            photo: null
        },
        {
            id: '@I16@',
            name: 'Rosa Caruso Finelli',
            firstName: 'Rosa',
            lastName: 'Caruso',
            gender: 'female',
            birth: {
                date: '22 Sep 1928',
                dateObject: { year: 1928, month: 9, day: 22 },
                place: 'Naples, Italy',
                coordinates: { lat: 40.8518, lng: 14.2681 }
            },
            death: {
                date: '5 Mar 2015',
                dateObject: { year: 2015, month: 3, day: 5 },
                place: 'Brooklyn, New York, USA',
                coordinates: { lat: 40.6782, lng: -73.9442 }
            },
            occupation: 'Homemaker, Seamstress',
            parents: [],
            spouses: [{ person: '@I15@', marriage: { date: '18 Apr 1950', dateObject: { year: 1950, month: 4, day: 18 }, place: 'Naples, Italy' }}],
            children: ['@I8@'],
            notes: ['Rosa was known for her beautiful embroidery and her Sunday dinners that brought the whole family together.'],
            media: [],
            photo: null
        },

        // Spouses of Generation 4
        {
            id: '@I17@',
            name: 'David Michael Slavit',
            firstName: 'David',
            lastName: 'Slavit',
            gender: 'male',
            birth: {
                date: '11 Jan 1973',
                dateObject: { year: 1973, month: 1, day: 11 },
                place: 'Chicago, Illinois, USA',
                coordinates: { lat: 41.8781, lng: -87.6298 }
            },
            death: null,
            occupation: 'Professor',
            parents: [],
            spouses: [{ person: '@I10@', marriage: { date: '15 Jul 2000', dateObject: { year: 2000, month: 7, day: 15 }, place: 'Seattle, Washington, USA' }}],
            children: ['@I20@', '@I21@'],
            notes: ['David is a university professor and Aimee\'s husband.'],
            media: [],
            photo: null
        },
        {
            id: '@I18@',
            name: 'Patrick Sean McFadden',
            firstName: 'Patrick',
            lastName: 'McFadden',
            gender: 'male',
            birth: {
                date: '17 Mar 1987',
                dateObject: { year: 1987, month: 3, day: 17 },
                place: 'Dublin, Ireland',
                coordinates: { lat: 53.3498, lng: -6.2603 }
            },
            death: null,
            occupation: 'Music Teacher',
            parents: [],
            spouses: [{ person: '@I11@', marriage: { date: '10 Oct 2015', dateObject: { year: 2015, month: 10, day: 10 }, place: 'Austin, Texas, USA' }}],
            children: ['@I22@'],
            notes: ['Patrick moved to Texas from Ireland for graduate school and met Gina at a local music venue.'],
            media: [],
            photo: null
        },

        // Generation 5 - Grandchildren
        {
            id: '@I20@',
            name: 'Emma Rose Slavit',
            firstName: 'Emma',
            lastName: 'Slavit',
            gender: 'female',
            birth: {
                date: '4 Apr 2003',
                dateObject: { year: 2003, month: 4, day: 4 },
                place: 'Seattle, Washington, USA',
                coordinates: { lat: 47.6062, lng: -122.3321 }
            },
            death: null,
            occupation: 'Student',
            parents: ['@I17@', '@I10@'],
            spouses: [],
            children: [],
            notes: ['Emma is studying environmental science and wants to make a difference in the world.'],
            media: [],
            photo: null
        },
        {
            id: '@I21@',
            name: 'James Darryl Slavit',
            firstName: 'James',
            lastName: 'Slavit',
            gender: 'male',
            birth: {
                date: '19 Aug 2006',
                dateObject: { year: 2006, month: 8, day: 19 },
                place: 'Seattle, Washington, USA',
                coordinates: { lat: 47.6062, lng: -122.3321 }
            },
            death: null,
            occupation: 'Student',
            parents: ['@I17@', '@I10@'],
            spouses: [],
            children: [],
            notes: ['James, named after his great-grandfather, loves history just like his grandfather Darryl.'],
            media: [],
            photo: null
        },
        {
            id: '@I22@',
            name: 'Liam Patrick McFadden',
            firstName: 'Liam',
            lastName: 'McFadden',
            gender: 'male',
            birth: {
                date: '1 Dec 2018',
                dateObject: { year: 2018, month: 12, day: 1 },
                place: 'Austin, Texas, USA',
                coordinates: { lat: 30.2672, lng: -97.7431 }
            },
            death: null,
            occupation: null,
            parents: ['@I18@', '@I11@'],
            spouses: [],
            children: [],
            notes: ['Liam is the youngest member of the family, bringing joy to everyone he meets.'],
            media: [],
            photo: null
        },

        // More spouses and relatives
        {
            id: '@I23@',
            name: 'Jennifer Walsh Garcia',
            firstName: 'Jennifer',
            lastName: 'Walsh',
            gender: 'female',
            birth: {
                date: '15 Nov 1980',
                dateObject: { year: 1980, month: 11, day: 15 },
                place: 'Scottsdale, Arizona, USA',
                coordinates: { lat: 33.4942, lng: -111.9261 }
            },
            death: null,
            occupation: 'Attorney',
            parents: [],
            spouses: [{ person: '@I13@', marriage: { date: '20 May 2005', dateObject: { year: 2005, month: 5, day: 20 }, place: 'Phoenix, Arizona, USA' }}],
            children: ['@I24@', '@I25@'],
            notes: [],
            media: [],
            photo: null
        },
        {
            id: '@I24@',
            name: 'Sofia Marie Garcia',
            firstName: 'Sofia',
            lastName: 'Garcia',
            gender: 'female',
            birth: {
                date: '8 Feb 2008',
                dateObject: { year: 2008, month: 2, day: 8 },
                place: 'Phoenix, Arizona, USA',
                coordinates: { lat: 33.4484, lng: -112.0740 }
            },
            death: null,
            occupation: 'Student',
            parents: ['@I13@', '@I23@'],
            spouses: [],
            children: [],
            notes: [],
            media: [],
            photo: null
        },
        {
            id: '@I25@',
            name: 'Lucas Roberto Garcia',
            firstName: 'Lucas',
            lastName: 'Garcia',
            gender: 'male',
            birth: {
                date: '22 Jul 2011',
                dateObject: { year: 2011, month: 7, day: 22 },
                place: 'Phoenix, Arizona, USA',
                coordinates: { lat: 33.4484, lng: -112.0740 }
            },
            death: null,
            occupation: 'Student',
            parents: ['@I13@', '@I23@'],
            spouses: [],
            children: [],
            notes: [],
            media: [],
            photo: null
        }
    ],

    families: [
        { id: '@F1@', husband: '@I1@', wife: '@I2@', children: ['@I3@'] },
        { id: '@F2@', husband: '@I3@', wife: '@I4@', children: ['@I5@', '@I6@'] },
        { id: '@F3@', husband: '@I5@', wife: '@I7@', children: ['@I10@'] },
        { id: '@F4@', husband: '@I5@', wife: '@I8@', children: ['@I11@', '@I12@'] },
        { id: '@F5@', husband: '@I9@', wife: '@I6@', children: ['@I13@', '@I14@'] },
        { id: '@F6@', husband: '@I15@', wife: '@I16@', children: ['@I8@'] },
        { id: '@F7@', husband: '@I17@', wife: '@I10@', children: ['@I20@', '@I21@'] },
        { id: '@F8@', husband: '@I18@', wife: '@I11@', children: ['@I22@'] },
        { id: '@F9@', husband: '@I13@', wife: '@I23@', children: ['@I24@', '@I25@'] }
    ],

    stories: [
        {
            id: 'story1',
            title: 'The Journey from Ireland',
            type: 'history',
            personId: '@I2@',
            content: `Margaret O'Brien arrived in Boston Harbor in 1910, just sixteen years old, with nothing but a small trunk and dreams of a better life. The crossing had been rough, and many passengers fell ill, but Margaret's spirit remained unbroken.

She found work as a domestic servant for a wealthy family in Beacon Hill, sending money home to Ireland whenever she could. It was at a church social in 1914 that she met William Lathrop, a young man with kind eyes and steady hands.

Their courtship was brief but genuine. William proposed with a ring he'd saved three months' wages to buy. They married in June 1915, beginning a family line that would spread across America.`,
            relatedPeople: ['@I2@', '@I1@']
        },
        {
            id: 'story2',
            title: 'Love in Wartime',
            type: 'memory',
            personId: '@I3@',
            content: `William Jr. enlisted the day after Pearl Harbor. He was shipped to San Diego for training, far from anything he'd ever known. The Navy base was overwhelming, but the letters from home kept him grounded.

It was in the base hospital that he first saw Dorothy Chen, a young nurse with a determined stride and a gentle smile. She was second-generation Chinese-American, and some people didn't approve. William didn't care.

"She was the bravest person I ever met," he would later tell his grandchildren. "She saved lives every day while bombs fell. How could I not fall in love with her?"

They married in August 1946, just weeks after his discharge. Their wedding photo shows two people who had seen the worst of humanity and still believed in its best.`,
            relatedPeople: ['@I3@', '@I4@']
        },
        {
            id: 'story3',
            title: 'Three Daughters, Three Paths',
            type: 'biography',
            personId: '@I5@',
            content: `Darryl Lathrop never expected to be a father three times over with three different stories. His first marriage to Linda gave him Aimee, a bright-eyed girl who inherited his curiosity and her mother's determination. When that marriage ended, he worried about what kind of father he could be.

Then Maria came into his life like a warm wind. Her Italian family embraced him, fed him, and slowly healed his broken heart. Gina was born in 1989, followed by Rosie on Valentine's Day 1992.

"My three girls are like three different flowers from the same garden," Darryl often says. "Aimee is a sunflower—tall, bright, reaching for the sky. Gina is a rose—beautiful but strong, with thorns when needed. And Rosie is lavender—bringing peace and sweetness wherever she goes."

All three daughters grew up knowing they were loved, even when their parents' paths diverged.`,
            relatedPeople: ['@I5@', '@I10@', '@I11@', '@I12@']
        },
        {
            id: 'story4',
            title: 'Nonna Rosa\'s Sunday Dinners',
            type: 'tradition',
            personId: '@I16@',
            content: `Every Sunday, without fail, Rosa Finelli would begin cooking at dawn. The sauce would simmer for hours, filling the Brooklyn apartment with aromas that drew neighbors to knock on the door.

"There's always room for one more," Rosa would say, setting another place at the already crowded table.

Her granddaughters Gina and Rosie learned to make pasta at her elbow, their small hands covered in flour. She taught them that cooking was love made visible, that feeding people was the highest form of care.

When Rosa passed in 2015, the family gathered one last time around her table. They made her sauce from the handwritten recipe she'd brought from Naples, and they told stories until the candles burned low.

Rosie now carries on this tradition, preparing Sunday dinner at her mother Maria's restaurant, keeping Nonna Rosa's memory alive one meal at a time.`,
            relatedPeople: ['@I16@', '@I11@', '@I12@', '@I8@']
        },
        {
            id: 'story5',
            title: 'The Family Historian',
            type: 'biography',
            personId: '@I6@',
            content: `Susan Marie Lathrop Garcia spent her career surrounded by books, but it was her family's unwritten stories that captured her heart.

It started when she found a box of old photographs in her parents' attic—faded images of people no one could name. She made it her mission to identify every face, to write down every story before they were lost to time.

She interviewed her parents, her aunts and uncles, even distant cousins she tracked down through genealogy records. She preserved letters, documents, and recipes. She digitized photos and created family trees that stretched back generations.

"We are not just individuals," Susan tells her nieces. "We are links in a chain that stretches back through time. It's our job to know where we came from so we can understand who we are."

This very family tree project exists because of Susan's dedication to preserving the family legacy.`,
            relatedPeople: ['@I6@', '@I10@', '@I11@', '@I12@']
        }
    ],

    photos: [
        {
            id: 'photo1',
            title: 'William and Margaret\'s Wedding',
            date: '12 Jun 1915',
            dateObject: { year: 1915, month: 6, day: 12 },
            description: 'Wedding day at St. Patrick\'s Church, Boston',
            people: ['@I1@', '@I2@'],
            category: 'events',
            placeholder: '👰🤵'
        },
        {
            id: 'photo2',
            title: 'William Jr. in Uniform',
            date: '1943',
            dateObject: { year: 1943 },
            description: 'Navy portrait, San Diego',
            people: ['@I3@'],
            category: 'portraits',
            placeholder: '🎖️'
        },
        {
            id: 'photo3',
            title: 'The Three Sisters',
            date: '2020',
            dateObject: { year: 2020 },
            description: 'Aimee, Gina, and Rosie at a family reunion',
            people: ['@I10@', '@I11@', '@I12@'],
            category: 'families',
            placeholder: '👩‍👩‍👧'
        },
        {
            id: 'photo4',
            title: 'Darryl\'s 70th Birthday',
            date: '18 May 2020',
            dateObject: { year: 2020, month: 5, day: 18 },
            description: 'Surrounded by family at Maria\'s restaurant',
            people: ['@I5@', '@I10@', '@I11@', '@I12@', '@I8@'],
            category: 'events',
            placeholder: '🎂'
        },
        {
            id: 'photo5',
            title: 'Nonna Rosa in Her Kitchen',
            date: '1985',
            dateObject: { year: 1985 },
            description: 'Making Sunday sauce in Brooklyn',
            people: ['@I16@'],
            category: 'portraits',
            placeholder: '👵🍝'
        },
        {
            id: 'photo6',
            title: 'Four Generations',
            date: '2019',
            dateObject: { year: 2019 },
            description: 'Dorothy with Susan, Michael, and Sofia',
            people: ['@I4@', '@I6@', '@I13@', '@I24@'],
            category: 'families',
            placeholder: '👨‍👩‍👧‍👦'
        },
        {
            id: 'photo7',
            title: 'Giuseppe\'s Bakery Grand Opening',
            date: '1955',
            dateObject: { year: 1955 },
            description: 'Opening day of Finelli\'s Bakery, Brooklyn',
            people: ['@I15@', '@I16@'],
            category: 'events',
            placeholder: '🥖'
        },
        {
            id: 'photo8',
            title: 'Gina and Patrick\'s Wedding',
            date: '10 Oct 2015',
            dateObject: { year: 2015, month: 10, day: 10 },
            description: 'Beautiful autumn wedding in Austin',
            people: ['@I11@', '@I18@'],
            category: 'events',
            placeholder: '💒'
        }
    ]
};

// Initialize the data store
window.familyDataStore = new FamilyDataStore();

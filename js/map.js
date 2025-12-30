/**
 * Migration Map View
 * Interactive map showing family locations and migration patterns
 */

class MapView {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.map = null;
        this.markers = [];
        this.migrationLines = [];
        this.filters = {
            birthplaces: true,
            migrations: true,
            residences: true
        };

        this.markerColors = {
            birth: '#68A868',
            death: '#8B6F6F',
            residence: '#6B8E9F'
        };
    }

    init() {
        if (!this.container || this.map) return;

        // Initialize Leaflet map
        this.map = L.map(this.containerId, {
            center: [39.8283, -98.5795], // Center of US
            zoom: 4,
            scrollWheelZoom: true
        });

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(this.map);

        this.setupFilters();
        this.render();
    }

    setupFilters() {
        document.getElementById('show-birthplaces')?.addEventListener('change', (e) => {
            this.filters.birthplaces = e.target.checked;
            this.render();
        });

        document.getElementById('show-migrations')?.addEventListener('change', (e) => {
            this.filters.migrations = e.target.checked;
            this.render();
        });

        document.getElementById('show-residences')?.addEventListener('change', (e) => {
            this.filters.residences = e.target.checked;
            this.render();
        });
    }

    render() {
        if (!this.map) return;

        // Clear existing markers and lines
        this.clearMarkers();

        const people = window.familyDataStore.getAllPeople();
        const locationGroups = new Map();

        // Collect all locations
        people.forEach(person => {
            if (this.filters.birthplaces && person.birth?.coordinates) {
                this.addToLocationGroup(locationGroups, person.birth.coordinates, {
                    type: 'birth',
                    person: person,
                    place: person.birth.place,
                    date: person.birth.date
                });
            }

            if (person.death?.coordinates) {
                this.addToLocationGroup(locationGroups, person.death.coordinates, {
                    type: 'death',
                    person: person,
                    place: person.death.place,
                    date: person.death.date
                });
            }

            if (this.filters.residences && person.residences) {
                person.residences.forEach(res => {
                    if (res.coordinates) {
                        this.addToLocationGroup(locationGroups, res.coordinates, {
                            type: 'residence',
                            person: person,
                            place: res.place,
                            date: res.date
                        });
                    }
                });
            }
        });

        // Create markers for each location group
        locationGroups.forEach((events, key) => {
            const [lat, lng] = key.split(',').map(Number);
            this.createMarker(lat, lng, events);
        });

        // Draw migration lines
        if (this.filters.migrations) {
            this.drawMigrationLines(people);
        }

        // Fit bounds to show all markers
        if (this.markers.length > 0) {
            const group = L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    addToLocationGroup(groups, coords, event) {
        const key = `${coords.lat},${coords.lng}`;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(event);
    }

    createMarker(lat, lng, events) {
        // Determine primary type for marker color
        const types = events.map(e => e.type);
        let primaryType = 'birth';
        if (types.includes('death')) primaryType = 'death';
        else if (types.includes('residence') && !types.includes('birth')) primaryType = 'residence';

        // Create custom icon
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div class="map-marker ${primaryType}" style="border-color: ${this.markerColors[primaryType]}">
                     ${this.getMarkerEmoji(primaryType)}
                   </div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        const marker = L.marker([lat, lng], { icon }).addTo(this.map);

        // Create popup content
        const popupContent = this.createPopupContent(events);
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'map-popup'
        });

        this.markers.push(marker);
    }

    getMarkerEmoji(type) {
        switch (type) {
            case 'birth': return '👶';
            case 'death': return '🕯️';
            case 'residence': return '🏠';
            default: return '📍';
        }
    }

    createPopupContent(events) {
        const place = events[0].place || 'Unknown location';

        let html = `<div class="map-popup">
            <h4>📍 ${place}</h4>
            <div class="person-list">`;

        // Group by type
        const births = events.filter(e => e.type === 'birth');
        const deaths = events.filter(e => e.type === 'death');
        const residences = events.filter(e => e.type === 'residence');

        if (births.length > 0) {
            html += '<div class="event-group"><strong>👶 Born here:</strong><ul>';
            births.forEach(e => {
                html += `<li class="popup-person" data-person-id="${e.person.id}">
                    ${e.person.name} ${e.date ? `(${e.date})` : ''}
                </li>`;
            });
            html += '</ul></div>';
        }

        if (deaths.length > 0) {
            html += '<div class="event-group"><strong>🕯️ Passed away here:</strong><ul>';
            deaths.forEach(e => {
                html += `<li class="popup-person" data-person-id="${e.person.id}">
                    ${e.person.name} ${e.date ? `(${e.date})` : ''}
                </li>`;
            });
            html += '</ul></div>';
        }

        if (residences.length > 0) {
            html += '<div class="event-group"><strong>🏠 Lived here:</strong><ul>';
            residences.forEach(e => {
                html += `<li class="popup-person" data-person-id="${e.person.id}">
                    ${e.person.name} ${e.date ? `(${e.date})` : ''}
                </li>`;
            });
            html += '</ul></div>';
        }

        html += '</div></div>';

        // Create a container and add click handlers
        const container = document.createElement('div');
        container.innerHTML = html;

        container.querySelectorAll('.popup-person').forEach(el => {
            el.style.cursor = 'pointer';
            el.addEventListener('click', () => {
                const personId = el.dataset.personId;
                const person = window.familyDataStore.getPerson(personId);
                if (person) {
                    const event = new CustomEvent('personSelected', { detail: person });
                    document.dispatchEvent(event);
                }
            });
        });

        return container;
    }

    drawMigrationLines(people) {
        people.forEach(person => {
            const locations = [];

            // Birth location
            if (person.birth?.coordinates) {
                locations.push({
                    coords: person.birth.coordinates,
                    year: person.birth.dateObject?.year || 0
                });
            }

            // Residence locations (sorted by date if available)
            if (person.residences) {
                person.residences.forEach(res => {
                    if (res.coordinates) {
                        locations.push({
                            coords: res.coordinates,
                            year: res.dateObject?.year || 0
                        });
                    }
                });
            }

            // Death location
            if (person.death?.coordinates) {
                locations.push({
                    coords: person.death.coordinates,
                    year: person.death.dateObject?.year || 9999
                });
            }

            // Sort by year and draw lines
            locations.sort((a, b) => a.year - b.year);

            for (let i = 0; i < locations.length - 1; i++) {
                const from = locations[i];
                const to = locations[i + 1];

                // Skip if same location
                if (from.coords.lat === to.coords.lat && from.coords.lng === to.coords.lng) {
                    continue;
                }

                const line = L.polyline(
                    [[from.coords.lat, from.coords.lng], [to.coords.lat, to.coords.lng]],
                    {
                        color: '#5B8C5A',
                        weight: 2,
                        opacity: 0.6,
                        dashArray: '5, 10'
                    }
                ).addTo(this.map);

                line.bindTooltip(`${person.name}: Migration path`, {
                    sticky: true
                });

                this.migrationLines.push(line);
            }
        });
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];

        this.migrationLines.forEach(line => {
            this.map.removeLayer(line);
        });
        this.migrationLines = [];
    }

    refresh() {
        if (this.map) {
            this.map.invalidateSize();
            this.render();
        }
    }
}

// Export for use
window.MapView = MapView;

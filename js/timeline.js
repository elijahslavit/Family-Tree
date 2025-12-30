/**
 * Timeline View
 * Displays family events chronologically
 */

class TimelineView {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.filters = {
            births: true,
            deaths: true,
            marriages: true,
            events: true
        };

        this.init();
    }

    init() {
        this.setupFilters();
    }

    setupFilters() {
        document.getElementById('show-births')?.addEventListener('change', (e) => {
            this.filters.births = e.target.checked;
            this.render();
        });

        document.getElementById('show-deaths')?.addEventListener('change', (e) => {
            this.filters.deaths = e.target.checked;
            this.render();
        });

        document.getElementById('show-marriages')?.addEventListener('change', (e) => {
            this.filters.marriages = e.target.checked;
            this.render();
        });

        document.getElementById('show-events')?.addEventListener('change', (e) => {
            this.filters.events = e.target.checked;
            this.render();
        });
    }

    render() {
        if (!this.container) return;

        const events = window.familyDataStore.getTimelineEvents();
        const filteredEvents = this.filterEvents(events);
        const groupedEvents = this.groupByYear(filteredEvents);

        this.container.innerHTML = '';

        if (Object.keys(groupedEvents).length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📅</div>
                    <h3>No events to display</h3>
                    <p>Adjust your filters or add more data to see timeline events.</p>
                </div>
            `;
            return;
        }

        const timeline = document.createElement('div');
        timeline.className = 'timeline';

        // Sort years in descending order (most recent first)
        const sortedYears = Object.keys(groupedEvents).sort((a, b) => b - a);

        sortedYears.forEach(year => {
            const yearSection = document.createElement('div');
            yearSection.className = 'timeline-year';

            const yearLabel = document.createElement('div');
            yearLabel.className = 'timeline-year-label';
            yearLabel.textContent = year;
            yearSection.appendChild(yearLabel);

            // Sort events within year by date
            const yearEvents = groupedEvents[year].sort((a, b) => {
                const aMonth = a.date?.month || 0;
                const bMonth = b.date?.month || 0;
                const aDay = a.date?.day || 0;
                const bDay = b.date?.day || 0;
                return (bMonth * 31 + bDay) - (aMonth * 31 + aDay);
            });

            yearEvents.forEach(event => {
                const eventEl = this.createEventElement(event);
                yearSection.appendChild(eventEl);
            });

            timeline.appendChild(yearSection);
        });

        this.container.appendChild(timeline);
    }

    filterEvents(events) {
        return events.filter(event => {
            switch (event.type) {
                case 'birth': return this.filters.births;
                case 'death': return this.filters.deaths;
                case 'marriage': return this.filters.marriages;
                case 'event': return this.filters.events;
                default: return true;
            }
        });
    }

    groupByYear(events) {
        const grouped = {};
        events.forEach(event => {
            const year = event.year;
            if (!grouped[year]) {
                grouped[year] = [];
            }
            grouped[year].push(event);
        });
        return grouped;
    }

    createEventElement(event) {
        const el = document.createElement('div');
        el.className = `timeline-event ${event.type}`;
        el.dataset.personId = event.person?.id;

        const icon = this.getEventIcon(event.type);
        const description = this.getEventDescription(event);

        el.innerHTML = `
            <div class="timeline-event-header">
                <span class="timeline-event-type">${icon}</span>
                <span class="timeline-event-title">${event.title}</span>
                <span class="timeline-event-date">${event.displayDate || ''}</span>
            </div>
            ${description ? `<div class="timeline-event-description">${description}</div>` : ''}
            ${event.place ? `<div class="timeline-event-location">📍 ${event.place}</div>` : ''}
        `;

        el.addEventListener('click', () => {
            if (event.person) {
                const customEvent = new CustomEvent('personSelected', { detail: event.person });
                document.dispatchEvent(customEvent);
            }
        });

        return el;
    }

    getEventIcon(type) {
        switch (type) {
            case 'birth': return '👶';
            case 'death': return '🕯️';
            case 'marriage': return '💒';
            case 'event': return '📌';
            default: return '📅';
        }
    }

    getEventDescription(event) {
        switch (event.type) {
            case 'birth':
                const age = this.calculateAge(event.person);
                return age ? `Would be ${age} years old today` : '';
            case 'death':
                const lifespan = this.calculateLifespan(event.person);
                return lifespan ? `Lived ${lifespan} years` : '';
            case 'marriage':
                return event.spouse ? `Married to ${event.spouse.name}` : '';
            default:
                return '';
        }
    }

    calculateAge(person) {
        if (!person.birth?.dateObject?.year) return null;
        if (person.death?.dateObject?.year) return null; // Don't show for deceased
        const currentYear = new Date().getFullYear();
        return currentYear - person.birth.dateObject.year;
    }

    calculateLifespan(person) {
        if (!person.birth?.dateObject?.year || !person.death?.dateObject?.year) return null;
        return person.death.dateObject.year - person.birth.dateObject.year;
    }
}

// Export for use
window.TimelineView = TimelineView;

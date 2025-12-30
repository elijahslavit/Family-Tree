/**
 * Family Tree Explorer - Main Application
 * Ties all components together
 */

class FamilyTreeApp {
    constructor() {
        this.treeViz = null;
        this.timelineView = null;
        this.mapView = null;
        this.galleryView = null;
        this.storiesView = null;
        this.currentView = 'tree';
        this.currentPerson = null;

        // Central figures from the Lathrop family
        this.centralFigures = ['@I10@', '@I11@', '@I12@']; // Aimee, Gina, Rosie
        this.defaultPerson = '@I5@'; // Darryl Lathrop (their father)
    }

    async init() {
        // Show loading screen
        this.updateLoadingProgress(10);

        // Initialize data store with sample data
        await this.loadData();
        this.updateLoadingProgress(40);

        // Initialize components
        this.initComponents();
        this.updateLoadingProgress(70);

        // Setup event handlers
        this.setupEventHandlers();
        this.updateLoadingProgress(90);

        // Initial render
        this.renderCurrentView();
        this.updateLoadingProgress(100);

        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
        }, 500);
    }

    updateLoadingProgress(percent) {
        const progress = document.querySelector('.loading-progress');
        if (progress) {
            progress.style.width = `${percent}%`;
        }
    }

    async loadData() {
        // Load sample data
        window.familyDataStore.loadSampleData();

        // Set default person
        this.currentPerson = this.defaultPerson;
    }

    initComponents() {
        // Initialize tree visualization
        this.treeViz = new TreeVisualization('tree-container');

        // Initialize other views
        this.timelineView = new TimelineView('timeline-container');
        this.mapView = new MapView('map-container');
        this.galleryView = new GalleryView('gallery-container');
        this.storiesView = new StoriesView('stories-container');
    }

    setupEventHandlers() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Search
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    this.showSearchResults(query);
                } else {
                    searchResults?.classList.remove('active');
                }
            });

            searchInput.addEventListener('focus', () => {
                if (searchInput.value.trim().length >= 2) {
                    searchResults?.classList.add('active');
                }
            });

            // Close search results when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-container')) {
                    searchResults?.classList.remove('active');
                }
            });
        }

        // Upload button
        document.getElementById('upload-btn')?.addEventListener('click', () => {
            this.showUploadModal();
        });

        // Person selected event (from any component)
        document.addEventListener('personSelected', (e) => {
            this.showPersonModal(e.detail);
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal')?.classList.remove('active');
            });
        });

        // Close modals on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Person modal tabs
        document.querySelectorAll('.person-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchPersonTab(tab);
            });
        });

        // File upload handling
        this.setupFileUpload();
    }

    switchView(view) {
        this.currentView = view;

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Update view visibility
        document.querySelectorAll('.view').forEach(v => {
            v.classList.toggle('active', v.id === `${view}-view`);
        });

        // Render the view
        this.renderCurrentView();
    }

    renderCurrentView() {
        switch (this.currentView) {
            case 'tree':
                this.treeViz?.render(this.currentPerson);
                break;
            case 'timeline':
                this.timelineView?.render();
                break;
            case 'map':
                // Initialize map if not already done
                if (!this.mapView.map) {
                    setTimeout(() => {
                        this.mapView.init();
                    }, 100);
                } else {
                    this.mapView.refresh();
                }
                break;
            case 'gallery':
                this.galleryView?.render();
                break;
            case 'stories':
                this.storiesView?.render();
                break;
        }
    }

    showSearchResults(query) {
        const results = window.familyDataStore.searchPeople(query);
        const container = document.getElementById('search-results');

        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = '<div class="search-result-item"><div class="info">No results found</div></div>';
        } else {
            container.innerHTML = results.slice(0, 10).map(person => `
                <div class="search-result-item" data-person-id="${person.id}">
                    <div class="thumb">${person.gender === 'male' ? '👨' : person.gender === 'female' ? '👩' : '👤'}</div>
                    <div class="info">
                        <div class="name">${person.name}</div>
                        <div class="dates">${this.formatLifespan(person)}</div>
                    </div>
                </div>
            `).join('');

            // Add click handlers
            container.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const personId = item.dataset.personId;
                    const person = window.familyDataStore.getPerson(personId);
                    if (person) {
                        this.showPersonModal(person);
                        container.classList.remove('active');
                        document.getElementById('search-input').value = '';
                    }
                });
            });
        }

        container.classList.add('active');
    }

    showPersonModal(person) {
        const modal = document.getElementById('person-modal');
        if (!modal || !person) return;

        // Update header
        document.getElementById('modal-name').textContent = person.name;
        document.getElementById('modal-dates').textContent = this.formatLifespan(person);
        document.getElementById('modal-birthplace').textContent = person.birth?.place || '';

        // Update photo
        const photoImg = document.getElementById('modal-photo');
        const placeholder = modal.querySelector('.photo-placeholder');
        if (person.photo) {
            photoImg.src = person.photo;
            photoImg.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            photoImg.style.display = 'none';
            placeholder.style.display = 'flex';
            placeholder.textContent = person.gender === 'male' ? '👨' : person.gender === 'female' ? '👩' : '👤';
        }

        // Populate tabs
        this.populatePersonTabs(person);

        // Show modal
        modal.classList.add('active');

        // Switch to overview tab
        this.switchPersonTab('overview');
    }

    populatePersonTabs(person) {
        // Overview tab
        const overviewTab = document.getElementById('tab-overview');
        overviewTab.innerHTML = `
            <div class="info-grid">
                ${person.birth ? `
                    <div class="info-item">
                        <div class="info-label">Born</div>
                        <div class="info-value">${person.birth.date || 'Unknown'}</div>
                        ${person.birth.place ? `<div class="info-value" style="font-size: 0.9rem; color: var(--text-light);">📍 ${person.birth.place}</div>` : ''}
                    </div>
                ` : ''}
                ${person.death ? `
                    <div class="info-item">
                        <div class="info-label">Died</div>
                        <div class="info-value">${person.death.date || 'Unknown'}</div>
                        ${person.death.place ? `<div class="info-value" style="font-size: 0.9rem; color: var(--text-light);">📍 ${person.death.place}</div>` : ''}
                    </div>
                ` : ''}
                ${person.occupation ? `
                    <div class="info-item">
                        <div class="info-label">Occupation</div>
                        <div class="info-value">${person.occupation}</div>
                    </div>
                ` : ''}
                ${person.education ? `
                    <div class="info-item">
                        <div class="info-label">Education</div>
                        <div class="info-value">${person.education}</div>
                    </div>
                ` : ''}
            </div>
            ${person.notes && person.notes.length > 0 ? `
                <div style="margin-top: 1.5rem;">
                    <h4 style="font-size: 0.9rem; color: var(--text-light); margin-bottom: 0.5rem;">Notes</h4>
                    <p style="color: var(--text-medium); line-height: 1.7;">${person.notes.join(' ')}</p>
                </div>
            ` : ''}
        `;

        // Family tab
        const familyTab = document.getElementById('tab-family');
        const parents = window.familyDataStore.getParents(person.id);
        const siblings = window.familyDataStore.getSiblings(person.id);
        const spouses = window.familyDataStore.getSpouses(person.id);
        const children = window.familyDataStore.getChildren(person.id);

        familyTab.innerHTML = `
            ${parents.length > 0 ? `
                <div class="family-section">
                    <h4>Parents</h4>
                    ${parents.map(p => this.createFamilyMemberHTML(p, 'Parent')).join('')}
                </div>
            ` : ''}
            ${siblings.length > 0 ? `
                <div class="family-section">
                    <h4>Siblings</h4>
                    ${siblings.map(p => this.createFamilyMemberHTML(p, 'Sibling')).join('')}
                </div>
            ` : ''}
            ${spouses.length > 0 ? `
                <div class="family-section">
                    <h4>Spouse${spouses.length > 1 ? 's' : ''}</h4>
                    ${spouses.map(s => this.createFamilyMemberHTML(s.person, s.marriage?.date ? `Married ${s.marriage.date}` : 'Spouse')).join('')}
                </div>
            ` : ''}
            ${children.length > 0 ? `
                <div class="family-section">
                    <h4>Children</h4>
                    ${children.map(p => this.createFamilyMemberHTML(p, 'Child')).join('')}
                </div>
            ` : ''}
            ${parents.length === 0 && siblings.length === 0 && spouses.length === 0 && children.length === 0 ? `
                <div class="empty-state">
                    <div class="icon">👨‍👩‍👧‍👦</div>
                    <h3>No family connections</h3>
                    <p>Family relationships will appear here.</p>
                </div>
            ` : ''}
        `;

        // Add click handlers for family members
        familyTab.querySelectorAll('.family-member').forEach(el => {
            el.addEventListener('click', () => {
                const memberId = el.dataset.personId;
                const member = window.familyDataStore.getPerson(memberId);
                if (member) {
                    this.showPersonModal(member);
                }
            });
        });

        // Events tab
        const eventsTab = document.getElementById('tab-events');
        const events = this.getPersonEvents(person);
        eventsTab.innerHTML = events.length > 0 ? events.map(e => `
            <div class="timeline-event ${e.type}" style="margin-bottom: 1rem;">
                <div class="timeline-event-header">
                    <span class="timeline-event-type">${this.getEventIcon(e.type)}</span>
                    <span class="timeline-event-title">${e.title}</span>
                    <span class="timeline-event-date">${e.date || ''}</span>
                </div>
                ${e.place ? `<div class="timeline-event-location">📍 ${e.place}</div>` : ''}
            </div>
        `).join('') : `
            <div class="empty-state">
                <div class="icon">📅</div>
                <h3>No events recorded</h3>
            </div>
        `;

        // Photos tab
        const photosTab = document.getElementById('tab-photos');
        const photos = this.galleryView?.getPhotosForPerson(person.id) || [];
        photosTab.innerHTML = photos.length > 0 ? `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem;">
                ${photos.map(p => `
                    <div style="background: var(--bg-light); border-radius: 8px; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 3rem;">
                        ${p.placeholder || '📷'}
                    </div>
                `).join('')}
            </div>
        ` : `
            <div class="empty-state">
                <div class="icon">📷</div>
                <h3>No photos available</h3>
            </div>
        `;

        // Stories tab
        const storiesTab = document.getElementById('tab-stories');
        const stories = this.storiesView?.getStoriesForPerson(person.id) || [];
        storiesTab.innerHTML = stories.length > 0 ? stories.map(s => `
            <div style="background: var(--bg-light); padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
                <h4 style="font-family: var(--font-display); margin-bottom: 0.5rem;">${s.title}</h4>
                <p style="color: var(--text-medium); font-size: 0.95rem; line-height: 1.6;">
                    ${s.content.substring(0, 200)}${s.content.length > 200 ? '...' : ''}
                </p>
            </div>
        `).join('') : `
            <div class="empty-state">
                <div class="icon">📖</div>
                <h3>No stories yet</h3>
            </div>
        `;
    }

    createFamilyMemberHTML(person, relation) {
        return `
            <div class="family-member" data-person-id="${person.id}">
                <div class="family-member-photo">
                    ${person.gender === 'male' ? '👨' : person.gender === 'female' ? '👩' : '👤'}
                </div>
                <div class="family-member-info">
                    <div class="family-member-name">${person.name}</div>
                    <div class="family-member-relation">${relation}</div>
                </div>
            </div>
        `;
    }

    getPersonEvents(person) {
        const events = [];

        if (person.birth) {
            events.push({
                type: 'birth',
                title: 'Born',
                date: person.birth.date,
                place: person.birth.place
            });
        }

        if (person.baptism) {
            events.push({
                type: 'event',
                title: 'Baptized',
                date: person.baptism.date,
                place: person.baptism.place
            });
        }

        person.spouses?.forEach(spouse => {
            if (spouse.marriage) {
                const spousePerson = window.familyDataStore.getPerson(spouse.person);
                events.push({
                    type: 'marriage',
                    title: `Married ${spousePerson?.name || 'Unknown'}`,
                    date: spouse.marriage.date,
                    place: spouse.marriage.place
                });
            }
        });

        if (person.death) {
            events.push({
                type: 'death',
                title: 'Passed away',
                date: person.death.date,
                place: person.death.place
            });
        }

        return events;
    }

    getEventIcon(type) {
        switch (type) {
            case 'birth': return '👶';
            case 'death': return '🕯️';
            case 'marriage': return '💒';
            default: return '📌';
        }
    }

    switchPersonTab(tabId) {
        document.querySelectorAll('.person-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `tab-${tabId}`);
        });
    }

    formatLifespan(person) {
        const birthYear = person.birth?.dateObject?.year;
        const deathYear = person.death?.dateObject?.year;

        if (birthYear && deathYear) {
            return `${birthYear} – ${deathYear}`;
        } else if (birthYear) {
            return `b. ${birthYear}`;
        } else if (deathYear) {
            return `d. ${deathYear}`;
        }
        return '';
    }

    showUploadModal() {
        const modal = document.getElementById('upload-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    setupFileUpload() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('gedcom-input');
        const statusEl = document.getElementById('upload-status');

        if (!uploadArea || !fileInput) return;

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) {
                this.processGedcomFile(file);
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processGedcomFile(file);
            }
        });
    }

    async processGedcomFile(file) {
        const statusEl = document.getElementById('upload-status');

        try {
            const content = await file.text();
            const parser = new GedcomParser();
            const data = parser.parse(content);

            // Load the parsed data
            window.familyDataStore.loadFromGedcom(data);

            // Update current person to first person in list
            if (data.people.length > 0) {
                this.currentPerson = data.people[0].id;
            }

            // Re-render current view
            this.renderCurrentView();

            // Show success
            if (statusEl) {
                statusEl.className = 'success';
                statusEl.textContent = `✓ Successfully loaded ${data.people.length} people from your family tree!`;
                statusEl.style.display = 'block';
            }

            // Close modal after delay
            setTimeout(() => {
                document.getElementById('upload-modal')?.classList.remove('active');
            }, 2000);

        } catch (error) {
            console.error('Error parsing GEDCOM:', error);
            if (statusEl) {
                statusEl.className = 'error';
                statusEl.textContent = `✗ Error parsing file: ${error.message}`;
                statusEl.style.display = 'block';
            }
        }
    }

    // Method to change the tree's root person
    setRootPerson(personId) {
        this.currentPerson = personId;
        if (this.currentView === 'tree') {
            this.treeViz?.render(personId);
        }
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FamilyTreeApp();
    window.app.init();
});

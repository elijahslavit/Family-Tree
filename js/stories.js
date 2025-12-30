/**
 * Stories View
 * Display family stories, biographies, and historical content
 */

class StoriesView {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.stories = [];
        this.currentFilter = 'all';

        this.init();
    }

    init() {
        this.setupFilters();
    }

    setupFilters() {
        document.getElementById('stories-filter')?.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.render();
        });
    }

    render() {
        if (!this.container) return;

        // Get stories from sample data
        this.stories = SAMPLE_FAMILY_DATA.stories || [];

        const filteredStories = this.filterStories(this.stories);

        this.container.innerHTML = '';

        if (filteredStories.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📖</div>
                    <h3>No stories to display</h3>
                    <p>Add family stories or adjust your filters.</p>
                </div>
            `;
            return;
        }

        filteredStories.forEach(story => {
            const card = this.createStoryCard(story);
            this.container.appendChild(card);
        });
    }

    filterStories(stories) {
        if (this.currentFilter === 'all') return stories;
        return stories.filter(story => story.type === this.currentFilter);
    }

    createStoryCard(story) {
        const card = document.createElement('div');
        card.className = 'story-card';

        const person = story.personId ? window.familyDataStore.getPerson(story.personId) : null;
        const relatedPeople = (story.relatedPeople || [])
            .map(id => window.familyDataStore.getPerson(id))
            .filter(Boolean);

        const typeLabel = this.getTypeLabel(story.type);
        const typeIcon = this.getTypeIcon(story.type);

        card.innerHTML = `
            <div class="story-header">
                <div class="story-person-photo" style="display: flex; align-items: center; justify-content: center; font-size: 2.5rem; background: linear-gradient(135deg, #F5F0EB 0%, #E5DDD5 100%);">
                    ${person?.gender === 'male' ? '👨' : person?.gender === 'female' ? '👩' : '👤'}
                </div>
                <div class="story-meta">
                    <h3 class="story-title">${story.title}</h3>
                    ${person ? `<p class="story-author">About ${person.name}</p>` : ''}
                    <span class="story-type">${typeIcon} ${typeLabel}</span>
                </div>
            </div>
            <div class="story-content">
                ${this.formatStoryContent(story.content)}
            </div>
            ${relatedPeople.length > 0 ? `
                <div class="story-related">
                    <h4>People in this story</h4>
                    <div class="related-people">
                        ${relatedPeople.map(p => `
                            <span class="related-person" data-person-id="${p.id}">
                                ${p.gender === 'male' ? '👨' : p.gender === 'female' ? '👩' : '👤'}
                                ${p.firstName || p.name.split(' ')[0]}
                            </span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        // Add click handlers for related people
        card.querySelectorAll('.related-person').forEach(el => {
            el.addEventListener('click', () => {
                const personId = el.dataset.personId;
                const clickedPerson = window.familyDataStore.getPerson(personId);
                if (clickedPerson) {
                    const event = new CustomEvent('personSelected', { detail: clickedPerson });
                    document.dispatchEvent(event);
                }
            });
        });

        return card;
    }

    formatStoryContent(content) {
        if (!content) return '';

        // Split into paragraphs and wrap each
        const paragraphs = content.split('\n\n').filter(p => p.trim());
        return paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
    }

    getTypeLabel(type) {
        switch (type) {
            case 'biography': return 'Biography';
            case 'memory': return 'Memory';
            case 'history': return 'Historical';
            case 'tradition': return 'Tradition';
            default: return 'Story';
        }
    }

    getTypeIcon(type) {
        switch (type) {
            case 'biography': return '📝';
            case 'memory': return '💭';
            case 'history': return '📜';
            case 'tradition': return '🎄';
            default: return '📖';
        }
    }

    // Get stories related to a specific person
    getStoriesForPerson(personId) {
        return this.stories.filter(story =>
            story.personId === personId ||
            (story.relatedPeople && story.relatedPeople.includes(personId))
        );
    }
}

// Export for use
window.StoriesView = StoriesView;

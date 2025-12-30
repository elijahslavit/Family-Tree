/**
 * Gallery View
 * Photo gallery with filtering and lightbox
 */

class GalleryView {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.photos = [];
        this.currentFilter = 'all';
        this.currentSort = 'date-desc';
        this.lightboxIndex = 0;

        this.init();
    }

    init() {
        this.setupFilters();
        this.setupLightbox();
    }

    setupFilters() {
        document.getElementById('gallery-filter')?.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.render();
        });

        document.getElementById('gallery-sort')?.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.render();
        });
    }

    setupLightbox() {
        const lightbox = document.getElementById('lightbox');
        if (!lightbox) return;

        lightbox.querySelector('.lightbox-close')?.addEventListener('click', () => {
            this.closeLightbox();
        });

        lightbox.querySelector('.lightbox-prev')?.addEventListener('click', () => {
            this.navigateLightbox(-1);
        });

        lightbox.querySelector('.lightbox-next')?.addEventListener('click', () => {
            this.navigateLightbox(1);
        });

        // Close on background click
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                this.closeLightbox();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;

            switch (e.key) {
                case 'Escape':
                    this.closeLightbox();
                    break;
                case 'ArrowLeft':
                    this.navigateLightbox(-1);
                    break;
                case 'ArrowRight':
                    this.navigateLightbox(1);
                    break;
            }
        });
    }

    render() {
        if (!this.container) return;

        // Get photos from uploaded data
        this.photos = window.familyDataStore?.media || [];

        let filteredPhotos = this.filterPhotos(this.photos);
        filteredPhotos = this.sortPhotos(filteredPhotos);

        this.container.innerHTML = '';

        if (filteredPhotos.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📷</div>
                    <h3>No photos to display</h3>
                    <p>Upload a GEDCOM file with media to view the photo gallery.</p>
                </div>
            `;
            return;
        }

        filteredPhotos.forEach((photo, index) => {
            const item = this.createGalleryItem(photo, index);
            this.container.appendChild(item);
        });
    }

    filterPhotos(photos) {
        if (this.currentFilter === 'all') return photos;
        return photos.filter(photo => photo.category === this.currentFilter);
    }

    sortPhotos(photos) {
        const sorted = [...photos];

        switch (this.currentSort) {
            case 'date-desc':
                sorted.sort((a, b) => {
                    const yearA = a.dateObject?.year || 0;
                    const yearB = b.dateObject?.year || 0;
                    return yearB - yearA;
                });
                break;
            case 'date-asc':
                sorted.sort((a, b) => {
                    const yearA = a.dateObject?.year || 0;
                    const yearB = b.dateObject?.year || 0;
                    return yearA - yearB;
                });
                break;
            case 'person':
                sorted.sort((a, b) => {
                    const nameA = this.getFirstPersonName(a);
                    const nameB = this.getFirstPersonName(b);
                    return nameA.localeCompare(nameB);
                });
                break;
        }

        return sorted;
    }

    getFirstPersonName(photo) {
        if (!photo.people || photo.people.length === 0) return '';
        const person = window.familyDataStore.getPerson(photo.people[0]);
        return person?.name || '';
    }

    createGalleryItem(photo, index) {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.dataset.index = index;

        // Get people names
        const peopleNames = (photo.people || [])
            .map(id => window.familyDataStore.getPerson(id))
            .filter(Boolean)
            .map(p => p.firstName || p.name.split(' ')[0]);

        item.innerHTML = `
            <div class="gallery-item-image" style="display: flex; align-items: center; justify-content: center; font-size: 4rem; background: linear-gradient(135deg, #F5F0EB 0%, #E5DDD5 100%);">
                ${photo.placeholder || '📷'}
            </div>
            <div class="gallery-item-info">
                <div class="gallery-item-title">${photo.title}</div>
                <div class="gallery-item-date">${photo.date || 'Date unknown'}</div>
                ${peopleNames.length > 0 ? `
                    <div class="gallery-item-people">
                        ${peopleNames.slice(0, 3).map(name => `<span class="tag">${name}</span>`).join('')}
                        ${peopleNames.length > 3 ? `<span class="tag">+${peopleNames.length - 3}</span>` : ''}
                    </div>
                ` : ''}
            </div>
        `;

        item.addEventListener('click', () => {
            this.openLightbox(index);
        });

        return item;
    }

    openLightbox(index) {
        const photos = this.sortPhotos(this.filterPhotos(this.photos));
        if (index < 0 || index >= photos.length) return;

        this.lightboxIndex = index;
        const photo = photos[index];

        const lightbox = document.getElementById('lightbox');
        const img = document.getElementById('lightbox-img');
        const title = document.getElementById('lightbox-title');
        const description = document.getElementById('lightbox-description');

        if (!lightbox) return;

        // Since we're using placeholders, show a styled placeholder
        img.style.display = 'none';

        // Create a placeholder display
        let placeholderEl = lightbox.querySelector('.lightbox-placeholder');
        if (!placeholderEl) {
            placeholderEl = document.createElement('div');
            placeholderEl.className = 'lightbox-placeholder';
            placeholderEl.style.cssText = `
                font-size: 8rem;
                background: linear-gradient(135deg, #F5F0EB 0%, #E5DDD5 100%);
                width: 400px;
                height: 300px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 12px;
            `;
            img.parentNode.insertBefore(placeholderEl, img);
        }
        placeholderEl.textContent = photo.placeholder || '📷';
        placeholderEl.style.display = 'flex';

        title.textContent = photo.title;

        // Build description with people names
        let desc = photo.description || '';
        const peopleNames = (photo.people || [])
            .map(id => window.familyDataStore.getPerson(id))
            .filter(Boolean)
            .map(p => p.name);

        if (peopleNames.length > 0) {
            desc += (desc ? ' • ' : '') + 'Featuring: ' + peopleNames.join(', ');
        }

        description.textContent = desc;

        lightbox.classList.add('active');
    }

    closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        if (lightbox) {
            lightbox.classList.remove('active');
        }
    }

    navigateLightbox(direction) {
        const photos = this.sortPhotos(this.filterPhotos(this.photos));
        let newIndex = this.lightboxIndex + direction;

        if (newIndex < 0) newIndex = photos.length - 1;
        if (newIndex >= photos.length) newIndex = 0;

        this.openLightbox(newIndex);
    }

    // Method to add photos for a specific person
    getPhotosForPerson(personId) {
        return this.photos.filter(photo =>
            photo.people && photo.people.includes(personId)
        );
    }
}

// Export for use
window.GalleryView = GalleryView;

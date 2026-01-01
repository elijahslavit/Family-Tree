// Interactive Family Tree Visualizer
// Loads JSON data and creates an interactive, expandable tree with dual-color system

class FamilyTreeVisualizer {
    constructor() {
        this.data = null;
        this.individuals = {};
        this.families = {};
        this.treeData = null;
        this.focusPerson = null;
        this.colorMode = 'dual'; // dual, family, generation
        this.filters = {
            surname: '',
            location: '',
            timePeriod: ''
        };

        // Color schemes
        this.familyColors = {
            'Lathrop': '#3498db',
            'Bradford': '#2ecc71',
            'Powell': '#9b59b6',
            'Petty': '#e74c3c',
            'Crow': '#f39c12',
            'Warren': '#1abc9c',
            'Tilden': '#e67e22',
            'Goodwin': '#34495e',
            'Hodges': '#16a085',
            'default': '#95a5a6'
        };

        this.generationColors = [
            '#FFD700', // Gold - Gen 1
            '#C0C0C0', // Silver - Gen 2
            '#CD7F32', // Bronze - Gen 3
            '#4169E1', // Royal Blue - Gen 4
            '#32CD32', // Lime Green - Gen 5
            '#FF6347', // Tomato - Gen 6
            '#9370DB', // Medium Purple - Gen 7
            '#20B2AA', // Light Sea Green - Gen 8
            '#FF69B4', // Hot Pink - Gen 9
            '#DAA520'  // Goldenrod - Gen 10+
        ];

        this.init();
    }

    async init() {
        try {
            // Load JSON data
            const response = await fetch('js/Lathrop Tree.json');
            this.data = await response.json();
            this.individuals = this.data.individuals;
            this.families = this.data.families;

            // Build tree structure
            this.buildTreeStructure();

            // Populate controls
            this.populateControls();

            // Setup event listeners
            this.setupEventListeners();

            // Render tree
            this.renderTree();

            // Hide loading spinner
            document.querySelector('.loading').style.display = 'none';
        } catch (error) {
            console.error('Error loading family tree data:', error);
            document.querySelector('.loading').textContent = 'Error loading family tree data. Please check the console for details.';
        }
    }

    buildTreeStructure() {
        // Find root individuals (those who aren't children in any family)
        const childrenIds = new Set();
        Object.values(this.families).forEach(family => {
            if (family.children) {
                family.children.forEach(childId => childrenIds.add(childId));
            }
        });

        // Find individuals who are not children (potential roots)
        const rootCandidates = Object.keys(this.individuals).filter(id => !childrenIds.has(id));

        // Use Rev. John Lathrop (I4) as default root if available, otherwise use first root candidate
        const defaultRoot = this.individuals['I4'] ? 'I4' : rootCandidates[0];
        this.focusPerson = defaultRoot;

        // Build hierarchy from root
        this.treeData = this.buildHierarchy(this.focusPerson);
    }

    buildHierarchy(personId, generation = 1, visited = new Set()) {
        if (!personId || visited.has(personId)) return null;
        visited.add(personId);

        const person = this.individuals[personId];
        if (!person) return null;

        const node = {
            id: personId,
            data: person,
            generation: generation,
            children: []
        };

        // Find families where this person is a spouse
        if (person.familyAsSpouse) {
            person.familyAsSpouse.forEach(familyId => {
                const family = this.families[familyId];
                if (family && family.children) {
                    family.children.forEach(childId => {
                        const childNode = this.buildHierarchy(childId, generation + 1, visited);
                        if (childNode) {
                            node.children.push(childNode);
                        }
                    });
                }
            });
        }

        return node;
    }

    populateControls() {
        // Populate focus person dropdown
        const focusSelect = document.getElementById('focus-person');
        const sortedPeople = Object.values(this.individuals).sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        sortedPeople.forEach(person => {
            const option = document.createElement('option');
            option.value = person.id;
            option.textContent = `${person.name} (${person.id})`;
            if (person.id === this.focusPerson) {
                option.selected = true;
            }
            focusSelect.appendChild(option);
        });

        // Populate surname filter
        const surnameSelect = document.getElementById('filter-surname');
        const surnames = new Set();
        Object.values(this.individuals).forEach(person => {
            if (person.surname) surnames.add(person.surname);
        });

        Array.from(surnames).sort().forEach(surname => {
            const option = document.createElement('option');
            option.value = surname;
            option.textContent = surname;
            surnameSelect.appendChild(option);
        });

        // Populate location filter
        const locationSelect = document.getElementById('filter-location');
        const locations = new Set();
        Object.values(this.individuals).forEach(person => {
            if (person.birth && person.birth.place) locations.add(person.birth.place);
            if (person.death && person.death.place) locations.add(person.death.place);
            if (person.residence) locations.add(person.residence);
        });

        Array.from(locations).sort().forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationSelect.appendChild(option);
        });
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Focus person selection
        const focusSelect = document.getElementById('focus-person');
        focusSelect.addEventListener('change', (e) => {
            this.focusPerson = e.target.value;
            this.treeData = this.buildHierarchy(this.focusPerson);
            this.renderTree();
        });

        // Filters
        document.getElementById('filter-surname').addEventListener('change', (e) => {
            this.filters.surname = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filter-location').addEventListener('change', (e) => {
            this.filters.location = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filter-time').addEventListener('change', (e) => {
            this.filters.timePeriod = e.target.value;
            this.applyFilters();
        });

        // Color mode toggles
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.colorMode = e.target.dataset.mode;
                this.updateNodeColors();
                this.updateLegend();
            });
        });

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetView();
        });

        // Modal close
        document.getElementById('modal-close').addEventListener('click', () => {
            document.getElementById('person-modal').classList.remove('active');
        });

        document.getElementById('person-modal').addEventListener('click', (e) => {
            if (e.target.id === 'person-modal') {
                document.getElementById('person-modal').classList.remove('active');
            }
        });
    }

    renderTree() {
        if (!this.treeData) return;

        // Clear existing SVG
        const container = document.getElementById('tree-container');
        const existingSvg = container.querySelector('#tree-svg');
        if (existingSvg) {
            existingSvg.remove();
        }

        // Create new SVG
        const width = container.clientWidth;
        const height = container.clientHeight;

        const svg = d3.select('#tree-container')
            .append('svg')
            .attr('id', 'tree-svg')
            .attr('width', width)
            .attr('height', height);

        // Create zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 3])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2}, 50)`);

        // Create tree layout
        const tree = d3.tree()
            .size([width - 200, height - 200])
            .separation((a, b) => (a.parent === b.parent ? 1 : 1.2));

        const root = d3.hierarchy(this.treeData);
        tree(root);

        // Create links
        g.selectAll('.link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.linkVertical()
                .x(d => d.x)
                .y(d => d.y));

        // Create nodes
        const node = g.selectAll('.node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .on('click', (event, d) => this.showPersonDetails(d.data.data));

        // Add rectangles for nodes
        node.append('rect')
            .attr('class', 'node-rect')
            .attr('width', 140)
            .attr('height', 70)
            .attr('x', -70)
            .attr('y', -35)
            .attr('fill', d => this.getNodeFillColor(d.data.data, d.data.generation))
            .attr('stroke', d => this.getNodeBorderColor(d.data.data, d.data.generation));

        // Add ID number (top left)
        node.append('text')
            .attr('class', 'node-id')
            .attr('x', -65)
            .attr('y', -22)
            .attr('text-anchor', 'start')
            .text(d => d.data.id);

        // Add generation number (top right)
        node.append('text')
            .attr('class', 'node-id')
            .attr('x', 65)
            .attr('y', -22)
            .attr('text-anchor', 'end')
            .text(d => `G${d.data.generation}`);

        // Add name
        node.append('text')
            .attr('class', 'node-text')
            .attr('y', 0)
            .attr('text-anchor', 'middle')
            .text(d => this.truncateName(d.data.data.name, 16));

        // Add dates
        node.append('text')
            .attr('class', 'node-dates')
            .attr('y', 15)
            .attr('text-anchor', 'middle')
            .text(d => this.getDateRange(d.data.data));

        this.svg = svg;
        this.g = g;
        this.zoom = zoom;

        // Update legend
        this.updateLegend();

        // Show legend
        document.getElementById('legend').style.display = 'block';
    }

    getNodeFillColor(person, generation) {
        if (this.colorMode === 'generation') {
            return this.generationColors[Math.min(generation - 1, this.generationColors.length - 1)];
        } else if (this.colorMode === 'dual' || this.colorMode === 'family') {
            const family = this.familyColors[person.surname] || this.familyColors.default;
            return family;
        }
        return '#fff';
    }

    getNodeBorderColor(person, generation) {
        if (this.colorMode === 'family') {
            return '#333';
        } else if (this.colorMode === 'dual') {
            return this.generationColors[Math.min(generation - 1, this.generationColors.length - 1)];
        } else if (this.colorMode === 'generation') {
            return '#333';
        }
        return '#333';
    }

    updateNodeColors() {
        if (!this.g) return;

        this.g.selectAll('.node-rect')
            .transition()
            .duration(500)
            .attr('fill', d => this.getNodeFillColor(d.data.data, d.data.generation))
            .attr('stroke', d => this.getNodeBorderColor(d.data.data, d.data.generation));
    }

    updateLegend() {
        const legendContent = document.getElementById('legend-content');
        legendContent.innerHTML = '';

        if (this.colorMode === 'dual') {
            // Show both family and generation colors
            const div1 = document.createElement('div');
            div1.innerHTML = '<strong>Fill Color (Family):</strong>';
            legendContent.appendChild(div1);

            Object.entries(this.familyColors).forEach(([family, color]) => {
                if (family !== 'default') {
                    const item = document.createElement('div');
                    item.className = 'legend-item';
                    item.innerHTML = `
                        <div class="legend-color" style="background: ${color};"></div>
                        <span>${family}</span>
                    `;
                    legendContent.appendChild(item);
                }
            });

            const div2 = document.createElement('div');
            div2.innerHTML = '<br><strong>Border Color (Generation):</strong>';
            legendContent.appendChild(div2);

            this.generationColors.forEach((color, idx) => {
                const item = document.createElement('div');
                item.className = 'legend-item';
                item.innerHTML = `
                    <div class="legend-color" style="background: ${color}; border-color: ${color};"></div>
                    <span>Generation ${idx + 1}</span>
                `;
                legendContent.appendChild(item);
            });
        } else if (this.colorMode === 'family') {
            Object.entries(this.familyColors).forEach(([family, color]) => {
                if (family !== 'default') {
                    const item = document.createElement('div');
                    item.className = 'legend-item';
                    item.innerHTML = `
                        <div class="legend-color" style="background: ${color};"></div>
                        <span>${family}</span>
                    `;
                    legendContent.appendChild(item);
                }
            });
        } else if (this.colorMode === 'generation') {
            this.generationColors.forEach((color, idx) => {
                const item = document.createElement('div');
                item.className = 'legend-item';
                item.innerHTML = `
                    <div class="legend-color" style="background: ${color};"></div>
                    <span>Generation ${idx + 1}</span>
                `;
                legendContent.appendChild(item);
            });
        }
    }

    showPersonDetails(person) {
        const modal = document.getElementById('person-modal');
        const nameEl = document.getElementById('modal-person-name');
        const detailsEl = document.getElementById('modal-person-details');

        // Set name
        nameEl.textContent = person.name;

        // Build details HTML
        let detailsHTML = '';

        // Basic Info Section
        detailsHTML += '<div class="detail-section">';
        detailsHTML += '<h3>Basic Information</h3>';
        detailsHTML += '<div class="detail-grid">';
        detailsHTML += `<div class="detail-label">ID:</div><div class="detail-value">${person.id}</div>`;
        detailsHTML += `<div class="detail-label">Full Name:</div><div class="detail-value">${person.name}</div>`;
        if (person.title) {
            detailsHTML += `<div class="detail-label">Title:</div><div class="detail-value">${person.title}</div>`;
        }
        if (person.sex) {
            detailsHTML += `<div class="detail-label">Sex:</div><div class="detail-value">${person.sex === 'M' ? 'Male' : 'Female'}</div>`;
        }
        if (person.occupation) {
            detailsHTML += `<div class="detail-label">Occupation:</div><div class="detail-value">${person.occupation}</div>`;
        }
        if (person.residence) {
            detailsHTML += `<div class="detail-label">Residence:</div><div class="detail-value">${person.residence}</div>`;
        }
        detailsHTML += '</div></div>';

        // Life Events Section
        detailsHTML += '<div class="detail-section">';
        detailsHTML += '<h3>Life Events</h3>';
        detailsHTML += '<div class="detail-grid">';
        if (person.birth && (person.birth.date || person.birth.place)) {
            detailsHTML += `<div class="detail-label">Birth:</div><div class="detail-value">${person.birth.date || ''} ${person.birth.place ? '• ' + person.birth.place : ''}</div>`;
        }
        if (person.death && (person.death.date || person.death.place)) {
            detailsHTML += `<div class="detail-label">Death:</div><div class="detail-value">${person.death.date || ''} ${person.death.place ? '• ' + person.death.place : ''}</div>`;
        }
        if (person.burial && person.burial.place) {
            detailsHTML += `<div class="detail-label">Burial:</div><div class="detail-value">${person.burial.place}</div>`;
        }
        detailsHTML += '</div></div>';

        // Family Relationships
        detailsHTML += '<div class="detail-section">';
        detailsHTML += '<h3>Family Relationships</h3>';
        detailsHTML += '<div class="detail-grid">';

        // Spouse(s)
        if (person.familyAsSpouse && person.familyAsSpouse.length > 0) {
            person.familyAsSpouse.forEach(familyId => {
                const family = this.families[familyId];
                if (family) {
                    const spouseId = family.husband === person.id ? family.wife : family.husband;
                    const spouse = this.individuals[spouseId];
                    if (spouse) {
                        detailsHTML += `<div class="detail-label">Spouse:</div><div class="detail-value">${spouse.name}</div>`;
                    }
                }
            });
        }

        // Parents
        if (person.familyAsChild && person.familyAsChild.length > 0) {
            person.familyAsChild.forEach(familyId => {
                const family = this.families[familyId];
                if (family) {
                    if (family.husband) {
                        const father = this.individuals[family.husband];
                        if (father) {
                            detailsHTML += `<div class="detail-label">Father:</div><div class="detail-value">${father.name}</div>`;
                        }
                    }
                    if (family.wife) {
                        const mother = this.individuals[family.wife];
                        if (mother) {
                            detailsHTML += `<div class="detail-label">Mother:</div><div class="detail-value">${mother.name}</div>`;
                        }
                    }
                }
            });
        }

        // Children
        if (person.familyAsSpouse && person.familyAsSpouse.length > 0) {
            const children = [];
            person.familyAsSpouse.forEach(familyId => {
                const family = this.families[familyId];
                if (family && family.children) {
                    family.children.forEach(childId => {
                        const child = this.individuals[childId];
                        if (child) children.push(child.name);
                    });
                }
            });
            if (children.length > 0) {
                detailsHTML += `<div class="detail-label">Children:</div><div class="detail-value">${children.join(', ')}</div>`;
            }
        }

        detailsHTML += '</div></div>';

        // Notes Section
        if (person.notes && person.notes.length > 0) {
            detailsHTML += '<div class="detail-section">';
            detailsHTML += '<h3>Notes</h3>';
            person.notes.forEach(note => {
                detailsHTML += `<div class="notes-list">${note}</div>`;
            });
            detailsHTML += '</div>';
        }

        detailsEl.innerHTML = detailsHTML;
        modal.classList.add('active');
    }

    handleSearch(query) {
        if (!query) {
            this.g.selectAll('.node')
                .classed('hidden', false)
                .style('opacity', 1);
            return;
        }

        const lowerQuery = query.toLowerCase();
        this.g.selectAll('.node')
            .style('opacity', d => {
                const person = d.data.data;
                const match = person.name.toLowerCase().includes(lowerQuery) ||
                             person.id.toLowerCase().includes(lowerQuery) ||
                             (person.surname && person.surname.toLowerCase().includes(lowerQuery));
                return match ? 1 : 0.2;
            });
    }

    applyFilters() {
        this.g.selectAll('.node')
            .style('opacity', d => {
                const person = d.data.data;
                let show = true;

                // Surname filter
                if (this.filters.surname && person.surname !== this.filters.surname) {
                    show = false;
                }

                // Location filter
                if (this.filters.location) {
                    const hasLocation = (person.birth && person.birth.place === this.filters.location) ||
                                      (person.death && person.death.place === this.filters.location) ||
                                      person.residence === this.filters.location;
                    if (!hasLocation) show = false;
                }

                // Time period filter
                if (this.filters.timePeriod) {
                    const [startYear, endYear] = this.filters.timePeriod.split('-').map(Number);
                    const birthYear = this.extractYear(person.birth?.date);
                    if (!birthYear || birthYear < startYear || birthYear > endYear) {
                        show = false;
                    }
                }

                return show ? 1 : 0.2;
            });
    }

    extractYear(dateString) {
        if (!dateString) return null;
        const match = dateString.match(/\d{4}/);
        return match ? parseInt(match[0]) : null;
    }

    resetView() {
        // Clear filters
        document.getElementById('search-input').value = '';
        document.getElementById('filter-surname').value = '';
        document.getElementById('filter-location').value = '';
        document.getElementById('filter-time').value = '';
        this.filters = { surname: '', location: '', timePeriod: '' };

        // Reset zoom
        this.svg.transition().duration(750).call(
            this.zoom.transform,
            d3.zoomIdentity
        );

        // Reset opacity
        this.g.selectAll('.node').style('opacity', 1);
    }

    truncateName(name, maxLength) {
        return name.length > maxLength ? name.substring(0, maxLength - 3) + '...' : name;
    }

    getDateRange(person) {
        const birth = person.birth?.date ? this.extractYear(person.birth.date) || person.birth.date.substring(0, 10) : '?';
        const death = person.death?.date ? this.extractYear(person.death.date) || person.death.date.substring(0, 10) : '?';
        return `${birth} - ${death}`;
    }
}

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FamilyTreeVisualizer();
});

/**
 * Tree Visualization
 * Interactive family tree using D3.js
 */

class TreeVisualization {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.svg = d3.select('#tree-svg');
        this.g = null;
        this.zoom = null;
        this.currentMode = 'pedigree';
        this.currentPerson = null;
        this.nodeWidth = 180;
        this.nodeHeight = 80;
        this.levelHeight = 120;
        this.siblingGap = 30;

        this.colors = {
            male: '#6B8E9F',
            female: '#D4A574',
            unknown: '#8B9A8C',
            selected: '#5B8C5A',
            link: '#C9BFB5',
            marriage: '#D4A574'
        };

        this.init();
    }

    init() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.svg
            .attr('width', width)
            .attr('height', height);

        this.g = this.svg.append('g').attr('class', 'tree-group');

        // Setup zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 3])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
                this.updateMiniMap(event.transform);
            });

        this.svg.call(this.zoom);

        // Setup resize handler
        window.addEventListener('resize', () => this.handleResize());

        // Setup controls
        this.setupControls();
    }

    setupControls() {
        document.getElementById('zoom-in')?.addEventListener('click', () => {
            this.svg.transition().call(this.zoom.scaleBy, 1.3);
        });

        document.getElementById('zoom-out')?.addEventListener('click', () => {
            this.svg.transition().call(this.zoom.scaleBy, 0.7);
        });

        document.getElementById('reset-view')?.addEventListener('click', () => {
            this.centerOnPerson(this.currentPerson);
        });

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentMode = e.target.dataset.mode;
                this.render(this.currentPerson);
            });
        });
    }

    handleResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.svg.attr('width', width).attr('height', height);
        if (this.currentPerson) {
            this.centerOnPerson(this.currentPerson);
        }
    }

    render(rootPersonId) {
        this.currentPerson = rootPersonId;
        this.g.selectAll('*').remove();

        switch (this.currentMode) {
            case 'pedigree':
                this.renderPedigree(rootPersonId);
                break;
            case 'descendants':
                this.renderDescendants(rootPersonId);
                break;
            case 'fan':
                this.renderFanChart(rootPersonId);
                break;
        }

        this.centerOnPerson(rootPersonId);
    }

    renderPedigree(rootPersonId) {
        const data = this.buildPedigreeData(rootPersonId, 5);
        if (!data) return;

        const treeLayout = d3.tree()
            .nodeSize([this.nodeHeight + this.siblingGap, this.nodeWidth + 60])
            .separation((a, b) => a.parent === b.parent ? 1 : 1.5);

        const root = d3.hierarchy(data);
        treeLayout(root);

        // Rotate for horizontal layout (ancestors to the right)
        root.descendants().forEach(d => {
            const temp = d.x;
            d.x = d.y;
            d.y = temp;
        });

        // Draw links
        this.g.selectAll('.tree-link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'tree-link')
            .attr('d', d => {
                return `M${d.source.x},${d.source.y}
                        C${(d.source.x + d.target.x) / 2},${d.source.y}
                         ${(d.source.x + d.target.x) / 2},${d.target.y}
                         ${d.target.x},${d.target.y}`;
            })
            .style('fill', 'none')
            .style('stroke', this.colors.link)
            .style('stroke-width', 2);

        // Draw nodes
        const nodes = this.g.selectAll('.tree-node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', 'tree-node')
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .on('click', (event, d) => this.handleNodeClick(d.data));

        this.drawNodeCards(nodes);
    }

    renderDescendants(rootPersonId) {
        const data = this.buildDescendantData(rootPersonId, 5);
        if (!data) return;

        const treeLayout = d3.tree()
            .nodeSize([this.nodeWidth + this.siblingGap, this.nodeHeight + 60])
            .separation((a, b) => a.parent === b.parent ? 1 : 1.2);

        const root = d3.hierarchy(data);
        treeLayout(root);

        // Draw links
        this.g.selectAll('.tree-link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'tree-link')
            .attr('d', d => {
                return `M${d.source.x},${d.source.y}
                        C${d.source.x},${(d.source.y + d.target.y) / 2}
                         ${d.target.x},${(d.source.y + d.target.y) / 2}
                         ${d.target.x},${d.target.y}`;
            })
            .style('fill', 'none')
            .style('stroke', this.colors.link)
            .style('stroke-width', 2);

        // Draw nodes
        const nodes = this.g.selectAll('.tree-node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', 'tree-node')
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .on('click', (event, d) => this.handleNodeClick(d.data));

        this.drawNodeCards(nodes);
    }

    renderFanChart(rootPersonId) {
        const person = window.familyDataStore.getPerson(rootPersonId);
        if (!person) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        const centerX = width / 2;
        const centerY = height / 2;

        const generations = 5;
        const innerRadius = 60;
        const ringWidth = 60;

        // Build ancestor data
        const ancestors = this.buildAncestorList(rootPersonId, generations);

        // Draw center person
        this.g.append('circle')
            .attr('cx', centerX)
            .attr('cy', centerY)
            .attr('r', innerRadius)
            .attr('fill', this.getGenderColor(person.gender))
            .attr('stroke', '#fff')
            .attr('stroke-width', 3)
            .attr('cursor', 'pointer')
            .on('click', () => this.handleNodeClick(person));

        this.g.append('text')
            .attr('x', centerX)
            .attr('y', centerY)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', '#fff')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .text(this.truncateName(person.firstName || person.name, 10));

        // Draw ancestor rings
        for (let gen = 1; gen <= generations; gen++) {
            const startIndex = Math.pow(2, gen) - 2;
            const count = Math.pow(2, gen);
            const anglePerPerson = (2 * Math.PI) / count;

            for (let i = 0; i < count; i++) {
                const ancestorIndex = startIndex + i;
                const ancestor = ancestors[ancestorIndex];

                const startAngle = -Math.PI / 2 + i * anglePerPerson;
                const endAngle = startAngle + anglePerPerson;

                const inner = innerRadius + (gen - 1) * ringWidth;
                const outer = inner + ringWidth - 2;

                const arc = d3.arc()
                    .innerRadius(inner)
                    .outerRadius(outer)
                    .startAngle(startAngle)
                    .endAngle(endAngle);

                const segment = this.g.append('path')
                    .attr('class', 'fan-segment')
                    .attr('transform', `translate(${centerX},${centerY})`)
                    .attr('d', arc)
                    .attr('fill', ancestor ? this.getGenderColor(ancestor.gender) : '#E5E5E5')
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 1);

                if (ancestor) {
                    segment
                        .attr('cursor', 'pointer')
                        .on('click', () => this.handleNodeClick(ancestor))
                        .append('title')
                        .text(`${ancestor.name}\n${ancestor.birth?.date || ''}`);

                    // Add text for larger segments
                    if (gen <= 3) {
                        const midAngle = (startAngle + endAngle) / 2;
                        const textRadius = (inner + outer) / 2;
                        const textX = centerX + textRadius * Math.cos(midAngle);
                        const textY = centerY + textRadius * Math.sin(midAngle);

                        this.g.append('text')
                            .attr('class', 'fan-text')
                            .attr('x', textX)
                            .attr('y', textY)
                            .attr('text-anchor', 'middle')
                            .attr('dominant-baseline', 'middle')
                            .attr('transform', `rotate(${(midAngle * 180 / Math.PI) + 90},${textX},${textY})`)
                            .attr('fill', '#fff')
                            .attr('font-size', gen <= 2 ? '10px' : '8px')
                            .text(this.truncateName(ancestor.firstName || ancestor.name, 8));
                    }
                }
            }
        }
    }

    buildPedigreeData(personId, maxGen, currentGen = 0) {
        if (currentGen >= maxGen) return null;

        const person = window.familyDataStore.getPerson(personId);
        if (!person) return null;

        const node = {
            id: person.id,
            name: person.name,
            firstName: person.firstName,
            lastName: person.lastName,
            gender: person.gender,
            birth: person.birth,
            death: person.death,
            photo: person.photo,
            children: []
        };

        // Add parents as children in pedigree (going backwards in time)
        const parents = window.familyDataStore.getParents(personId);
        parents.forEach(parent => {
            const parentNode = this.buildPedigreeData(parent.id, maxGen, currentGen + 1);
            if (parentNode) {
                node.children.push(parentNode);
            }
        });

        return node;
    }

    buildDescendantData(personId, maxGen, currentGen = 0) {
        if (currentGen >= maxGen) return null;

        const person = window.familyDataStore.getPerson(personId);
        if (!person) return null;

        const node = {
            id: person.id,
            name: person.name,
            firstName: person.firstName,
            lastName: person.lastName,
            gender: person.gender,
            birth: person.birth,
            death: person.death,
            photo: person.photo,
            children: []
        };

        // Add actual children
        const children = window.familyDataStore.getChildren(personId);
        children.forEach(child => {
            const childNode = this.buildDescendantData(child.id, maxGen, currentGen + 1);
            if (childNode) {
                node.children.push(childNode);
            }
        });

        return node;
    }

    buildAncestorList(personId, generations) {
        // Create array for all ancestor positions
        const totalPositions = Math.pow(2, generations + 1) - 2;
        const ancestors = new Array(totalPositions).fill(null);

        const fillAncestors = (id, index) => {
            if (index >= totalPositions) return;

            const person = window.familyDataStore.getPerson(id);
            if (!person) return;

            ancestors[index] = person;

            const parents = window.familyDataStore.getParents(id);
            const fatherIndex = 2 * index + 2;
            const motherIndex = 2 * index + 3;

            parents.forEach(parent => {
                if (parent.gender === 'male') {
                    fillAncestors(parent.id, fatherIndex);
                } else {
                    fillAncestors(parent.id, motherIndex);
                }
            });
        };

        fillAncestors(personId, -1); // Start with root at -1 (we handle root separately)

        // Now fill the actual ancestors array
        const person = window.familyDataStore.getPerson(personId);
        if (person) {
            const parents = window.familyDataStore.getParents(personId);
            parents.forEach((parent, i) => {
                fillAncestors(parent.id, i);
            });
        }

        return ancestors;
    }

    drawNodeCards(nodes) {
        // Card background
        nodes.append('rect')
            .attr('class', 'node-card')
            .attr('x', -this.nodeWidth / 2)
            .attr('y', -this.nodeHeight / 2)
            .attr('width', this.nodeWidth)
            .attr('height', this.nodeHeight)
            .attr('rx', 10)
            .attr('fill', '#fff')
            .attr('stroke', d => this.getGenderColor(d.data.gender))
            .attr('stroke-width', 3);

        // Gender indicator bar
        nodes.append('rect')
            .attr('x', -this.nodeWidth / 2)
            .attr('y', -this.nodeHeight / 2)
            .attr('width', 6)
            .attr('height', this.nodeHeight)
            .attr('rx', 3)
            .attr('fill', d => this.getGenderColor(d.data.gender));

        // Photo circle or placeholder
        nodes.append('circle')
            .attr('cx', -this.nodeWidth / 2 + 35)
            .attr('cy', 0)
            .attr('r', 25)
            .attr('fill', '#F5F0EB')
            .attr('stroke', d => this.getGenderColor(d.data.gender))
            .attr('stroke-width', 2);

        nodes.append('text')
            .attr('x', -this.nodeWidth / 2 + 35)
            .attr('y', 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '20px')
            .text(d => d.data.gender === 'male' ? '👨' : d.data.gender === 'female' ? '👩' : '👤');

        // Name
        nodes.append('text')
            .attr('class', 'node-name')
            .attr('x', -this.nodeWidth / 2 + 70)
            .attr('y', -10)
            .attr('font-family', "'Playfair Display', serif")
            .attr('font-size', '13px')
            .attr('font-weight', '600')
            .attr('fill', '#2C3E2D')
            .text(d => this.truncateName(d.data.name, 15));

        // Dates
        nodes.append('text')
            .attr('class', 'node-dates')
            .attr('x', -this.nodeWidth / 2 + 70)
            .attr('y', 8)
            .attr('font-size', '11px')
            .attr('fill', '#8B9A8C')
            .text(d => this.formatLifespan(d.data));

        // Birth place (truncated)
        nodes.append('text')
            .attr('class', 'node-place')
            .attr('x', -this.nodeWidth / 2 + 70)
            .attr('y', 24)
            .attr('font-size', '10px')
            .attr('fill', '#8B9A8C')
            .text(d => {
                if (d.data.birth && d.data.birth.place) {
                    return '📍 ' + this.truncateName(d.data.birth.place, 18);
                }
                return '';
            });
    }

    getGenderColor(gender) {
        return this.colors[gender] || this.colors.unknown;
    }

    truncateName(name, maxLength) {
        if (!name) return '';
        if (name.length <= maxLength) return name;
        return name.substring(0, maxLength - 1) + '…';
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

    handleNodeClick(person) {
        // Dispatch custom event for the app to handle
        const event = new CustomEvent('personSelected', { detail: person });
        document.dispatchEvent(event);
    }

    centerOnPerson(personId) {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        // Reset zoom and center
        this.svg.transition().duration(500).call(
            this.zoom.transform,
            d3.zoomIdentity.translate(width / 2, height / 2).scale(1)
        );
    }

    updateMiniMap(transform) {
        const miniMap = document.getElementById('mini-map');
        if (!miniMap) return;

        const viewport = miniMap.querySelector('.viewport');
        if (!viewport) return;

        const scale = 0.1;
        const width = this.container.clientWidth * scale / transform.k;
        const height = this.container.clientHeight * scale / transform.k;
        const x = -transform.x * scale / transform.k;
        const y = -transform.y * scale / transform.k;

        viewport.style.width = `${Math.min(width, 150)}px`;
        viewport.style.height = `${Math.min(height, 100)}px`;
        viewport.style.left = `${Math.max(0, Math.min(x, 150 - width))}px`;
        viewport.style.top = `${Math.max(0, Math.min(y, 100 - height))}px`;
    }

    setMode(mode) {
        this.currentMode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        if (this.currentPerson) {
            this.render(this.currentPerson);
        }
    }
}

// Export for use
window.TreeVisualization = TreeVisualization;

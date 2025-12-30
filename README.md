# Family Tree Explorer

An interactive, beautiful web viewer for genealogy data. Built with love for the Lathrop-Finelli-Slavit-McFadden family.

## Features

### Interactive Family Tree
- **Pedigree View**: Explore ancestors going back through generations
- **Descendant View**: See family lines going forward
- **Fan Chart**: Beautiful circular visualization of your ancestry
- Click on any person to see their full profile

### Timeline
- Chronological view of all family events
- Filter by births, deaths, marriages, and other events
- Click any event to see the person's profile

### Migration Map
- Interactive map showing where your family lived
- Birthplaces, residences, and death locations
- Migration paths showing family movement over time

### Photo Gallery
- Browse family photos
- Filter by category (portraits, families, events, documents)
- Sort by date or person
- Full-screen lightbox view

### Stories & History
- Family biographies and memories
- Historical context and traditions
- Linked to relevant family members

### Person Profiles
- Detailed information for each family member
- Family connections (parents, siblings, spouses, children)
- Life events timeline
- Related photos and stories

## Getting Started

### Option 1: View with Sample Data
Simply open `index.html` in your web browser. The viewer comes pre-loaded with sample data based on the Lathrop family structure.

### Option 2: Load Your Own GEDCOM
1. Open `index.html` in your browser
2. Click the 📁 upload button in the header
3. Drag & drop your `.ged` file or browse to select it
4. Your family tree will load automatically!

### Option 3: Host Online
This is a static website that can be hosted anywhere:
- **GitHub Pages**: Push to a repo and enable Pages
- **Netlify**: Drag the folder to netlify.com/drop
- **Any web server**: Just upload the files

## File Structure

```
Family-Tree/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styling
├── js/
│   ├── app.js          # Main application logic
│   ├── gedcom-parser.js # GEDCOM file parser (5.5, 5.5.1, 7.0)
│   ├── family-data.js  # Data store and sample data
│   ├── tree-visualization.js # D3.js tree rendering
│   ├── timeline.js     # Timeline view
│   ├── map.js          # Leaflet map view
│   ├── gallery.js      # Photo gallery
│   └── stories.js      # Stories view
└── README.md           # This file
```

## Adding Your Own Data

### From Gramps
1. Open Gramps
2. Go to **Family Trees** → **Export**
3. Choose **GEDCOM** format
4. Save the `.ged` file
5. Upload to the Family Tree Explorer

### Adding Photos
Photos referenced in your GEDCOM file will be displayed if the paths are accessible. For web hosting, you'll want to:
1. Create a `media/` folder
2. Place your photos there
3. Update paths in your GEDCOM or the `family-data.js` file

### Adding Stories
Edit the `SAMPLE_FAMILY_DATA.stories` array in `js/family-data.js` to add your own family stories.

## Customization

### Colors
Edit the CSS variables at the top of `css/styles.css`:
```css
:root {
    --primary: #5B8C5A;      /* Main green color */
    --secondary: #D4A574;    /* Warm accent */
    --accent: #6B8E9F;       /* Blue accent */
    /* ... more colors ... */
}
```

### Central Figures
Edit `js/app.js` to change the default starting person:
```javascript
this.defaultPerson = '@I5@'; // Change to your preferred person's ID
```

## Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Technologies Used
- **D3.js** - Tree visualizations
- **Leaflet** - Interactive maps
- **OpenStreetMap** - Map tiles
- **Google Fonts** - Playfair Display & Source Sans Pro

## Privacy Note
This viewer runs entirely in your browser. No data is sent to any server. Your family information stays private on your computer.

## Credits
Built with care for preserving and sharing family history.

---

*"We are not just individuals. We are links in a chain that stretches back through time."*

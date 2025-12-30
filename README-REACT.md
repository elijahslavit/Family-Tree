# Family Tree Explorer - React Edition

A modern, interactive family tree viewer built with React, TypeScript, and Vite.

## Features

- **Interactive Family Tree** - Pedigree, Descendants, and Fan Chart views
- **Timeline** - Chronological view of family events
- **Migration Map** - Interactive map showing family locations
- **Photo Gallery** - Browse and filter family photos
- **Stories & History** - Family biographies and memories
- **GEDCOM Support** - Upload and parse GEDCOM files (5.5, 5.5.1, 7.0)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── header/         # Header with navigation
│   ├── tree-view/      # Family tree visualization
│   ├── timeline-view/  # Timeline component
│   ├── map-view/       # Map component
│   ├── gallery-view/   # Gallery component
│   ├── stories-view/   # Stories component
│   ├── modals/         # Modal components
│   └── loading-screen/ # Loading screen
├── context/            # React Context providers
├── styles/              # Global styles and SCSS variables
├── types/               # TypeScript type definitions
└── utils/                # Utility functions (parser, data store)
```

## Technologies

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **D3.js** - Tree visualizations
- **Leaflet** - Interactive maps
- **SCSS** - Styling with modules

## Usage

1. Start the development server
2. Click the upload button (📁) in the header
3. Upload your GEDCOM file
4. Explore your family tree!

## Code Standards

- 2-space indentation
- No semicolons (unless required)
- camelCase for variables/functions
- PascalCase for components/interfaces
- SCSS modules co-located with components
- Strict TypeScript configuration
- Functional components with hooks

## License

Built with care for preserving and sharing family history.


# Adventure Map Components

A comprehensive set of React components for displaying adventure locations on interactive maps using Mapbox GL JS.

## Quick Start

1. **Environment Setup**
   ```bash
   # Add your Mapbox access token to .env
   VITE_MAPBOX_ACCESS_TOKEN="pk.eyJ..."
   ```

2. **Basic Usage**
   ```jsx
   import { MapView, MapboxProvider } from './components/adventure';

   function App() {
     return (
       <MapboxProvider>
         <MapView
           adventures={adventures}
           height="600px"
           onAdventureSelect={(adventure) => console.log(adventure)}
         />
       </MapboxProvider>
     );
   }
   ```

## Components

### MapView
Main map component with clustering, search, and drawing capabilities.

**Props:**
- `adventures` - Array of adventure objects with `latitude`, `longitude`, `title`, etc.
- `onAdventureSelect` - Callback when an adventure marker is clicked
- `onLocationSearch` - Callback when a location search is performed
- `onBoundarySearch` - Callback when a boundary area is drawn
- `showLocationSearch` - Show/hide search box (default: true)
- `showDrawControls` - Show/hide drawing tools (default: false)
- `allowClustering` - Enable/disable marker clustering (default: true)
- `height` - Map container height (default: "500px")

### AdventureMarker
Custom markers with glassmorphic styling, difficulty colors, and activity icons.

### ClusterMarker
Cluster markers that group nearby adventures with expansion functionality.

### AdventurePopup
Popup cards showing adventure details, distance, rating, and action buttons.

### LocationSearch
Search component with Mapbox Geocoding API integration and autocomplete.

### DrawControls
Drawing tools for creating search boundaries (polygon, rectangle, circle).

## Features

- ✅ **Interactive Map** - Pan, zoom, and navigation controls
- ✅ **Marker Clustering** - Performance optimization for large datasets
- ✅ **Location Search** - Autocomplete powered by Mapbox Geocoding
- ✅ **Current Location** - GPS location detection and distance calculations
- ✅ **Boundary Search** - Draw areas to filter adventures
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Dark/Light Theme** - Automatic theme switching
- ✅ **Glassmorphic Styling** - Consistent with app design system

## Adventure Object Structure

```javascript
{
  id: 1,
  title: "Grand Canyon Hiking",
  location: "Arizona, USA",
  latitude: 36.1069,
  longitude: -112.1129,
  activityType: "hiking", // hiking, climbing, kayaking, cycling, skiing
  difficulty: "intermediate", // beginner, intermediate, advanced, expert
  price: 150,
  priceUnit: "person", // person, day, hour
  rating: 4.8,
  reviewCount: 324,
  duration: "4 hours",
  description: "Experience breathtaking views...",
  imageUrl: "https://...",
  tags: ["scenic", "guided", "adventure"],
  bookingUrl: "https://..." // optional
}
```

## Styling

Components use Tailwind CSS with glassmorphic design patterns:

- **Glass Effects** - Backdrop blur and transparency
- **Color Coding** - Difficulty-based marker colors
- **Animations** - Hover effects, clustering transitions
- **Responsive** - Mobile-first design approach

## Distance Utilities

The `distance.js` utility provides:

- `calculateDistance(lat1, lon1, lat2, lon2, unit)` - Haversine formula
- `formatDistance(distance, unit, precision)` - Human-readable formatting
- `sortByDistance(adventures, referencePoint, unit)` - Sort by proximity
- `filterByDistance(adventures, referencePoint, maxDistance, unit)` - Filter by radius

## Development

**Storybook Stories:**
```bash
npm run storybook
# Navigate to Adventure/MapView
```

**Testing:**
- Stories include sample data and event handlers
- Multiple configurations (clustering on/off, controls, etc.)
- Responsive testing across device sizes

## Dependencies

- `mapbox-gl` - Mapbox GL JS library
- `react-map-gl` - React wrapper for Mapbox GL
- `supercluster` - Point clustering algorithm
- Existing project dependencies (React, Tailwind, etc.)

## API Requirements

- **Mapbox Access Token** - Required for maps and geocoding
- **HTTPS** - Required in production for geolocation features

## Performance Considerations

- Marker clustering automatically activates with 2+ nearby points
- Clustering radius and zoom thresholds are configurable
- Lazy loading of map tiles based on viewport
- Efficient re-rendering with React optimizations
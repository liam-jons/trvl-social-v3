import { MapView } from './index';
import { MapboxProvider } from '../../contexts/MapboxContext';
// Sample adventure data
const sampleAdventures = [
  {
    id: 1,
    title: 'Grand Canyon Hiking',
    location: 'Arizona, USA',
    latitude: 36.1069,
    longitude: -112.1129,
    activityType: 'hiking',
    difficulty: 'intermediate',
    price: 150,
    priceUnit: 'person',
    rating: 4.8,
    reviewCount: 324,
    duration: '4 hours',
    description: 'Experience the breathtaking views of the Grand Canyon with this guided hiking tour.',
    imageUrl: 'https://picsum.photos/400/300?random=1',
    tags: ['scenic', 'guided', 'adventure'],
  },
  {
    id: 2,
    title: 'Yosemite Rock Climbing',
    location: 'California, USA',
    latitude: 37.8651,
    longitude: -119.5383,
    activityType: 'climbing',
    difficulty: 'expert',
    price: 280,
    priceUnit: 'day',
    rating: 4.9,
    reviewCount: 156,
    duration: '8 hours',
    description: 'Challenge yourself with world-class rock climbing in Yosemite National Park.',
    imageUrl: 'https://picsum.photos/400/300?random=2',
    tags: ['extreme', 'technical', 'mountain'],
  },
  {
    id: 3,
    title: 'Colorado River Kayaking',
    location: 'Colorado, USA',
    latitude: 39.5501,
    longitude: -106.0419,
    activityType: 'kayaking',
    difficulty: 'beginner',
    price: 85,
    priceUnit: 'person',
    rating: 4.6,
    reviewCount: 89,
    duration: '3 hours',
    description: 'Gentle river kayaking perfect for beginners and families.',
    imageUrl: 'https://picsum.photos/400/300?random=3',
    tags: ['family-friendly', 'water', 'relaxing'],
  },
  {
    id: 4,
    title: 'Mountain Biking Trail',
    location: 'Utah, USA',
    latitude: 37.2431,
    longitude: -113.0263,
    activityType: 'cycling',
    difficulty: 'advanced',
    price: 120,
    priceUnit: 'person',
    rating: 4.7,
    reviewCount: 203,
    duration: '5 hours',
    description: 'Thrilling mountain bike trails with stunning desert landscapes.',
    imageUrl: 'https://picsum.photos/400/300?random=4',
    tags: ['technical', 'desert', 'adventure'],
  },
  {
    id: 5,
    title: 'Aspen Skiing',
    location: 'Colorado, USA',
    latitude: 39.1911,
    longitude: -106.8175,
    activityType: 'skiing',
    difficulty: 'intermediate',
    price: 200,
    priceUnit: 'day',
    rating: 4.8,
    reviewCount: 412,
    duration: 'Full day',
    description: 'World-class skiing on pristine powder slopes in Aspen.',
    imageUrl: 'https://picsum.photos/400/300?random=5',
    tags: ['winter', 'powder', 'luxury'],
  },
  // Additional close adventures for clustering demo
  {
    id: 6,
    title: 'Grand Canyon South Rim',
    location: 'Arizona, USA',
    latitude: 36.0544,
    longitude: -112.1401,
    activityType: 'hiking',
    difficulty: 'beginner',
    price: 75,
    priceUnit: 'person',
    rating: 4.5,
    reviewCount: 89,
    duration: '2 hours',
    description: 'Easy walk along the South Rim with spectacular views.',
    imageUrl: 'https://picsum.photos/400/300?random=6',
    tags: ['easy', 'family-friendly', 'scenic'],
  },
  {
    id: 7,
    title: 'Grand Canyon Mule Ride',
    location: 'Arizona, USA',
    latitude: 36.0979,
    longitude: -112.1095,
    activityType: 'touring',
    difficulty: 'beginner',
    price: 300,
    priceUnit: 'person',
    rating: 4.4,
    reviewCount: 156,
    duration: '6 hours',
    description: 'Historic mule ride into the Grand Canyon.',
    imageUrl: 'https://picsum.photos/400/300?random=7',
    tags: ['historic', 'unique', 'guided'],
  },
];
export default {
  title: 'Adventure/MapView',
  component: MapView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Interactive map component for displaying adventure locations with clustering, search, and drawing capabilities.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <MapboxProvider>
          <Story />
        </MapboxProvider>
      </div>
    ),
  ],
};
export const Default = {
  args: {
    adventures: sampleAdventures,
    height: '600px',
    showLocationSearch: true,
    allowClustering: true,
  },
};
export const WithDrawControls = {
  args: {
    adventures: sampleAdventures,
    height: '600px',
    showLocationSearch: true,
    showDrawControls: true,
    allowClustering: true,
  },
};
export const NoClustering = {
  args: {
    adventures: sampleAdventures,
    height: '600px',
    showLocationSearch: true,
    allowClustering: false,
  },
};
export const NoSearch = {
  args: {
    adventures: sampleAdventures,
    height: '600px',
    showLocationSearch: false,
    allowClustering: true,
  },
};
export const Empty = {
  args: {
    adventures: [],
    height: '600px',
    showLocationSearch: true,
    allowClustering: true,
  },
};
export const SingleAdventure = {
  args: {
    adventures: [sampleAdventures[0]],
    height: '600px',
    showLocationSearch: true,
    allowClustering: true,
  },
};
// Story with event handlers
export const WithEventHandlers = {
  args: {
    adventures: sampleAdventures,
    height: '600px',
    showLocationSearch: true,
    showDrawControls: true,
    allowClustering: true,
    onAdventureSelect: (adventure) => {
      console.log('Selected adventure:', adventure);
    },
    onLocationSearch: (result) => {
      console.log('Location search result:', result);
    },
    onBoundarySearch: (boundary) => {
      console.log('Boundary search:', boundary);
    },
  },
};
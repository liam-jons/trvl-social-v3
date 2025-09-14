import { useState } from 'react';
import AdventureCard from './AdventureCard';
import { mockAdventures } from '../../data/mock-adventures';

export default {
  title: 'Components/Adventure/AdventureCard',
  component: AdventureCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A reusable adventure card component with glassmorphic design, lazy loading images, and responsive grid/list view modes.'
      }
    }
  },
  argTypes: {
    viewMode: {
      control: { type: 'radio' },
      options: ['grid', 'list'],
      description: 'Display mode for the card'
    },
    adventure: {
      control: 'object',
      description: 'Adventure data object'
    },
    onClick: { action: 'clicked' }
  }
};

// Default story
export const Default = {
  args: {
    adventure: mockAdventures[0],
    viewMode: 'grid'
  }
};

// Grid view story
export const GridView = {
  args: {
    adventure: mockAdventures[0],
    viewMode: 'grid'
  },
  decorators: [
    () => (
      <div className="max-w-sm">
        <AdventureCard adventure={mockAdventures[0]} viewMode="grid" />
      </div>
    )
  ]
};

// List view story
export const ListView = {
  args: {
    adventure: mockAdventures[0],
    viewMode: 'list'
  },
  decorators: [
    () => (
      <div className="max-w-2xl">
        <AdventureCard adventure={mockAdventures[0]} viewMode="list" />
      </div>
    )
  ]
};

// Featured adventure
export const Featured = {
  args: {
    adventure: {
      ...mockAdventures[0],
      featured: true
    },
    viewMode: 'grid'
  }
};

// Limited availability
export const LimitedAvailability = {
  args: {
    adventure: {
      ...mockAdventures[0],
      availability: 'Limited'
    },
    viewMode: 'grid'
  }
};

// Different difficulties
export const EasyDifficulty = {
  args: {
    adventure: mockAdventures.find(a => a.difficulty === 'easy') || mockAdventures[0],
    viewMode: 'grid'
  }
};

export const ChallengingDifficulty = {
  args: {
    adventure: mockAdventures.find(a => a.difficulty === 'challenging') || mockAdventures[0],
    viewMode: 'grid'
  }
};

// Interactive view toggle story
const ViewToggleComponent = () => {
  const [viewMode, setViewMode] = useState('grid');

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <button
          onClick={() => setViewMode('grid')}
          className={`px-4 py-2 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Grid View
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          List View
        </button>
      </div>

      <div className={viewMode === 'grid' ? 'max-w-sm' : 'max-w-2xl'}>
        <AdventureCard
          adventure={mockAdventures[0]}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};

export const ViewToggle = {
  render: () => <ViewToggleComponent />
};

// Multiple cards comparison
export const MultipleCards = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockAdventures.slice(0, 3).map((adventure) => (
        <AdventureCard
          key={adventure.id}
          adventure={adventure}
          viewMode="grid"
        />
      ))}
    </div>
  )
};

// Image error state
export const ImageError = {
  args: {
    adventure: {
      ...mockAdventures[0],
      image: 'invalid-image-url'
    },
    viewMode: 'grid'
  }
};
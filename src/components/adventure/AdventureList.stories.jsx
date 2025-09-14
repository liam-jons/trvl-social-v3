import AdventureList from './AdventureList';
import { mockAdventures } from '../../data/mock-adventures';

export default {
  title: 'Components/Adventure/AdventureList',
  component: AdventureList,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A complete adventure listing component with search, filters, view toggle, and grid/list layout.'
      }
    }
  },
  argTypes: {
    adventures: {
      control: 'object',
      description: 'Array of adventure objects'
    },
    loading: {
      control: 'boolean',
      description: 'Loading state'
    },
    onAdventureClick: { action: 'adventure-clicked' }
  }
};

export const Default = {
  args: {
    adventures: mockAdventures,
    loading: false
  }
};

export const Loading = {
  args: {
    adventures: [],
    loading: true
  }
};

export const Empty = {
  args: {
    adventures: [],
    loading: false
  }
};

export const WithSearch = {
  args: {
    adventures: mockAdventures,
    loading: false,
    searchQuery: 'photography'
  }
};

export const WithFilters = {
  args: {
    adventures: mockAdventures,
    loading: false,
    filters: {
      category: 'photography',
      difficulty: 'moderate'
    }
  }
};

export const FewResults = {
  args: {
    adventures: mockAdventures.slice(0, 2),
    loading: false
  }
};
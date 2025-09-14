import SearchBar from './SearchBar';
import { mockAdventures } from '../../data/mock-adventures';

export default {
  title: 'Search/SearchBar',
  component: SearchBar,
  parameters: {
    layout: 'padded'
  },
  argTypes: {
    onSearch: { action: 'searched' },
    onResultSelect: { action: 'result selected' }
  }
};

export const Default = {
  args: {
    adventures: mockAdventures,
    placeholder: "Search adventures, locations, activities..."
  }
};

export const WithoutSuggestions = {
  args: {
    adventures: mockAdventures,
    showSuggestions: false,
    placeholder: "Search adventures..."
  }
};

export const Compact = {
  args: {
    adventures: mockAdventures,
    className: "max-w-md",
    placeholder: "Quick search..."
  }
};

export const Empty = {
  args: {
    adventures: [],
    placeholder: "No data available..."
  }
};
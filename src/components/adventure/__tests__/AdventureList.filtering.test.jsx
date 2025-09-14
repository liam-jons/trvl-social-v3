import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdventureList from '../AdventureList';
import { mockAdventures } from '../../../data/mock-adventures';

// Mock the hooks
vi.mock('../../hooks/useViewPreference', () => ({
  useViewPreference: () => ['grid', vi.fn()]
}));

vi.mock('../../../hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    location: { latitude: 40.7128, longitude: -74.0060 }, // NYC coordinates
    calculateDistance: vi.fn(() => 100)
  })
}));

// Mock child components to focus on filtering logic
vi.mock('../AdventureGrid', () => ({
  default: ({ adventures }) => (
    <div data-testid="adventure-grid">
      {adventures.map(adventure => (
        <div key={adventure.id} data-testid={`adventure-${adventure.id}`}>
          {adventure.title}
        </div>
      ))}
    </div>
  )
}));

vi.mock('../ViewToggle', () => ({
  default: () => <div data-testid="view-toggle">View Toggle</div>
}));

describe('AdventureList Filtering', () => {
  const defaultProps = {
    adventures: mockAdventures,
    loading: false,
    onAdventureClick: vi.fn(),
    filters: {},
    searchQuery: '',
    sortBy: 'featured'
  };

  it('displays all adventures when no filters applied', () => {
    render(<AdventureList {...defaultProps} />);

    expect(screen.getByText(`Showing ${mockAdventures.length} of ${mockAdventures.length} adventure`)).toBeInTheDocument();
    mockAdventures.forEach(adventure => {
      expect(screen.getByTestId(`adventure-${adventure.id}`)).toBeInTheDocument();
    });
  });

  it('filters adventures by search query', () => {
    render(
      <AdventureList
        {...defaultProps}
        searchQuery="Iceland"
      />
    );

    // Should only show Northern Lights adventure (Iceland)
    expect(screen.getByTestId('adventure-1')).toBeInTheDocument();
    expect(screen.queryByTestId('adventure-2')).not.toBeInTheDocument();
  });

  it('filters adventures by price range', () => {
    render(
      <AdventureList
        {...defaultProps}
        filters={{ priceMin: 1000, priceMax: 1500 }}
      />
    );

    // Should show adventures within price range
    // Northern Lights: $1250, Japanese Temple: $1180
    expect(screen.getByTestId('adventure-1')).toBeInTheDocument(); // $1250
    expect(screen.getByTestId('adventure-6')).toBeInTheDocument(); // $1180
    expect(screen.queryByTestId('adventure-2')).not.toBeInTheDocument(); // $890
  });

  it('filters adventures by adventure types', () => {
    render(
      <AdventureList
        {...defaultProps}
        filters={{ adventureTypes: ['photography'] }}
      />
    );

    // Should show adventures with photography tag
    // Northern Lights and Patagonia both have photography tags
    expect(screen.getByTestId('adventure-1')).toBeInTheDocument();
    expect(screen.getByTestId('adventure-5')).toBeInTheDocument();
    expect(screen.queryByTestId('adventure-2')).not.toBeInTheDocument();
  });

  it('filters adventures by group size', () => {
    render(
      <AdventureList
        {...defaultProps}
        filters={{ groupSize: 'small' }}
      />
    );

    // Small group should show adventures with 3-6 people capacity
    // Check adventures with appropriate group sizes
    expect(screen.getByTestId('adventure-1')).toBeInTheDocument(); // 6-12 people
    expect(screen.getByTestId('adventure-2')).toBeInTheDocument(); // 4-8 people
    expect(screen.getByTestId('adventure-5')).toBeInTheDocument(); // 4-6 people
  });

  it('combines multiple filters', () => {
    render(
      <AdventureList
        {...defaultProps}
        filters={{
          adventureTypes: ['cultural'],
          priceMin: 1000
        }}
        searchQuery="Japan"
      />
    );

    // Should show Japanese Temple adventure (cultural, >$1000, contains "Japan")
    expect(screen.getByTestId('adventure-6')).toBeInTheDocument();
    expect(screen.queryByTestId('adventure-1')).not.toBeInTheDocument();
  });

  it('sorts adventures by price', () => {
    render(
      <AdventureList
        {...defaultProps}
        sortBy="price_low"
      />
    );

    const grid = screen.getByTestId('adventure-grid');
    const adventureElements = Array.from(grid.children);

    // First adventure should be the cheapest (Mediterranean Sailing - $750)
    expect(adventureElements[0]).toHaveAttribute('data-testid', 'adventure-4');
  });

  it('shows loading state', () => {
    render(
      <AdventureList
        {...defaultProps}
        loading={true}
      />
    );

    expect(screen.getByText(/loading adventures/i)).toBeInTheDocument();
  });

  it('shows empty results message when no adventures match filters', () => {
    render(
      <AdventureList
        {...defaultProps}
        filters={{ priceMin: 10000 }} // No adventures cost this much
      />
    );

    expect(screen.getByText('Showing 0 of 6 adventures')).toBeInTheDocument();
  });

  it('displays search query in results summary', () => {
    render(
      <AdventureList
        {...defaultProps}
        searchQuery="photography"
      />
    );

    expect(screen.getByText(/for "photography"/)).toBeInTheDocument();
  });
});
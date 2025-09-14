import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  CompatibilityCircularProgress,
  CompatibilityBadge,
  CompatibilityRadarChart,
  CompatibilityBreakdownModal,
  CompatibilityScoreDisplay
} from '../index';
import { ScoringDimensionType } from '../../../types/compatibility';

// Mock compatibility data
const mockCompatibilityScore = {
  id: 'test-score',
  user1Id: 'user1',
  user2Id: 'user2',
  overallScore: 78,
  dimensions: {
    [ScoringDimensionType.PERSONALITY_TRAITS]: {
      name: 'Personality Traits',
      weight: 0.35,
      score: 85,
      maxScore: 100,
      calculatedAt: new Date()
    },
    [ScoringDimensionType.TRAVEL_PREFERENCES]: {
      name: 'Travel Preferences',
      weight: 0.25,
      score: 72,
      maxScore: 100,
      calculatedAt: new Date()
    }
  },
  confidence: 0.87,
  algorithmVersion: 'test-v1',
  calculatedAt: new Date()
};

describe('CompatibilityCircularProgress', () => {
  it('renders with correct score', () => {
    render(<CompatibilityCircularProgress score={75} showLabel={true} animate={false} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Match')).toBeInTheDocument();
  });

  it('renders without label when showLabel is false', () => {
    render(<CompatibilityCircularProgress score={75} showLabel={false} animate={false} />);
    expect(screen.queryByText('75%')).not.toBeInTheDocument();
    expect(screen.queryByText('Match')).not.toBeInTheDocument();
  });

  it('handles different score ranges', () => {
    const { rerender } = render(<CompatibilityCircularProgress score={95} showLabel={true} animate={false} />);
    expect(screen.getByText('95%')).toBeInTheDocument();

    rerender(<CompatibilityCircularProgress score={25} showLabel={true} animate={false} />);
    expect(screen.getByText('25%')).toBeInTheDocument();
  });
});

describe('CompatibilityBadge', () => {
  it('displays correct label for different score ranges', () => {
    const { rerender } = render(<CompatibilityBadge score={85} />);
    expect(screen.getByText('Excellent Match')).toBeInTheDocument();

    rerender(<CompatibilityBadge score={65} />);
    expect(screen.getByText('Good Match')).toBeInTheDocument();

    rerender(<CompatibilityBadge score={45} />);
    expect(screen.getByText('Fair Match')).toBeInTheDocument();

    rerender(<CompatibilityBadge score={25} />);
    expect(screen.getByText('Poor Match')).toBeInTheDocument();
  });

  it('shows score when showScore is true', () => {
    render(<CompatibilityBadge score={75} showScore={true} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('hides score when showScore is false', () => {
    render(<CompatibilityBadge score={75} showScore={false} />);
    expect(screen.queryByText('75%')).not.toBeInTheDocument();
  });
});

describe('CompatibilityRadarChart', () => {
  it('renders with dimensions data', () => {
    render(
      <CompatibilityRadarChart
        dimensions={mockCompatibilityScore.dimensions}
        showLabels={true}
        showValues={true}
        animate={false}
      />
    );

    // Should render SVG
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders without labels when showLabels is false', () => {
    render(
      <CompatibilityRadarChart
        dimensions={mockCompatibilityScore.dimensions}
        showLabels={false}
        animate={false}
      />
    );

    // Should render SVG but not labels
    expect(document.querySelector('svg')).toBeInTheDocument();
    expect(screen.queryByText('Personality')).not.toBeInTheDocument();
  });
});

describe('CompatibilityBreakdownModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders when open', () => {
    render(
      <CompatibilityBreakdownModal
        isOpen={true}
        onClose={mockOnClose}
        compatibilityScore={mockCompatibilityScore}
        user1Name="Alice"
        user2Name="Bob"
      />
    );

    expect(screen.getByText('Compatibility Analysis')).toBeInTheDocument();
    expect(screen.getByText('Alice & Bob')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <CompatibilityBreakdownModal
        isOpen={false}
        onClose={mockOnClose}
        compatibilityScore={mockCompatibilityScore}
      />
    );

    expect(screen.queryByText('Compatibility Analysis')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    render(
      <CompatibilityBreakdownModal
        isOpen={true}
        onClose={mockOnClose}
        compatibilityScore={mockCompatibilityScore}
      />
    );

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('switches between tabs', async () => {
    render(
      <CompatibilityBreakdownModal
        isOpen={true}
        onClose={mockOnClose}
        compatibilityScore={mockCompatibilityScore}
      />
    );

    // Click on Breakdown tab
    const breakdownTab = screen.getByText('Breakdown');
    fireEvent.click(breakdownTab);

    await waitFor(() => {
      expect(screen.getByText('Personality Traits')).toBeInTheDocument();
    });

    // Click on Insights tab
    const insightsTab = screen.getByText('Insights');
    fireEvent.click(insightsTab);

    await waitFor(() => {
      expect(screen.getByText('💡 Key Insights')).toBeInTheDocument();
    });
  });
});

describe('CompatibilityScoreDisplay', () => {
  const mockUsers = {
    user1: { name: 'Alice', email: 'alice@test.com' },
    user2: { name: 'Bob', email: 'bob@test.com' }
  };

  it('renders loading state', () => {
    render(<CompatibilityScoreDisplay loading={true} />);
    expect(screen.getByText('Calculating compatibility...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const error = { message: 'Test error' };
    render(<CompatibilityScoreDisplay error={error} />);
    expect(screen.getByText('Compatibility Error')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders no data state', () => {
    render(<CompatibilityScoreDisplay compatibilityScore={null} />);
    expect(screen.getByText('No Compatibility Data')).toBeInTheDocument();
  });

  it('renders compatibility data', () => {
    render(
      <CompatibilityScoreDisplay
        compatibilityScore={mockCompatibilityScore}
        user1={mockUsers.user1}
        user2={mockUsers.user2}
      />
    );

    expect(screen.getByText('Compatibility Analysis')).toBeInTheDocument();
    expect(screen.getByText('Alice & Bob')).toBeInTheDocument();
  });

  it('shows breakdown button when enabled', () => {
    render(
      <CompatibilityScoreDisplay
        compatibilityScore={mockCompatibilityScore}
        showBreakdownButton={true}
      />
    );

    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('hides breakdown button when disabled', () => {
    render(
      <CompatibilityScoreDisplay
        compatibilityScore={mockCompatibilityScore}
        showBreakdownButton={false}
      />
    );

    expect(screen.queryByText('View Details')).not.toBeInTheDocument();
  });

  it('calls onRecalculate when recalculate button is clicked', () => {
    const mockRecalculate = vi.fn();
    render(
      <CompatibilityScoreDisplay
        compatibilityScore={mockCompatibilityScore}
        onRecalculate={mockRecalculate}
      />
    );

    const recalculateButton = screen.getByText('Recalculate');
    fireEvent.click(recalculateButton);

    expect(mockRecalculate).toHaveBeenCalledTimes(1);
  });

  it('opens breakdown modal when view details button is clicked', async () => {
    render(
      <CompatibilityScoreDisplay
        compatibilityScore={mockCompatibilityScore}
        showBreakdownButton={true}
      />
    );

    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);

    await waitFor(() => {
      // Check for modal-specific content to verify it opened
      expect(screen.getByText('📊')).toBeInTheDocument(); // Overview tab icon
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
  });
});
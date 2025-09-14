import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import FilterPanel from '../FilterPanel';

// Mock the geolocation hook
vi.mock('../../../hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    location: null,
    loading: false,
    error: null,
    requestLocation: vi.fn(),
    clearLocation: vi.fn(),
    calculateDistance: vi.fn(() => 100)
  })
}));

// Wrapper component for Router context
const FilterPanelWrapper = ({ onFiltersChange = vi.fn(), totalCount = 10 }) => (
  <MemoryRouter>
    <FilterPanel onFiltersChange={onFiltersChange} totalCount={totalCount} />
  </MemoryRouter>
);

describe('FilterPanel', () => {
  it('renders filter sections with correct titles', () => {
    render(<FilterPanelWrapper />);

    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Trip Dates')).toBeInTheDocument();
    expect(screen.getByText('Price Range')).toBeInTheDocument();
    expect(screen.getByText('Adventure Type')).toBeInTheDocument();
    expect(screen.getByText('Group Size')).toBeInTheDocument();
  });

  it('displays total adventure count', () => {
    render(<FilterPanelWrapper totalCount={25} />);

    expect(screen.getByText('25 adventures')).toBeInTheDocument();
  });

  it('expands and collapses filter sections', async () => {
    render(<FilterPanelWrapper />);

    // Location section should be expanded by default
    expect(screen.getByDisplayValue('all')).toBeInTheDocument();

    // Click to collapse location section
    const locationButton = screen.getByRole('button', { name: /location/i });
    fireEvent.click(locationButton);

    // Location options should be hidden
    await waitFor(() => {
      expect(screen.queryByDisplayValue('all')).not.toBeInTheDocument();
    });
  });

  it('updates location filter', async () => {
    const onFiltersChange = vi.fn();
    render(<FilterPanelWrapper onFiltersChange={onFiltersChange} />);

    // Click local location option
    const localRadio = screen.getByDisplayValue('local');
    fireEvent.click(localRadio);

    await waitFor(() => {
      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          location: 'local'
        })
      );
    });
  });

  it('handles price range changes', async () => {
    const onFiltersChange = vi.fn();
    render(<FilterPanelWrapper onFiltersChange={onFiltersChange} />);

    // Expand price section first
    const priceButton = screen.getByRole('button', { name: /price range/i });
    fireEvent.click(priceButton);

    await waitFor(() => {
      const minPriceInput = screen.getByDisplayValue('0');
      fireEvent.change(minPriceInput, { target: { value: '100' } });

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          priceMin: 100
        })
      );
    });
  });

  it('toggles adventure type checkboxes', async () => {
    const onFiltersChange = vi.fn();
    render(<FilterPanelWrapper onFiltersChange={onFiltersChange} />);

    // Expand adventure type section
    const adventureTypeButton = screen.getByRole('button', { name: /adventure type/i });
    fireEvent.click(adventureTypeButton);

    await waitFor(() => {
      const hikingCheckbox = screen.getByRole('checkbox', { name: /hiking & trekking/i });
      fireEvent.click(hikingCheckbox);

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          adventureTypes: ['hiking']
        })
      );
    });
  });

  it('displays and removes active filter pills', async () => {
    render(<FilterPanelWrapper />);

    // Change location to create an active filter
    const localRadio = screen.getByDisplayValue('local');
    fireEvent.click(localRadio);

    await waitFor(() => {
      expect(screen.getByText('Active Filters (1):')).toBeInTheDocument();
      expect(screen.getByText('Local')).toBeInTheDocument();
    });

    // Remove the filter pill
    const removeButton = screen.getByRole('button', { name: /local/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText('Active Filters')).not.toBeInTheDocument();
    });
  });

  it('clears all filters', async () => {
    const onFiltersChange = vi.fn();
    render(<FilterPanelWrapper onFiltersChange={onFiltersChange} />);

    // Add multiple filters
    const localRadio = screen.getByDisplayValue('local');
    fireEvent.click(localRadio);

    // Expand adventure type and select hiking
    const adventureTypeButton = screen.getByRole('button', { name: /adventure type/i });
    fireEvent.click(adventureTypeButton);

    await waitFor(async () => {
      const hikingCheckbox = screen.getByRole('checkbox', { name: /hiking & trekking/i });
      fireEvent.click(hikingCheckbox);

      // Click clear all button
      const clearButton = screen.getByText('Clear all');
      fireEvent.click(clearButton);

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          location: 'all',
          adventureTypes: []
        })
      );
    });
  });

  it('formats currency correctly', () => {
    render(<FilterPanelWrapper />);

    // Expand price section
    const priceButton = screen.getByRole('button', { name: /price range/i });
    fireEvent.click(priceButton);

    // Check if currency is formatted with $ symbol
    expect(screen.getByText(/\$0 - \$5,000/)).toBeInTheDocument();
  });

  it('handles date inputs', async () => {
    const onFiltersChange = vi.fn();
    render(<FilterPanelWrapper onFiltersChange={onFiltersChange} />);

    // Expand date section
    const dateButton = screen.getByRole('button', { name: /trip dates/i });
    fireEvent.click(dateButton);

    await waitFor(() => {
      const startDateInput = screen.getByLabelText('Start Date');
      fireEvent.change(startDateInput, { target: { value: '2024-12-25' } });

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2024-12-25'
        })
      );
    });
  });
});
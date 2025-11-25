import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { MedicationOverview } from '../../components/medication-overview';

// Mock the UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => children,
  CardContent: ({ children, ...props }: any) => children,
  CardHeader: ({ children, ...props }: any) => children,
  CardTitle: ({ children, ...props }: any) => children,
}));

// Mock Text component
jest.mock('@/components/ui/text', () => {
  const { Text } = require('react-native');
  return { Text };
});

// Mock theme
jest.mock('@/lib/theme', () => ({
  colors: {
    primary: {
      main: '#007AFF',
    },
    status: {
      success: '#34C759',
      warning: '#FF9500',
    },
  },
}));

describe('MedicationOverview', () => {
  it('should render the component title', () => {
    render(
      <MedicationOverview
        activeCount={5}
        dueNowCount={2}
        upcomingCount={3}
      />
    );

    expect(screen.getByText('Medication Overview')).toBeTruthy();
  });

  it('should display correct counts', () => {
    render(
      <MedicationOverview
        activeCount={8}
        dueNowCount={3}
        upcomingCount={5}
      />
    );

    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('should display labels for each metric', () => {
    render(
      <MedicationOverview
        activeCount={1}
        dueNowCount={1}
        upcomingCount={1}
      />
    );

    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('Due Now')).toBeTruthy();
    expect(screen.getByText('Upcoming')).toBeTruthy();
  });

  it('should handle zero counts', () => {
    render(
      <MedicationOverview
        activeCount={0}
        dueNowCount={0}
        upcomingCount={0}
      />
    );

    expect(screen.getByText('0')).toBeTruthy();
    // Should have three zeros for each metric
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements).toHaveLength(3);
  });

  it('should handle large numbers', () => {
    render(
      <MedicationOverview
        activeCount={999}
        dueNowCount={888}
        upcomingCount={777}
      />
    );

    expect(screen.getByText('999')).toBeTruthy();
    expect(screen.getByText('888')).toBeTruthy();
    expect(screen.getByText('777')).toBeTruthy();
  });

  it('should render all metric sections', () => {
    render(
      <MedicationOverview
        activeCount={1}
        dueNowCount={1}
        upcomingCount={1}
      />
    );

    // Check that all sections are present
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('Due Now')).toBeTruthy();
    expect(screen.getByText('Upcoming')).toBeTruthy();

    // Check that all counts are present
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('should maintain consistent structure for different values', () => {
    const { rerender } = render(
      <MedicationOverview
        activeCount={5}
        dueNowCount={2}
        upcomingCount={3}
      />
    );

    // Initial render
    expect(screen.getByText('Medication Overview')).toBeTruthy();

    // Rerender with different values
    rerender(
      <MedicationOverview
        activeCount={10}
        dueNowCount={7}
        upcomingCount={8}
      />
    );

    // Should still show the title and structure
    expect(screen.getByText('Medication Overview')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
  });

  it('should handle negative values gracefully', () => {
    render(
      <MedicationOverview
        activeCount={-1}
        dueNowCount={-2}
        upcomingCount={-3}
      />
    );

    // Should still render the component even with negative values
    expect(screen.getByText('Medication Overview')).toBeTruthy();
    expect(screen.getByText('-1')).toBeTruthy();
    expect(screen.getByText('-2')).toBeTruthy();
    expect(screen.getByText('-3')).toBeTruthy();
  });
});
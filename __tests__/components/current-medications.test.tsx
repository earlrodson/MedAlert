import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { CurrentMedications } from '../../components/current-medications';

// Mock the medication status provider
jest.mock('@/lib/medication-status-provider', () => ({
  useCurrentMedications: jest.fn(),
}));

// Mock the UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => children,
  CardContent: ({ children, ...props }: any) => children,
  CardHeader: ({ children, ...props }: any) => children,
  CardTitle: ({ children, ...props }: any) => children,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onPress, ...props }: any) => {
    const { Pressable } = require('react-native');
    return (
      <Pressable onPress={onPress} testID="button" {...props}>
        {children}
      </Pressable>
    );
  },
}));

jest.mock('@/components/ui/text', () => {
  const { Text } = require('react-native');
  return { Text };
});

// Mock nativewind
jest.mock('nativewind', () => ({
  useColorScheme: jest.fn(() => ({ colorScheme: 'light' })),
}));

// Mock theme
jest.mock('@/lib/theme', () => ({
  THEME: {
    light: {
      primary: '#007AFF',
      warning: '#FF9500',
      foreground: '#000000',
    },
    dark: {
      primary: '#0A84FF',
      warning: '#FF9F0A',
      foreground: '#FFFFFF',
    },
  },
}));

import { useCurrentMedications } from '@/lib/medication-status-provider';

const mockUseCurrentMedications = useCurrentMedications as jest.MockedFunction<typeof useCurrentMedications>;

describe('CurrentMedications', () => {
  const mockOnMedicationTaken = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state', () => {
    mockUseCurrentMedications.mockReturnValue({
      currentMedications: [],
      isLoading: true,
      error: null,
      markAsTaken: jest.fn(),
    });

    render(<CurrentMedications onMedicationTaken={mockOnMedicationTaken} />);

    expect(screen.getByText('Loading medications...')).toBeTruthy();
  });

  it('should show error state', () => {
    const errorMessage = 'Failed to load medications';
    mockUseCurrentMedications.mockReturnValue({
      currentMedications: [],
      isLoading: false,
      error: errorMessage,
      markAsTaken: jest.fn(),
    });

    render(<CurrentMedications onMedicationTaken={mockOnMedicationTaken} />);

    expect(screen.getByText('Error')).toBeTruthy();
    expect(screen.getByText(errorMessage)).toBeTruthy();
  });

  it('should show empty state when no medications', () => {
    mockUseCurrentMedications.mockReturnValue({
      currentMedications: [],
      isLoading: false,
      error: null,
      markAsTaken: jest.fn(),
    });

    render(<CurrentMedications onMedicationTaken={mockOnMedicationTaken} />);

    expect(screen.getByText('No medications scheduled for this time')).toBeTruthy();
  });

  it('should render current medications', () => {
    const mockMedications = [
      {
        medicationId: '1',
        name: 'Lisinopril',
        dosage: '10mg',
        time: '08:00',
        taken: false,
        instructions: 'Take with food',
      },
      {
        medicationId: '2',
        name: 'Metformin',
        dosage: '500mg',
        time: '08:00',
        taken: true,
        takenAt: '2024-01-15T08:30:00.000Z',
        instructions: 'Take after meals',
      },
    ];

    mockUseCurrentMedications.mockReturnValue({
      currentMedications: mockMedications,
      isLoading: false,
      error: null,
      markAsTaken: jest.fn(),
    });

    render(<CurrentMedications onMedicationTaken={mockOnMedicationTaken} />);

    expect(screen.getByText('Lisinopril')).toBeTruthy();
    expect(screen.getByText('10mg')).toBeTruthy();
    expect(screen.getByText('Metformin')).toBeTruthy();
    expect(screen.getByText('500mg')).toBeTruthy();
  });

  it('should handle medication taken action', async () => {
    const mockMarkAsTaken = jest.fn().mockResolvedValue(undefined);
    const mockMedications = [
      {
        medicationId: '1',
        name: 'Lisinopril',
        dosage: '10mg',
        time: '08:00',
        taken: false,
        instructions: 'Take with food',
      },
    ];

    mockUseCurrentMedications.mockReturnValue({
      currentMedications: mockMedications,
      isLoading: false,
      error: null,
      markAsTaken: mockMarkAsTaken,
    });

    render(<CurrentMedications onMedicationTaken={mockOnMedicationTaken} />);

    // Find and press the "Mark as Taken" button
    const markButton = screen.getByText('Mark as Taken');
    fireEvent.press(markButton);

    expect(mockMarkAsTaken).toHaveBeenCalledWith('1');
  });

  it('should call onMedicationTaken callback when medication is marked as taken', async () => {
    const mockMarkAsTaken = jest.fn().mockResolvedValue(undefined);
    const mockMedications = [
      {
        medicationId: '1',
        name: 'Lisinopril',
        dosage: '10mg',
        time: '08:00',
        taken: false,
        instructions: 'Take with food',
      },
    ];

    mockUseCurrentMedications.mockReturnValue({
      currentMedications: mockMedications,
      isLoading: false,
      error: null,
      markAsTaken: mockMarkAsTaken,
    });

    render(<CurrentMedications onMedicationTaken={mockOnMedicationTaken} />);

    const markButton = screen.getByText('Mark as Taken');
    fireEvent.press(markButton);

    // Wait for the async operation
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockOnMedicationTaken).toHaveBeenCalledWith('1');
  });

  it('should show taken status for already taken medications', () => {
    const mockMedications = [
      {
        medicationId: '1',
        name: 'Lisinopril',
        dosage: '10mg',
        time: '08:00',
        taken: true,
        takenAt: '2024-01-15T08:30:00.000Z',
        instructions: 'Take with food',
      },
    ];

    mockUseCurrentMedications.mockReturnValue({
      currentMedications: mockMedications,
      isLoading: false,
      error: null,
      markAsTaken: jest.fn(),
    });

    render(<CurrentMedications onMedicationTaken={mockOnMedicationTaken} />);

    expect(screen.getByText('Taken at 8:30 AM')).toBeTruthy();
  });

  it('should display instructions when provided', () => {
    const mockMedications = [
      {
        medicationId: '1',
        name: 'Lisinopril',
        dosage: '10mg',
        time: '08:00',
        taken: false,
        instructions: 'Take with food and plenty of water',
      },
    ];

    mockUseCurrentMedications.mockReturnValue({
      currentMedications: mockMedications,
      isLoading: false,
      error: null,
      markAsTaken: jest.fn(),
    });

    render(<CurrentMedications onMedicationTaken={mockOnMedicationTaken} />);

    expect(screen.getByText('Take with food and plenty of water')).toBeTruthy();
  });

  it('should not show button for already taken medications', () => {
    const mockMedications = [
      {
        medicationId: '1',
        name: 'Lisinopril',
        dosage: '10mg',
        time: '08:00',
        taken: true,
        takenAt: '2024-01-15T08:30:00.000Z',
        instructions: 'Take with food',
      },
    ];

    mockUseCurrentMedications.mockReturnValue({
      currentMedications: mockMedications,
      isLoading: false,
      error: null,
      markAsTaken: jest.fn(),
    });

    render(<CurrentMedications onMedicationTaken={mockOnMedicationTaken} />);

    // Should not show "Mark as Taken" button for already taken medication
    expect(screen.queryByText('Mark as Taken')).toBeFalsy();
  });
});
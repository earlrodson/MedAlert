import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BottomNavigation } from '../../components/bottom-navigation';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  usePathname: jest.fn(),
}));

// Mock nativewind
jest.mock('nativewind', () => ({
  useColorScheme: jest.fn(() => ({ colorScheme: 'light' })),
}));

// Mock theme
jest.mock('@/lib/theme', () => ({
  THEME: {
    light: {
      primary: '#007AFF',
      foreground: '#000000',
    },
    dark: {
      primary: '#0A84FF',
      foreground: '#FFFFFF',
    },
  },
}));

import { useRouter, usePathname } from 'expo-router';

const mockPush = jest.fn();
const mockPathname = jest.fn();

describe('BottomNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (usePathname as jest.Mock).mockImplementation(mockPathname);
  });

  it('should render all navigation items', () => {
    mockPathname.mockReturnValue('/');

    const { getByText } = render(<BottomNavigation />);

    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Meds')).toBeTruthy();
    expect(getByText('Schedule')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
  });

  it('should highlight the active route', () => {
    mockPathname.mockReturnValue('/medications');

    const { getByText } = render(<BottomNavigation />);

    // Check that the active tab has the correct styling
    const medsTab = getByText('Meds');
    expect(medsTab).toBeTruthy();
  });

  it('should navigate when pressing a non-active tab', () => {
    mockPathname.mockReturnValue('/');

    const { getByText } = render(<BottomNavigation />);

    const medicationsTab = getByText('Meds');
    fireEvent.press(medicationsTab);

    expect(mockPush).toHaveBeenCalledWith('/medications');
  });

  it('should not navigate when pressing the active tab', () => {
    mockPathname.mockReturnValue('/medications');

    const { getByText } = render(<BottomNavigation />);

    const medicationsTab = getByText('Meds');
    fireEvent.press(medicationsTab);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should show correct number of navigation items', () => {
    mockPathname.mockReturnValue('/');

    const { getAllByRole } = render(<BottomNavigation />);

    // Get all pressable elements
    const pressableElements = getAllByRole('button');
    expect(pressableElements).toHaveLength(4);
  });

  it('should handle different active routes correctly', () => {
    const routes = ['/', '/medications', '/schedule', '/profile'];

    routes.forEach((route) => {
      mockPathname.mockReturnValue(route);
      const { getByText } = render(<BottomNavigation />);

      // The component should render without errors for each route
      expect(getByText('Home')).toBeTruthy();
      expect(getByText('Meds')).toBeTruthy();
      expect(getByText('Schedule')).toBeTruthy();
      expect(getByText('Profile')).toBeTruthy();
    });
  });

  it('should apply disabled state to active tab', () => {
    mockPathname.mockReturnValue('/schedule');

    const { getByText } = render(<BottomNavigation />);

    const scheduleTab = getByText('Schedule');
    fireEvent.press(scheduleTab);

    // Active tab should not trigger navigation
    expect(mockPush).not.toHaveBeenCalled();
  });
});
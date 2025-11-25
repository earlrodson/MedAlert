// Basic test setup for MedAlert testing

// Global test timeout
jest.setTimeout(10000);

// Setup jsdom environment
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock react-native-css-interop with proper JSX runtime
jest.mock('react-native-css-interop', () => {
  const React = require('react');
  return {
    ...require('react/jsx-runtime'),
    getColorScheme: jest.fn(() => 'light'),
    useColorScheme: jest.fn(() => 'light'),
    jsx: React.jsx,
    jsxs: React.jsxs,
    Fragment: React.Fragment,
  };
}, { virtual: true });

jest.mock('lucide-react-native', () => ({}), { virtual: true });

jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  FlatList: 'FlatList',
  SafeAreaView: 'SafeAreaView',
  StyleSheet: { create: jest.fn() },
  Platform: { OS: 'web', select: jest.fn() },
  Dimensions: { get: jest.fn() },
  Alert: { alert: jest.fn() },
}), { virtual: true });

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: jest.fn(),
}), { virtual: true });

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock expo-sqlite
const mockDatabase = {
  execAsync: jest.fn(),
  runAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(() => Promise.resolve([])),
  closeAsync: jest.fn(),
  withTransactionAsync: jest.fn(),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve(mockDatabase)),
}));

// Make mockDatabase available globally for tests
global.mockDatabase = mockDatabase;

// Mock Clerk
jest.mock('@clerk/clerk-expo', () => ({
  ClerkProvider: ({ children }) => children,
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User',
    },
  }),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'test-user-id',
    signOut: jest.fn(),
  }),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useFocusEffect: jest.fn(),
  useSegments: jest.fn(() => ['main']),
  useLocalSearchParams: jest.fn(() => ({})),
}));

// Mock NativeWind
jest.mock('nativewind', () => ({}), { virtual: true });

// Mock @rn-primitives/slot to prevent JSX parsing issues
jest.mock('@rn-primitives/slot', () => ({}), { virtual: true });

// Mock react-native-web color scheme - extend existing window object
if (typeof window !== 'undefined') {
  window.matchMedia = jest.fn(() => ({
    matches: false,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

// Mock global variables for React Native
global.__DEV__ = true;

// Silence console warnings for cleaner test output
console.warn = jest.fn();
console.error = jest.fn();
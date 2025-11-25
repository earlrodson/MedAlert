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

// Mock react-native-css-interop BEFORE any imports
jest.mock('react-native-css-interop/src/runtime/web/color-scheme', () => ({
  getColorScheme: jest.fn(() => 'light'),
}), { virtual: true });

jest.mock('react-native-css-interop', () => ({
  getColorScheme: jest.fn(() => 'light'),
  useColorScheme: jest.fn(() => 'light'),
}), { virtual: true });

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: jest.fn((obj) => obj.web || obj.default),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667 })),
  },
  PixelRatio: {
    get: jest.fn(() => 2),
  },
  StatusBar: {
    setBarStyle: jest.fn(),
    setHidden: jest.fn(),
  },
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openURL: jest.fn(),
  },
}));

// Mock AsyncStorage
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
jest.mock('nativewind', () => ({
  create: jest.fn((component) => component),
  useColorScheme: jest.fn(() => ({ colorScheme: 'light' })),
  styled: jest.fn((component) => component),
}));

// Mock @rn-primitives/slot to prevent JSX parsing issues
jest.mock('@rn-primitives/slot', () => ({
  Slot: jest.fn(({ children, ...props }) => children),
  Root: jest.fn(({ children, ...props }) => children),
}), { virtual: true });

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

// Mock Lucide icons as simple components
jest.mock('lucide-react-native', () => ({
  Pill: ({ size, color, ...props }) => 'Pill',
  Calendar: ({ size, color, ...props }) => 'Calendar',
  Clock: ({ size, color, ...props }) => 'Clock',
  Bell: ({ size, color, ...props }) => 'Bell',
  Settings: ({ size, color, ...props }) => 'Settings',
  User: ({ size, color, ...props }) => 'User',
  Home: ({ size, color, ...props }) => 'Home',
  Plus: ({ size, color, ...props }) => 'Plus',
  X: ({ size, color, ...props }) => 'X',
  Check: ({ size, color, ...props }) => 'Check',
  ChevronRight: ({ size, color, ...props }) => 'ChevronRight',
  Menu: ({ size, color, ...props }) => 'Menu',
  Moon: ({ size, color, ...props }) => 'Moon',
  Sun: ({ size, color, ...props }) => 'Sun',
  AlertCircle: ({ size, color, ...props }) => 'AlertCircle',
}));

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
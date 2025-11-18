// Basic test setup for MedAlert testing

// Global test timeout
jest.setTimeout(10000);

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve({
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
    closeAsync: jest.fn(),
    withTransactionAsync: jest.fn(),
  })),
}));

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
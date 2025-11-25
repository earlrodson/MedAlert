// Pre-setup file for React Native web compatibility
// This runs before any test files are loaded

// Mock react-native-css-interop modules immediately to prevent getColorScheme errors
jest.mock('react-native-css-interop/src/runtime/web/color-scheme', () => ({
  getColorScheme: jest.fn(() => 'light'),
}), { virtual: true });

jest.mock('react-native-css-interop/src/runtime/web/api', () => ({}), { virtual: true });

jest.mock('react-native-css-interop/src/runtime/api', () => ({}), { virtual: true });

jest.mock('react-native-css-interop/src/runtime/wrap-jsx', () => ({}), { virtual: true });

jest.mock('react-native-css-interop/src/runtime/jsx-runtime', () => ({
  ...require('react/jsx-runtime'),
  getColorScheme: jest.fn(() => 'light'),
}), { virtual: true });

// Mock the main module as well
jest.mock('react-native-css-interop', () => ({
  getColorScheme: jest.fn(() => 'light'),
  useColorScheme: jest.fn(() => 'light'),
}), { virtual: true });

console.log('🔧 React Native CSS Interop mocks loaded');
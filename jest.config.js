module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test-setup.js'],
  setupFiles: ['<rootDir>/test-pre-setup.js'],
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/babel.config.js',
    '!**/jest.setup.js',
    '!**/test-setup.js',
    '!**/metro.config.js'
  ],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/$1',
    '^@/(.*)$': '<rootDir>/$1',
    'react-native-css-interop/src/runtime/web/color-scheme': '<rootDir>/mocks/react-native-css-interop-mock.js',
    'react-native-css-interop/src/runtime/web/api': '<rootDir>/mocks/react-native-css-interop-mock.js',
    'react-native-css-interop/src/runtime/api': '<rootDir>/mocks/react-native-css-interop-mock.js',
    'react-native-css-interop/src/runtime/wrap-jsx': '<rootDir>/mocks/react-native-css-interop-mock.js',
    'react-native-css-interop/src/runtime/jsx-runtime': '<rootDir>/mocks/react-native-css-interop-mock.js',
    'react-native-css-interop': '<rootDir>/mocks/react-native-css-interop-mock.js',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@/components/ui/(.*)$': '<rootDir>/mocks/ui-components-mock.js'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  maxWorkers: 1,
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|expo|@expo|react-native-web|@rn-primitives|lucide-react-native|react-native-css-interop|nativewind)/)'
  ],
};
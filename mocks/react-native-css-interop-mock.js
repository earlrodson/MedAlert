// Mock for react-native-css-interop to fix web compatibility issues
const React = require('react');

const getColorScheme = jest.fn(() => 'light');
const useColorScheme = jest.fn(() => 'light');

module.exports = {
  getColorScheme,
  useColorScheme,
  default: {
    getColorScheme,
    useColorScheme,
  },
  // Forward React's JSX runtime to prevent JSX errors
  jsx: React.jsx,
  jsxs: React.jsxs,
  Fragment: React.Fragment,
};
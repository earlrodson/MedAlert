// Mock for UI components
const createMockComponent = (name) => {
  const MockComponent = ({ children, testID, className, ...props }) => {
    const React = require('react');
    return React.createElement('div', {
      'data-testid': testID || `mock-${name.toLowerCase()}`,
      'data-component': name,
      className: className || '',
      ...props
    }, children);
  };
  MockComponent.displayName = `Mock${name}`;
  return MockComponent;
};

const Badge = ({ children, variant, testID, ...props }) => {
  const React = require('react');
  return React.createElement('div', {
    'data-testid': testID || 'badge',
    'data-variant': variant || 'default',
    'data-component': 'Badge',
    ...props
  }, children);
};
Badge.displayName = 'Badge';

const Card = ({ children, className, testID, ...props }) => {
  const React = require('react');
  return React.createElement('div', {
    'data-testid': testID || 'card',
    'data-component': 'Card',
    className: className || '',
    ...props
  }, children);
};
Card.displayName = 'Card';

module.exports = {
  Badge,
  Card,
  Button: createMockComponent('Button'),
  Input: createMockComponent('Input'),
  Label: createMockComponent('Label'),
  Switch: createMockComponent('Switch'),
  Checkbox: createMockComponent('Checkbox'),
  RadioGroup: createMockComponent('RadioGroup'),
  Select: createMockComponent('Select'),
  Textarea: createMockComponent('Textarea'),
  Separator: createMockComponent('Separator'),
  Dialog: createMockComponent('Dialog'),
  Popover: createMockComponent('Popover'),
  Toast: createMockComponent('Toast'),
  Progress: createMockComponent('Progress'),
  Alert: createMockComponent('Alert'),
  Avatar: createMockComponent('Avatar'),
};
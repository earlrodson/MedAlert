// Mock @rn-primitives/slot to prevent JSX parsing issues
const React = require('react');

const Slot = ({ children, ...props }) => {
  return React.createElement(React.Fragment, props, children);
};

const Root = ({ children, ...props }) => {
  return React.createElement(React.Fragment, props, children);
};

module.exports = {
  Slot,
  Root,
  default: Slot,
};
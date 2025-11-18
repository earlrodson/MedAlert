# Testing Guide for MedAlert

This document provides comprehensive information about the test suite for the MedAlert medication management application.

## Overview

The MedAlert test suite is built using Jest and React Native Testing Library to provide comprehensive testing coverage for the medication management application. The test suite includes:

- Unit tests for utility functions
- Integration tests for database operations
- Component tests for React Native components
- Navigation and routing tests

## Test Structure

```
__tests__/
├── lib/                          # Library/Utility tests
│   ├── database.test.ts         # Database functionality tests
│   ├── time-utils.test.ts       # Time utility functions tests
│   └── utils.test.ts            # General utility functions tests
└── components/                   # Component tests
    ├── bottom-navigation.test.tsx # Bottom navigation component tests
    └── current-medications.test.tsx # Current medications component tests
```

## Running Tests

### Available Scripts

The following pnpm scripts are available for running tests:

```bash
# Run all tests
pnpm test

# Run tests in watch mode (for development)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests in CI mode (no watch, full coverage)
pnpm test:ci
```

### Running Specific Tests

To run specific test files or patterns:

```bash
# Run specific test file
pnpm test -- --testPathPatterns=__tests__/lib/utils.test.ts

# Run tests matching a pattern
pnpm test -- --testNamePattern="should parse"

# Run tests in a specific directory
pnpm test -- __tests__/lib/
```

## Configuration

### Jest Configuration

The test suite is configured using `jest.config.js` with the following key settings:

- **Preset**: `react-native` - Uses React Native preset for proper component testing
- **Test Environment**: `node` - Uses Node.js environment for stability
- **Setup Files**: `test-setup.js` - Contains global test setup and mocks
- **Transform**: Babel transformation for TypeScript and JSX files
- **Module Name Mapping**: Path aliases support (`~` points to root directory)

### Babel Configuration

The `babel.config.js` file includes special test environment configuration to ensure proper transpilation of test files.

## Test Coverage Areas

### 1. Database Tests (`__tests__/lib/database.test.ts`)

**Coverage**: Database operations and data management

**Test Scenarios**:
- Database initialization and seeding
- CRUD operations for medications (Create, Read, Update, Delete)
- Date-based medication queries
- Medication status tracking
- Error handling and edge cases
- Data consistency and integrity

**Key Features Tested**:
- Web storage vs SQLite platform detection
- Automatic data seeding
- Date filtering for active medications
- Status update functionality
- Data validation and error handling

### 2. Utility Functions Tests

#### Time Utils (`__tests__/lib/time-utils.test.ts`)

**Coverage**: Time parsing, formatting, and calculation utilities

**Test Scenarios**:
- Time string parsing (12-hour and 24-hour formats)
- Time formatting and display
- Time calculations (minutes until, time differences)
- Time validation and error handling
- Current time operations

#### General Utils (`__tests__/lib/utils.test.ts`)

**Coverage**: Common utility functions

**Test Scenarios**:
- CSS class name merging (`cn` function)
- Time of day detection (`getTimeOfDay` function)
- Input validation and edge cases

### 3. Component Tests

#### Bottom Navigation (`__tests__/components/bottom-navigation.test.tsx`)

**Coverage**: Navigation component functionality

**Test Scenarios**:
- Navigation item rendering
- Active route highlighting
- Navigation behavior and routing
- Theme support (light/dark modes)
- Button states and interactions

#### Current Medications (`__tests__/components/current-medications.test.tsx`)

**Coverage**: Medication display and interaction component

**Test Scenarios**:
- Loading states and error handling
- Empty state display
- Medication list rendering
- Status-based styling
- Medication taken interaction
- Time-based medication categorization

## Mock Strategy

The test suite uses comprehensive mocking to isolate components and functions:

### External Libraries Mocked

1. **Expo Modules**:
   - `expo-sqlite` - Database operations
   - `expo-router` - Navigation functionality
   - `expo-notifications` - Notification handling
   - `expo-secure-store` - Secure storage

2. **React Native Libraries**:
   - `@react-native-async-storage/async-storage` - Local storage
   - `react-native-reanimated` - Animations
   - `react-native-gesture-handler` - Gesture handling

3. **UI Libraries**:
   - `nativewind` - Tailwind CSS for React Native
   - `lucide-react-native` - Icon components
   - `@rn-primitives/*` - UI component primitives

4. **Authentication**:
   - `@clerk/clerk-expo` - User authentication and management

### Component Mocking Strategy

- **Shallow Mocking**: UI components are mocked to render their basic structure
- **Function Mocking**: Provider hooks are mocked to return predictable data
- **Theme Mocking**: Theme system is mocked to provide consistent styling data

## Best Practices

### Writing New Tests

1. **Test Naming**: Use descriptive test names that explain the scenario
   ```typescript
   it('should parse 24-hour time format correctly')
   ```

2. **Test Structure**: Follow the Arrange-Act-Assert pattern
   ```typescript
   // Arrange
   const input = '14:30';

   // Act
   const result = TimeUtils.parseTime(input);

   // Assert
   expect(result.success).toBe(true);
   expect(result.hour24).toBe(14);
   ```

3. **Mock Data**: Use consistent mock data structures
   ```typescript
   const mockMedication: MedicationStatusInfo = {
     medicationId: '1',
     name: 'Lisinopril',
     dosage: '10mg',
     // ... rest of properties
   };
   ```

### Test Organization

- **Group Related Tests**: Use `describe` blocks to group related test cases
- **Use beforeEach**: Clean up mock state between tests
- **Clear Mocks**: Reset mocks after each test to avoid interference

### Coverage Goals

- **Target Coverage**: Aim for >80% code coverage
- **Critical Paths**: Ensure 100% coverage for critical business logic
- **Edge Cases**: Test error conditions and edge cases thoroughly

## Troubleshooting

### Common Issues

1. **Module Resolution Errors**:
   - Ensure `moduleNameMapper` is configured correctly
   - Check Babel configuration for test environment

2. **Import Errors**:
   - Verify mock configurations in `test-setup.js`
   - Check that all dependencies are properly mocked

3. **Async Test Timeouts**:
   - Increase timeout for complex async operations
   - Use proper async/await patterns

4. **React Native Component Issues**:
   - Ensure proper mocking of React Native modules
   - Check that component props are correctly typed

### Debugging Tests

1. **Use `console.log`**: For debugging test failures
2. **Check Mock Calls**: Verify mock functions are called correctly
3. **Inspect Rendered Output**: Use `debug()` method from React Native Testing Library
4. **Check Network/DB Calls**: Verify that mocked functions return expected data

## Continuous Integration

The test suite is designed to run in CI/CD environments:

- **No Watch Mode**: `pnpm test:ci` runs tests without watch mode
- **Coverage Reports**: Generates coverage reports for quality metrics
- **Exit Codes**: Proper exit codes for build failures

## Future Enhancements

Planned improvements to the test suite:

1. **E2E Testing**: Add end-to-end tests for critical user flows
2. **Visual Regression**: Add visual testing for UI components
3. **Performance Testing**: Add performance benchmarks
4. **Accessibility Testing**: Add accessibility compliance tests
5. **Integration Testing**: Add more comprehensive integration tests

## Contributing

When contributing new tests:

1. Follow existing test patterns and conventions
2. Ensure new tests provide meaningful coverage
3. Update documentation for new test areas
4. Run full test suite before submitting changes
5. Maintain or improve overall coverage percentage

## Conclusion

This test suite provides a solid foundation for maintaining code quality and reliability in the MedAlert application. Regular testing helps catch bugs early, ensures proper functionality, and facilitates safe refactoring and feature development.
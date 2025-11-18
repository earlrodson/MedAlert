// Mock expo-sqlite for web platform
// This prevents the bundler from trying to load the actual expo-sqlite module
// which requires WASM files that don't exist in the web build

const mockSQLite = {
  openDatabaseAsync: () => {
    throw new Error('SQLite is not available on web platform. Use web storage instead.');
  },
};

module.exports = mockSQLite;

// Mock expo-sqlite for web platform
// This prevents the bundler from trying to load the actual expo-sqlite module
// which requires WASM files that don't exist in the web build

const mockSQLite = {
  openDatabaseAsync: () => {
    throw new Error('SQLite is not available on web platform. Use web storage instead.');
  },
  // Add all other expo-sqlite exports that might be imported
  default: {
    openDatabaseAsync: () => {
      throw new Error('SQLite is not available on web platform. Use web storage instead.');
    },
  },
  // Mock common SQLite constants that might be imported
  SQLITE_OK: 0,
  SQLITE_ERROR: 1,
  SQLITE_INTERNAL: 2,
  SQLITE_PERM: 3,
  SQLITE_ABORT: 4,
  SQLITE_BUSY: 5,
  SQLITE_LOCKED: 6,
  SQLITE_NOMEM: 7,
  SQLITE_READONLY: 8,
  SQLITE_INTERRUPT: 9,
  SQLITE_IOERR: 10,
  SQLITE_CORRUPT: 11,
  SQLITE_NOTFOUND: 12,
  SQLITE_FULL: 13,
  SQLITE_CANTOPEN: 14,
  SQLITE_PROTOCOL: 15,
  SQLITE_EMPTY: 16,
  SQLITE_SCHEMA: 17,
  SQLITE_TOOBIG: 18,
  SQLITE_CONSTRAINT: 19,
  SQLITE_MISMATCH: 20,
  SQLITE_MISUSE: 21,
  SQLITE_NOLFS: 22,
  SQLITE_AUTH: 23,
  SQLITE_FORMAT: 24,
  SQLITE_RANGE: 25,
  SQLITE_NOTADB: 26,
  SQLITE_NOTICE: 27,
  SQLITE_WARNING: 28,
  SQLITE_ROW: 100,
  SQLITE_DONE: 101,
  SQLITE_INTEGER: 1,
  SQLITE_FLOAT: 2,
  SQLITE_TEXT: 3,
  SQLITE_BLOB: 4,
  SQLITE_NULL: 5,
};

module.exports = mockSQLite;

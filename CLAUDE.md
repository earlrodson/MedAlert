# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
pnpm dev

# Platform-specific starts
pnpm android    # Start with Android emulator
pnpm ios        # Start with iOS simulator
pnpm web        # Start in web browser

# Clean build artifacts
pnpm clean

# Testing commands
pnpm test              # Run all tests
pnpm test:watch        # Run tests in watch mode
pnpm test:coverage     # Run tests with coverage report
pnpm test:ci          # Run tests in CI mode
```

## Project Architecture

### Tech Stack
- **Framework**: React Native with Expo Router for file-based routing
- **Authentication**: Clerk (OAuth providers: Apple, GitHub, Google)
- **Database**: SQLite (expo-sqlite) with localStorage web fallback via `lib/database.ts`
- **Styling**: Tailwind CSS via NativeWind, React Native Reusables UI components
- **Notifications**: Expo Notifications for medication reminders

### Key Architecture Patterns

#### Database Abstraction
- **Dual storage strategy**: Uses SQLite on native platforms, localStorage web fallback on web
- **Platform detection**: Handles platform-specific database loading in `lib/database.ts`
- **Schema management**: Automatic database migration and seeding with sample data

#### Authentication Flow
- **Protected routes**: Clerk handles authentication state with protected (main) and public (auth) routes
- **Route structure**:
  - `app/(main)/*` - Authenticated main app screens
  - `app/(auth)/*` - Public authentication screens
  - Individual auth screens like `daily-schedule.tsx` for special flows

#### Component Organization
- **UI components**: Located in `components/ui/*` using React Native Reusables primitives
- **Feature components**: Domain-specific components in `components/*` (e.g., `medication-overview.tsx`)
- **Layout components**: Tab navigation in `app/(main)/_layout.tsx`, root layout in `app/_layout.tsx`

### Core Data Models

#### Medication Management
- **MedicationRecord**: Core medication entity with scheduling data
- **MedicationStatus**: Daily tracking of medication adherence
- **Date-based queries**: Supports complex date filtering for active medications

#### Navigation Structure
- **Tab-based navigation**: 5 main tabs (Home, Medications, Schedule, Daily Schedule, Profile)
- **Modal presentations**: Authentication screens use modal presentation patterns
- **Screen options**: Consistent animation and header management across routes

### Platform-Specific Considerations

#### Web Platform Support
- **Metro configuration**: Custom resolver in `metro.config.js` blocks expo-sqlite on web
- **Mock implementations**: Mock files handle SQLite imports that fail on web
- **LocalStorage fallback**: Complete web storage implementation for medication data

#### Development Setup
- **Environment variables**: Rename `.env.example` to `.env.local` with `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- **Development workflow**: Use `pnpm dev` with platform-specific shortcuts (i, a, w)
- **Clerk configuration**: Configure OAuth providers and email/password in Clerk dashboard
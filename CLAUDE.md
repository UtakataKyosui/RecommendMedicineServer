# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a medication reminder system with LINE Bot integration built with:
- **Backend**: Rust using Loco framework v0.15 (Rails-like web framework)
- **Frontend**: React 19 + TypeScript with Vite
- **Database**: Sea-ORM with SQLite/PostgreSQL support
- **Architecture**: Fullstack SaaS application with JWT authentication

## Development Commands

### Backend (Loco Framework)
```bash
# Start development server (listens on http://localhost:5150)
cd backend && cargo loco start

# Database operations
cargo loco db migrate              # Run database migrations
cargo loco db reset               # Reset database for testing
cargo loco generate scaffold <name> # Generate model, controller, and tests

# Testing
cargo test                         # Run all tests
cargo test --test <test_name>      # Run specific test file
```

### Frontend
```bash
# Development
cd frontend && npm run dev         # Start Vite dev server
npm run build                      # TypeScript compile + Vite build
npm run preview                    # Preview production build
npm run lint                       # ESLint checking

# Testing (based on devDependencies)
npx vitest                         # Unit tests (Vitest)
npx playwright test                # E2E tests (Playwright)
```

## Core Architecture

### Backend Structure (Loco Framework)
- **Controllers**: API endpoints in `src/controllers/` (auth, medicine, medication_schedule, medication_log, webhook_line, reports, dashboard)
- **Models**: Database entities and business logic in `src/models/`
- **Workers**: Background job processors (notification_worker, report_generator, downloader)
- **Tasks**: Scheduled background tasks (medication_reminder)
- **Migration**: Database schema management in `migration/src/`

### Key Domain Models
- **Users**: JWT auth + LINE Bot integration (`line_user_id`, `display_name`, `timezone`, `notification_enabled`)
- **Medicines**: Medication definitions
- **Medication Schedules**: Timing and frequency rules
- **Medication Logs**: Actual intake tracking

### Frontend Tech Stack
- **State**: TanStack Query (server state) + Zustand (client state)
- **UI**: Radix UI components + Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest + Testing Library + Playwright
- **Charts**: Recharts for analytics

### Background Processing
The app uses Loco's background worker system with:
- **NotificationWorker**: Sends LINE Bot medication reminders
- **ReportGeneratorWorker**: Creates analytics reports
- **MedicationReminderTask**: Scheduled reminder processing

### Testing Patterns
- **Backend**: Uses `insta` for snapshot testing, `serial_test` for database tests
- **Snapshots**: Test response validation stored in `tests/*/snapshots/`
- **Database**: Automatic migration and reset capabilities for testing
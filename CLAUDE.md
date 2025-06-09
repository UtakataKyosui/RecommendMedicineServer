# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with this medication reminder system repository.

## Project Overview

This is a **medication reminder system with LINE Bot integration** built as a fullstack SaaS application using the **Loco.rs framework**:

- **Backend**: Rust using [**Loco framework v0.15**](https://loco.rs) - "Rust on Rails" web framework
- **Frontend**: React 19 + TypeScript with Vite
- **Database**: Sea-ORM with SQLite/PostgreSQL support
- **Integration**: LINE Bot API for push notifications
- **Architecture**: Fullstack SaaS with JWT authentication & background job processing

### 🚂 About Loco.rs Framework

**Loco** is a productivity-first Rust web framework strongly inspired by Ruby on Rails, designed as "The One Person Framework" for building full-stack applications quickly:

#### Core Philosophy
- **Convention Over Configuration**: Sensible defaults to reduce boilerplate
- **Rails-inspired MVC**: Fat models, slim controllers approach
- **Command-line Driven**: Generators for rapid development
- **Infrastructure Ready**: Built-in authentication, background jobs, mailers
- **Single Binary Deployment**: Compile to one executable

#### Key Features
- **🏗️ Scaffolding**: `cargo loco generate scaffold` for CRUD operations
- **🔐 Authentication**: Built-in JWT auth with user management
- **📧 Mailers**: Email sending with templates
- **⚙️ Background Jobs**: Redis-backed queue system with workers
- **📋 Tasks**: Business-oriented command-line tasks
- **🗄️ Migrations**: Database schema management with Sea-ORM
- **🧪 Testing**: Built-in testing patterns and utilities

#### Performance & Architecture
- **Built on Axum + Tokio**: High-performance async runtime
- **Sea-ORM Integration**: Type-safe database operations
- **~30,000 req/s**: On typical M1 MacBook with database access
- **Concurrency Models**: Async in-process (Tokio) or threaded workers

## 🎯 Current Implementation Status

### ✅ Completed
- Project scaffold and basic structure
- Database migrations (users, medicines, medication_schedules, medication_logs)
- Basic controllers (scaffold-generated)
- Frontend project setup with React 19
- Background worker foundation

### 🚧 In Progress (Active Issues)
- Core API implementation (medicines, schedules, logs)
- LINE Bot Webhook integration
- Background notification system (Loco 0.15 compatibility)
- Frontend component implementation

### ❌ Pending
- Complete API testing
- Advanced reporting features
- Production deployment setup
- Comprehensive testing suite

## Development Environment Setup

### 🐳 DevContainer (Recommended)

This project includes a comprehensive DevContainer setup via Git Submodule for consistent development environments:

```bash
# Clone repository with submodules
git clone --recurse-submodules <repository-url>
cd medication-reminder-system

# If already cloned, initialize submodules
git submodule update --init --recursive

# Open in VS Code with DevContainer
code .
# VS Code will prompt to "Reopen in Container"
```

**DevContainer Features:**
- ✅ **Rust toolchain** (latest stable + cargo components)
- ✅ **Node.js 20** with npm/pnpm for frontend
- ✅ **PostgreSQL** database service
- ✅ **Redis** for background job queue
- ✅ **VS Code extensions** (rust-analyzer, Tailwind CSS, etc.)
- ✅ **Git configuration** preservation
- ✅ **Port forwarding** (5150 for backend, 5173 for frontend)

**Benefits:**
- **Zero setup time** for new developers
- **Consistent environment** across all machines
- **Automatic tool installation** and configuration
- **Isolated development** without polluting host OS

### 🔧 Manual Setup (Alternative)

If not using DevContainer, install these dependencies:

**Manual Setup Requirements:**
```bash
# Install Rust (if not using DevContainer)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Loco CLI (required for code generation)
cargo install loco
cargo install sea-orm-cli    # Database management

# Install required components
rustup component add clippy rustfmt
cargo install cargo-watch    # For file watching during development
```

**Frontend Requirements:**
```bash
# Install Node.js 20+ (use nvm/fnm for version management)
curl -fsSL https://fnm.vercel.app/install | bash
fnm use 20

# Install pnpm (recommended) or npm
npm install -g pnpm
```

**Database Setup:**
```bash
# Option 1: SQLite (for local development)
# No installation needed, file-based database

# Option 2: PostgreSQL (recommended for production-like development)
# On macOS:
brew install postgresql@15
brew services start postgresql@15

# On Ubuntu/Debian:
sudo apt update && sudo apt install postgresql postgresql-contrib

# On Windows:
# Download from: https://www.postgresql.org/download/windows/
```

**Redis Setup (for background jobs):**
```bash
# On macOS:
brew install redis
brew services start redis

# On Ubuntu/Debian:
sudo apt install redis-server
sudo systemctl start redis-server

# On Windows:
# Use WSL2 or Docker
docker run -d --name redis -p 6379:6379 redis:alpine
```

## Development Commands

### Backend (Loco Framework)
```bash
# Development server
cd backend && cargo loco start              # Starts on http://localhost:5150

# Database operations
cargo loco db migrate                       # Run pending migrations
cargo loco db reset                         # Reset database (dev only)
cargo loco db status                        # Check migration status
cargo loco generate scaffold <name>         # Generate CRUD scaffold

# Background tasks
cargo loco task                             # List available tasks
cargo loco task medication_reminder         # Run reminder task manually

# Testing
cargo test                                  # Run all tests
cargo test --test integration               # Run integration tests
cargo test -- --nocapture                  # Show test output

# Code quality
cargo clippy                                # Linting
cargo fmt                                   # Code formatting
cargo check                                 # Type checking
```

### Frontend (React + TypeScript)
```bash
cd frontend

# Development
npm run dev                                 # Vite dev server (http://localhost:5173)
npm run build                               # Production build
npm run preview                             # Preview production build
npm run lint                                # ESLint checking
npm run lint:fix                            # Auto-fix ESLint issues

# Testing
npm run test                                # Unit tests (Vitest)
npm run test:ui                             # Vitest UI mode
npm run test:coverage                       # Coverage report
npm run e2e                                 # E2E tests (Playwright)
npm run e2e:ui                              # Playwright UI mode

# Dependencies
npm install                                 # Install dependencies
npm audit                                   # Security audit
npm update                                  # Update dependencies
```

## Core Architecture

### Backend Structure (Loco Framework)
```
backend/src/
├── controllers/
│   ├── auth.rs                    # JWT authentication
│   ├── medicine.rs                # Medication CRUD ✅
│   ├── medication_schedules.rs    # Schedule management 🚧
│   ├── medication_logs.rs         # Intake logging 🚧
│   ├── webhook/
│   │   └── line.rs               # LINE Bot webhook 🚧
│   ├── reports.rs                # Analytics & reports ❌
│   └── dashboard.rs              # Dashboard API ❌
├── models/
│   ├── users.rs                  # User model + LINE integration 🚧
│   ├── medicines.rs              # Medication definitions ✅
│   ├── medication_schedules.rs   # Timing rules ✅
│   └── medication_logs.rs        # Intake tracking ✅
├── workers/
│   ├── notification_worker.rs    # LINE Bot notifications 🚧
│   ├── report_generator.rs       # Background reports ❌
│   └── downloader.rs             # File processing ❌
├── tasks/
│   └── medication_reminder.rs    # Scheduled reminders 🚧
└── migration/src/                # Database schema
```

### Key Domain Models & Database Schema

#### Users Table
```sql
- id: Primary key
- email: User email (JWT auth)
- password: Hashed password
- line_user_id: LINE Bot user ID (nullable)
- display_name: Display name for LINE
- timezone: User timezone (default: Asia/Tokyo)
- notification_enabled: Push notification preference
- created_at, updated_at: Timestamps
```

#### Medicines Table
```sql
- id: Primary key
- user_id: Foreign key to users
- name: Medication name
- description: Optional description
- dosage: Dosage amount (e.g., "1")
- unit: Dosage unit (e.g., "tablet", "ml")
- active: Whether medication is active
- created_at, updated_at: Timestamps
```

#### Medication Schedules Table
```sql
- id: Primary key
- medicine_id: Foreign key to medicines
- time: Time of day (e.g., "08:00:00")
- frequency: How often (e.g., "daily", "weekly")
- days_of_week: JSON array for custom schedules
- active: Whether schedule is active
- created_at, updated_at: Timestamps
```

#### Medication Logs Table
```sql
- id: Primary key
- medicine_id: Foreign key to medicines
- scheduled_time: When medication was scheduled
- taken_time: When actually taken (nullable)
- status: "pending", "completed", "missed", "skipped"
- notes: Optional user notes
- created_at, updated_at: Timestamps
```

### Frontend Tech Stack & Structure
```
frontend/src/
├── components/
│   ├── ui/                       # Radix UI base components
│   ├── Dashboard.tsx             # Main dashboard 🚧
│   ├── medicine/                 # Medicine management 🚧
│   ├── MedicationLogs.tsx        # Log viewing 🚧
│   ├── ScheduleManagement.tsx    # Schedule setup 🚧
│   └── Settings.tsx              # User settings 🚧
├── store/                        # Jotai atoms & TanStack Query
├── lib/
│   ├── api.ts                    # Axios API client
│   └── utils.ts                  # Utility functions
└── types/                        # TypeScript definitions
```

**Key Dependencies:**
- **State Management**: TanStack Query (server state) + Jotai (client state)
- **UI Components**: Radix UI + Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest + Testing Library + Playwright
- **Charts**: Recharts for analytics
- **Date/Time**: date-fns for date manipulation

### Background Processing System

The app uses Loco's background worker system for:
- **NotificationWorker**: Sends LINE Bot medication reminders
- **ReportGeneratorWorker**: Creates periodic analytics reports
- **MedicationReminderTask**: Scheduled task that checks for due medications

**Current Issue**: Loco 0.15 compatibility fix needed for queue access pattern.

## API Endpoints

### Authentication
```
POST /auth/login      # User login
POST /auth/register   # User registration
POST /auth/refresh    # Token refresh
```

### Medicines
```
GET    /api/medicines/          # List user's medicines
POST   /api/medicines/          # Create medicine
GET    /api/medicines/{id}      # Get specific medicine
PUT    /api/medicines/{id}      # Update medicine
DELETE /api/medicines/{id}      # Delete medicine
```

### Schedules (Planned)
```
GET    /api/schedules/          # List schedules
POST   /api/schedules/          # Create schedule
PUT    /api/schedules/{id}      # Update schedule
DELETE /api/schedules/{id}      # Delete schedule
```

### Logs (Planned)
```
GET    /api/logs/               # List medication logs
POST   /api/logs/               # Create log entry
PUT    /api/logs/{id}           # Update log entry
GET    /api/logs/stats          # Get adherence statistics
```

### LINE Bot
```
POST   /webhook/line            # LINE Bot webhook endpoint
```

### DevContainer Environment Variables

The DevContainer automatically configures these environment variables:

**Pre-configured in DevContainer:**
```bash
# Database (PostgreSQL service in container)
DATABASE_URL=postgresql://postgres:password@db:5432/medication_reminder

# Redis (Redis service in container)
REDIS_URL=redis://redis:6379

# Development URLs
VITE_API_BASE_URL=http://localhost:5150
```

**You still need to configure:**
```bash
# JWT Secret (generate a secure key)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# LINE Bot credentials (from LINE Developers Console)
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token

# Optional: Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Quick Start with DevContainer:**
1. **Open in DevContainer:**
   ```bash
   code .  # VS Code will detect .devcontainer and prompt
   ```

2. **Initialize database:**
   ```bash
   cd backend
   cargo loco db migrate
   ```

3. **Start development servers:**
   ```bash
   # Terminal 1: Backend
   cd backend && cargo loco start

   # Terminal 2: Frontend  
   cd frontend && npm run dev
   ```

4. **Access applications:**
   - Backend API: http://localhost:5150
   - Frontend App: http://localhost:5173
   - Database: PostgreSQL on port 5432
   - Redis: Available on port 6379

### 🐳 DevContainer Services

The DevContainer includes these containerized services:

```yaml
# Automatically started services
services:
  - postgresql:15      # Primary database
  - redis:alpine       # Background job queue
  - app (main)         # Development container with all tools
```

**Service Health Checks:**
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check Redis connection  
redis-cli ping

# Check all services
docker-compose ps
```

### 🔄 DevContainer Maintenance

**Updating the DevContainer:**
```bash
# Update submodule to latest version
git submodule update --remote .devcontainer

# Rebuild container with updates
# VS Code: Cmd/Ctrl + Shift + P -> "Dev Containers: Rebuild Container"
```

**Troubleshooting DevContainer:**
```bash
# View container logs
docker-compose logs app

# Reset container completely
# VS Code: "Dev Containers: Rebuild Container Without Cache"

# Update submodule manually
cd .devcontainer
git pull origin main
cd ..
git add .devcontainer
git commit -m "Update DevContainer"
```

## Environment Configuration

### Required Environment Variables

**Backend (.env)**
```bash
# Database
DATABASE_URL=sqlite://medication_reminder.db
# or for PostgreSQL:
# DATABASE_URL=postgres://user:password@localhost/medication_reminder

# JWT Authentication
JWT_SECRET=your-secret-key-here

# LINE Bot Integration
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token

# Server Configuration
RUST_LOG=info                           # Logging level
LOCO_ENVIRONMENT=development             # Environment mode
```

**Frontend (.env.local)**
```bash
VITE_API_BASE_URL=http://localhost:5150
VITE_APP_NAME="Medication Reminder"
```

### LINE Bot Setup

1. **Create LINE Bot**: https://developers.line.biz/console/
2. **Get Channel Secret & Access Token**: From Basic Settings
3. **Set Webhook URL**: `https://yourdomain.com/webhook/line`
4. **Configure Events**: Message events, Follow/Unfollow events

## Testing Patterns

### Backend Testing
- **Unit Tests**: Model logic and utility functions
- **Integration Tests**: API endpoints with database
- **Snapshot Tests**: Uses `insta` crate for response validation
- **Database Tests**: Uses `serial_test` for isolation

```bash
# Run specific test categories
cargo test models::                      # Model tests
cargo test controllers::                 # Controller tests
cargo test --test integration            # Integration tests
```

### Frontend Testing
- **Unit Tests**: Component logic with Vitest
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright for user workflows
- **Visual Tests**: Storybook (planned)

```bash
# Run specific test types
npm run test:unit                        # Vitest unit tests
npm run test:components                  # Component tests
npm run e2e:chrome                       # E2E in Chrome
npm run e2e:firefox                      # E2E in Firefox
```

## Common Development Tasks

### 🐳 DevContainer-Specific Tasks

**Working with Services:**
```bash
# Restart database service
docker-compose restart db

# View service logs
docker-compose logs db redis

# Access database directly (bash in DevContainer)
psql $DATABASE_URL

# Access Redis CLI (bash in DevContainer)
redis-cli
```

**Container Management:**
```bash
# Check container resource usage
docker stats

# Access container shell (if needed)
docker-compose exec app bash

# View mounted volumes
docker-compose exec app df -h
```

### 🚂 Loco-Specific Development Tasks

**Using Loco Generators:**
```bash
# Generate a complete CRUD API for medicines
cargo loco generate scaffold medicine name:string dosage:string active:bool

# Generate model only
cargo loco generate model medication_schedule medicine_id:references time:time

# Generate controller with basic structure
cargo loco generate controller reports

# Generate background worker
cargo loco generate worker email_notification

# Generate task for business logic
cargo loco generate task daily_report
```

**Working with Models & Database:**
```bash
# Check current database schema
cargo loco db entities

# Create new migration manually
cargo loco generate migration add_index_to_medicines

# Rollback last migration (development only)
cargo loco db rollback

# Check model relationships in playground
cargo run --example playground
```

**Background Jobs & Tasks:**
```bash
# List all available tasks
cargo loco task

# Run business task with parameters
cargo loco task user_report format:json output:/tmp/report.json

# Start background worker for processing jobs
cargo loco worker

# Test worker in development
cargo loco worker --queue development
```

### Adding a New API Endpoint

1. **Generate scaffold** (if needed):
   ```bash
   cd backend && cargo loco generate scaffold new_model field1:string field2:int
   ```

2. **Update routes** in `src/app.rs`:
   ```rust
   .add_route(controllers::new_controller::routes())
   ```

3. **Run migration**:
   ```bash
   cargo loco db migrate
   ```

### Adding a New Frontend Component

1. **Create component** in `frontend/src/components/`
2. **Add route** (if needed) in `App.tsx`
3. **Update state management** in `store/`
4. **Add tests** in `__tests__/` or adjacent `.test.tsx`

### Setting up LINE Bot Integration

1. **Update user model** with LINE fields
2. **Implement webhook controller** in `controllers/webhook/line.rs`
3. **Configure signature verification**
4. **Test with LINE Bot Simulator**

### Common DevContainer Issues

**Container Won't Start:**
```bash
# Check Docker Desktop is running
docker ps

# Check for port conflicts
lsof -i :5150  # Backend port
lsof -i :5173  # Frontend port
lsof -i :5432  # PostgreSQL port

# Rebuild container from scratch
# VS Code: "Dev Containers: Rebuild Container Without Cache"
```

**Database Connection Issues:**
```bash
# Verify database service is running
docker-compose ps db

# Check database connection (bash syntax for DevContainer)
psql $DATABASE_URL -c "\dt"  # List tables

# Reset database if needed
cd backend
cargo loco db reset
cargo loco db migrate
```

**Performance Issues:**
```bash
# Check container resources
docker stats

# Optimize Docker Desktop settings:
# - Increase CPU/Memory allocation
# - Enable VirtioFS for macOS
# - Use WSL2 backend on Windows
```

**File Permission Issues (Linux/macOS):**
```bash
# Fix ownership in container
sudo chown -R $USER:$USER .

# Or use VS Code setting in devcontainer.json:
# "remoteUser": "vscode"
```

### DevContainer vs Manual Setup

| Feature | DevContainer | Manual Setup |
|---------|-------------|--------------|
| **Setup Time** | 5 minutes | 30-60 minutes |
| **Consistency** | ✅ Identical across machines | ❌ Varies by OS/versions |
| **Onboarding** | ✅ One-click start | ❌ Complex documentation |
| **Dependencies** | ✅ Auto-managed | ❌ Manual installation |
| **Database** | ✅ Containerized PostgreSQL | ❌ Local installation needed |
| **Redis** | ✅ Containerized | ❌ Local installation needed |
| **VS Code Setup** | ✅ Pre-configured extensions | ❌ Manual extension install |
| **Port Management** | ✅ Automatic forwarding | ❌ Manual configuration |
| **Isolation** | ✅ No host pollution | ❌ Installs on host system |

**When to use DevContainer:**
- ✅ **New team members** (fastest onboarding)
- ✅ **Cross-platform teams** (Windows, macOS, Linux)
- ✅ **CI/CD consistency** (same environment as production)
- ✅ **Complex dependencies** (multiple databases, services)

**When to use Manual Setup:**
- ✅ **Performance critical** (native vs containerized)
- ✅ **Docker restrictions** (corporate environments)
- ✅ **Existing local setup** (already configured)
- ✅ **Custom tool preferences** (different editors, shells)

## Troubleshooting

**Database Connection Errors**
```bash
# Check database status
cargo loco db status

# Reset and remigrate
cargo loco db reset
cargo loco db migrate
```

**Compilation Errors**
```bash
# Check for syntax issues
cargo check

# Fix common issues
cargo clippy --fix --allow-dirty
```

**Background Worker Issues**
```bash
# Check worker status
cargo loco task

# Run worker manually for debugging
cargo loco worker
```

### Common Frontend Issues

**Build Errors**
```bash
# Clear node_modules and reinstall (bash syntax)
rm -rf node_modules package-lock.json
npm install

# Check TypeScript issues
npx tsc --noEmit
```

**API Connection Issues**
```bash
# Verify backend is running
curl http://localhost:5150/_ping

# Check environment variables (bash syntax)
echo $VITE_API_BASE_URL
```

### LINE Bot Issues

**Webhook Verification Failures**
- Verify `LINE_CHANNEL_SECRET` is correct
- Check webhook URL is accessible
- Ensure HTTPS in production

**Message Sending Failures**
- Verify `LINE_CHANNEL_ACCESS_TOKEN` is valid
- Check user has not blocked the bot
- Verify message format matches LINE API spec

### Loco-Specific Issues

**Model Generation Problems**
```bash
# Regenerate entities after schema changes
cargo loco db entities

# Check migration status
cargo loco db status

# Manually apply specific migration
cargo loco db migrate --up-to <migration_name>
```

**Controller Registration Issues**
```bash
# Verify route registration in src/app.rs
cargo loco routes

# Check controller module exports
# Ensure controller is added to src/controllers/mod.rs
```

**Background Job Problems**
```bash
# Test Redis connection
redis-cli ping

# Check worker registration in src/app.rs
# Verify worker implements BackgroundWorker trait

# Test job enqueueing manually
cargo run --example test_worker
```

## Production Deployment

### Backend Deployment (Planned)
- **Docker**: Multi-stage build with cargo chef
- **Database**: PostgreSQL with connection pooling
- **Environment**: Railway, Fly.io, or AWS ECS
- **Monitoring**: Structured logging with tracing

### Frontend Deployment (Planned)
- **Static Hosting**: Vercel, Netlify, or CloudFlare Pages
- **CDN**: Automatic with most hosting providers
- **Environment**: Production environment variables

### Infrastructure (Planned)
- **Reverse Proxy**: nginx for static files
- **SSL/TLS**: Let's Encrypt or CloudFlare
- **Monitoring**: Health checks and error tracking
- **Backup**: Database backup strategy

## Development Workflow

### Git Workflow
1. Create feature branch from `main`
2. Implement feature with tests
3. Run full test suite
4. Create pull request
5. Code review and merge

### Issue Management
- Issues are tracked in GitHub Issues
- Labels: `priority: high/medium/low`, `backend`, `frontend`, etc.
- Milestones: `v1.0 - Core Features`, `v1.1 - UI Complete`, etc.

### Code Standards
- **Rust**: Follow `rustfmt` and `clippy` recommendations
- **TypeScript**: ESLint + Prettier configuration
- **Commits**: Conventional commit format preferred
- **Documentation**: Inline comments for complex logic

## Useful Resources

### Loco Framework Documentation
- **[Loco.rs Official Site](https://loco.rs/)** - Main framework website
- **[Loco Getting Started Guide](https://loco.rs/docs/getting-started/guide/)** - Comprehensive tutorial
- **[Loco API Documentation](https://docs.rs/loco-rs/)** - Rust API docs
- **[Loco GitHub Repository](https://github.com/loco-rs/loco)** - Source code and issues

### Core Dependencies
- **[Sea-ORM](https://www.sea-ql.org/SeaORM/)** - Database ORM
- **[Axum](https://docs.rs/axum/)** - Web framework (underlying Loco)
- **[Tokio](https://tokio.rs/)** - Async runtime
- **[Tower](https://docs.rs/tower/)** - Middleware framework

### Frontend & Integration
- **[LINE Bot API](https://developers.line.biz/en/docs/)** - LINE integration
- **[Radix UI](https://www.radix-ui.com/)** - UI components
- **[TanStack Query](https://tanstack.com/query/)** - Data fetching
- **[React 19 Docs](https://react.dev/)** - React framework

### Tools & Development
- **[GitHub CLI](https://cli.github.com/)** - Issue management
- **[Postman/Insomnia](https://insomnia.rest/)** - API testing
- **[LINE Bot Simulator](https://developers.line.biz/console/)** - Bot testing
- **[DevContainer Spec](https://containers.dev/)** - Container development

### Rust Ecosystem
- **[Cargo Book](https://doc.rust-lang.org/cargo/)** - Package manager
- **[Rustfmt](https://github.com/rust-lang/rustfmt)** - Code formatting
- **[Clippy](https://github.com/rust-lang/rust-clippy)** - Linting tool
- **[Crates.io](https://crates.io/)** - Package registry

## Performance Considerations

### Backend Optimization
- Database indexing on frequently queried fields
- Connection pooling for database
- Caching for static data
- Pagination for large datasets

### Frontend Optimization
- Code splitting with React.lazy
- Image optimization and lazy loading
- Bundle analysis and tree shaking
- Service workers for offline capability

# E2E Tests (End-to-End)

These tests follow the Prisma documentation pattern for integration testing:
https://www.prisma.io/docs/orm/prisma-client/testing/integration-testing

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+

## Setup

1. **Create the `.env.test` file** (copy from `example.env.test`):
   ```bash
   cp example.env.test .env.test
   ```

2. **Start the test database**:
   ```bash
   npm run test:e2e:setup
   ```

3. **Wait for the database to be ready** (a few seconds) and then **apply migrations**:
   ```bash
   # On Windows PowerShell, set the environment variable first:
   $env:DATABASE_URL="postgresql://prisma:prisma@localhost:5433/tests?schema=public"
   npm run test:e2e:migrate
   
   # Or on Linux/Mac:
   DATABASE_URL="postgresql://prisma:prisma@localhost:5433/tests?schema=public" npm run test:e2e:migrate
   ```

4. **Run the tests**:
   ```bash
   npm run test:e2e:run
   ```

## Available Scripts

- `npm run test:e2e:setup` - Starts Docker container with PostgreSQL
- `npm run test:e2e:teardown` - Stops and removes Docker container
- `npm run test:e2e:migrate` - Applies migrations to test database
- `npm run test:e2e:run` - Runs E2E tests

## Quick Start (Manual - Recommended)

To avoid conflicts with the production `.env`, the simplest way is to do it manually:

1. **Start the test database:**
   ```bash
   npm run test:e2e:setup
   ```

2. **Wait a few seconds** for the database to be ready

3. **Temporarily modify the `.env`** - add or change the line:
   ```
   DATABASE_URL=postgresql://prisma:prisma@localhost:5433/tests?schema=public
   ```

4. **Apply migrations:**
   ```bash
   npm run test:e2e:migrate
   ```

5. **Run the tests:**
   ```bash
   npm run test:e2e:run
   ```

6. **Restore the original `.env`** after the tests

**Note:** E2E tests work even if the migration fails (if tables already exist), but it is recommended to apply migrations correctly.

## Complete Flow

### Option 1: Helper Scripts (Recommended)

**Windows (PowerShell):**
```powershell
.\scripts\test-e2e.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/test-e2e.sh
./scripts/test-e2e.sh
```

### Option 2: Manual

```bash
# 1. Start database
npm run test:e2e:setup

# 2. Wait a few seconds for database to be ready

# 3. Apply migrations (set DATABASE_URL according to your OS)
# Windows PowerShell:
$env:DATABASE_URL="postgresql://prisma:prisma@localhost:5433/tests?schema=public"
npm run test:e2e:migrate

# Linux/Mac:
DATABASE_URL="postgresql://prisma:prisma@localhost:5433/tests?schema=public" npm run test:e2e:migrate

# 4. Run tests
npm run test:e2e:run

# 5. Cleanup (optional)
npm run test:e2e:teardown
```

## How It Works

1. **Docker Compose** creates an isolated PostgreSQL container on port `5433`
2. **Migrations** are applied to create tables
3. **Tests** are executed against the real database
4. **Automatic cleanup** happens in `beforeAll` and `afterAll` of each test suite

## Structure

- `docker-compose.test.yml` - Docker configuration for tests
- `setup.ts` - E2E test specific setup (loads .env.test)
- `reservation.e2e.test.ts` - E2E tests for reservations

## Notes

- The test database is completely isolated from development/production database
- Data is automatically cleaned before and after tests
- The container can be kept running between test executions for faster performance

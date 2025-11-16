# Testing Guide

Quick guide to run tests in this project.

## 🚀 Quick Start (Recommended)

### Unit & Route Tests (Easy - No Database Required)

```bash
npm test
```

That's it! These tests use mocks and don't need a database.

---

### E2E Tests (Use Helper Scripts - Recommended)

**Easy way:** Just double-click the script files!
- Windows: Double-click `scripts/test-e2e.ps1`
- Linux/Mac: Double-click `scripts/test-e2e.sh` (after making it executable)

**Or run from terminal:**

Windows (PowerShell):
```powershell
.\scripts\test-e2e.ps1
```

Linux/Mac:
```bash
chmod +x scripts/test-e2e.sh
./scripts/test-e2e.sh
```

The scripts automatically:
1. Start Docker container with PostgreSQL
2. Wait for database to be ready
3. Apply migrations
4. Run E2E tests
5. Wait for you to press Enter before closing

**First time setup:**
```bash
# Create .env.test file
cp example.env.test .env.test
```

---

## 📋 Available Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run unit and route tests (no database needed) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:e2e:run` | Run E2E tests (requires Docker) |
| `npm run test:integration` | Run integration tests (requires database) |
| `npm run test:all` | Run all tests |

---

## 🧪 Test Types

### Unit Tests
- **Location:** `src/__tests__/unit/`
- **Requires:** Nothing (uses mocks)
- **Run:** `npm test`

### Route Tests
- **Location:** `src/__tests__/routes/`
- **Requires:** Nothing (uses mocks)
- **Run:** `npm test`

### Integration Tests
- **Location:** `src/__tests__/integration/`
- **Requires:** PostgreSQL database running
- **Run:** `npm run test:integration`
- **Note:** Will skip if database is not available

### E2E Tests
- **Location:** `src/__tests__/e2e/`
- **Requires:** Docker and Docker Compose
- **Run:** Use helper scripts (recommended) or see manual steps below

---

## 🔧 Manual E2E Setup (If Scripts Don't Work)

### Prerequisites
1. Docker and Docker Compose installed
2. `.env.test` file created (copy from `example.env.test`)

### Steps

**1. Start test database:**
```bash
npm run test:e2e:setup
```

**2. Wait 10-15 seconds for database to be ready**

**3. Apply migrations:**

Windows PowerShell:
```powershell
$env:DATABASE_URL="postgresql://prisma:prisma@localhost:5433/tests?schema=public"
npm run test:e2e:migrate
```

Linux/Mac:
```bash
export DATABASE_URL="postgresql://prisma:prisma@localhost:5433/tests?schema=public"
npm run test:e2e:migrate
```

**4. Run tests:**
```bash
npm run test:e2e:run
```

**5. Cleanup (optional):**
```bash
npm run test:e2e:teardown
```

---

## 💡 Tips

- **Unit/Route tests:** Fast, no setup needed - use `npm test` anytime
- **E2E tests:** Use helper scripts - they handle everything automatically
- **Keep Docker running:** If you run E2E tests frequently, keep the container running between runs for faster execution
- **Database isolation:** E2E tests use port `5433` (separate from dev database on `5432`)

---

## 🐛 Troubleshooting

**E2E tests fail with "Can't reach database server":**
- Make sure Docker is running
- Run `npm run test:e2e:setup` first
- Wait a few seconds after starting the container

**Integration tests are skipped:**
- This is normal if database is not available
- They will run automatically when database is accessible

**Scripts don't work:**
- Make sure you're in the project root directory
- On Windows, run PowerShell as Administrator if needed
- On Linux/Mac, ensure script has execute permission: `chmod +x scripts/test-e2e.sh`


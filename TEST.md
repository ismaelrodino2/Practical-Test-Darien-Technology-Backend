# Testing Guide

## Quick Start

**Unit & Route Tests:**
```bash
pnpm test
```

**E2E Tests (Recommended - Use Helper Scripts - Double click on them):**

Windows:
```powershell
.\scripts\test-e2e.ps1
```

Linux/Mac:
```bash
chmod +x scripts/test-e2e.sh
./scripts/test-e2e.sh
```

First time: `cp example.env.test .env.test`

## Commands

- `pnpm test`: Unit and route tests (no database)
- `pnpm test:watch`: Watch mode
- `pnpm test:coverage`: Coverage report
- `pnpm test:e2e:run`: E2E tests (requires Docker)

## Manual E2E Setup

1. Start database: `pnpm test:e2e:setup`
2. Wait 10-15 seconds
3. Set `DATABASE_URL` and run migrations:
   ```bash
   # Windows
   $env:DATABASE_URL="postgresql://prisma:prisma@localhost:5433/tests?schema=public"
   pnpm test:e2e:migrate
   
   # Linux/Mac
   export DATABASE_URL="postgresql://prisma:prisma@localhost:5433/tests?schema=public"
   pnpm test:e2e:migrate
   ```
4. Run tests: `pnpm test:e2e:run`
5. Cleanup: `pnpm test:e2e:teardown`

## Troubleshooting

- **E2E fails:** Ensure Docker is running and wait a few seconds after setup
- **Integration tests skipped:** Normal if database unavailable


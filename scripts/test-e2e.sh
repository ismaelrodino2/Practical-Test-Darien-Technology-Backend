#!/bin/bash
# Bash script to run E2E tests on Linux/Mac
# Usage: ./scripts/test-e2e.sh

echo "🚀 Setting up E2E test environment..."

# 1. Start Docker
echo "📦 Starting Docker container..."
npm run test:e2e:setup

# 2. Wait for database to be ready
echo "⏳ Waiting for database to be ready (10 seconds)..."
sleep 10

# 3. Apply migrations
echo "🗄️  Applying migrations..."
export DATABASE_URL="postgresql://prisma:prisma@localhost:5433/tests?schema=public"
npm run test:e2e:migrate

# 4. Run tests
echo "🧪 Running E2E tests..."
npm run test:e2e:run

echo ""
echo "✅ E2E tests completed!"
echo ""
echo "Press Enter to close..."
read


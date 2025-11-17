#!/bin/bash
# Bash script to run E2E tests on Linux/Mac
# Usage: ./scripts/test-e2e.sh

# Ensure we're in the project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT" || exit

echo "🚀 Setting up E2E test environment..."
echo "  Working directory: $(pwd)"

# 1. Start Docker
echo "📦 Starting Docker container..."
npm run test:e2e:setup

# 2. Wait for database to be ready
echo "⏳ Waiting for database to be ready (10 seconds)..."
sleep 10

# 3. Apply migrations
echo "🗄️  Applying migrations..."
TEST_DB_URL="postgresql://prisma:prisma@localhost:5433/tests?schema=public"
# Use .env.test for migrations (temporarily replace .env)
if [ -f ".env.test" ]; then
    # Backup original .env if it exists
    if [ -f ".env" ]; then
        cp .env .env.backup
    fi
    # Copy .env.test to .env and ensure DATABASE_URL and DIRECT_URL are correct
    # Use awk for better cross-platform compatibility
    awk -v test_url="$TEST_DB_URL" '
        /^DATABASE_URL=/ { print "DATABASE_URL=" test_url; next }
        /^DIRECT_URL=/ { print "DIRECT_URL=" test_url; next }
        { print }
        END {
            if (!found_direct_url) print "DIRECT_URL=" test_url
        }
    ' .env.test > .env.tmp
    # Ensure DIRECT_URL is set
    if ! grep -q "^DIRECT_URL=" .env.tmp; then
        echo "DIRECT_URL=$TEST_DB_URL" >> .env.tmp
    fi
    mv .env.tmp .env
    # Verify the .env was updated correctly
    echo "  Verifying .env configuration..."
    grep "^DATABASE_URL=" .env | head -1
    grep "^DIRECT_URL=" .env | head -1
    echo "  (Using .env.test for migration with test database)"
    npm run test:e2e:migrate
    MIGRATION_EXIT=$?
    # Restore original .env if it existed
    if [ -f ".env.backup" ]; then
        mv .env.backup .env
        echo "  (Restored original .env)"
    else
        rm -f .env
    fi
    if [ $MIGRATION_EXIT -ne 0 ]; then
        exit $MIGRATION_EXIT
    fi
else
    echo "  Error: .env.test not found!"
    echo "  Please create .env.test with DATABASE_URL for tests"
    exit 1
fi

# 4. Run tests
echo "🧪 Running E2E tests..."
npm run test:e2e:run

echo ""
echo "✅ E2E tests completed!"
echo ""
echo "Press Enter to close..."
read


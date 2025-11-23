#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ] && [ "$DATABASE_URL" != "postgresql://dummy:dummy@localhost:5432/dummy" ]; then
  echo "🔄 Running database migrations..."
  npx prisma migrate deploy --schema=./prisma/schema.prisma
  echo "✅ Migrations complete"
else
  echo "⚠️  Skipping migrations (no valid DATABASE_URL provided)"
fi

echo "🚀 Starting application..."
exec "$@"


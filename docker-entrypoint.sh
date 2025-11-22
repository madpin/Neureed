#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npm exec prisma migrate deploy

echo "✅ Migrations complete"
echo "🚀 Starting application..."
exec "$@"


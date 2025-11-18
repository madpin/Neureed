#!/bin/bash

# NeuReed Setup Script
# This script helps set up the development environment

set -e

echo "🚀 NeuReed Setup Script"
echo "======================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << 'EOF'
# Database (using port 5433 to avoid conflicts with local PostgreSQL)
DATABASE_URL="postgresql://neureed:neureed_dev_password@127.0.0.1:5433/neureed"

# Node Environment
NODE_ENV="development"
EOF
    echo "✅ .env.local created"
else
    echo "✅ .env.local already exists"
fi

# Create symlink for Prisma (Prisma looks for .env by default)
if [ ! -L .env ]; then
    echo "🔗 Creating .env symlink for Prisma..."
    ln -sf .env.local .env
    echo "✅ .env symlink created"
fi

echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start PostgreSQL
echo "🐘 Starting PostgreSQL with pgvector..."
docker-compose up -d

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if database is ready
until docker exec neureed-postgres pg_isready -U neureed -d neureed > /dev/null 2>&1; do
    echo "   Still waiting for database..."
    sleep 2
done

echo "✅ PostgreSQL is ready"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run db:generate

echo ""

# Push database schema
echo "🗄️  Pushing database schema..."
npm run db:push

echo ""

# Seed database
read -p "🌱 Do you want to seed the database with sample data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run db:seed
    echo "✅ Database seeded"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run dev' to start the development server"
echo "  2. Visit http://localhost:3000/api/health to check system health"
echo "  3. Run 'npm run db:studio' to view the database"
echo ""


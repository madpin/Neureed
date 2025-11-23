# NeuReed - Intelligent RSS Reader

![Build & Deploy](https://github.com/madpin/Neureed/workflows/Build%20and%20Deploy/badge.svg)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

NeuReed is a highly customizable, LLM-focused RSS reader with semantic search capabilities, built on Next.js with PostgreSQL/pgvector for intelligent content discovery and personalization.

## Features

### Core Features (Phase 1-3 Complete)
- 🚀 Modern Next.js 16 with App Router
- 🐘 PostgreSQL with pgvector for semantic search
- 🔍 **Vector embeddings for intelligent article discovery**
- 📰 RSS/Atom feed parsing and management
- 🎨 Tailwind CSS with dark mode support
- 🔒 Type-safe environment variables
- 📊 Prisma ORM for database management

### Semantic Search (Phase 3 ✅)
- 🤖 **Configurable embedding providers** (OpenAI or local models)
- 🔎 **Real-time semantic search** with instant results
- 🎯 **Related articles** recommendations
- 📊 **Hybrid search** (semantic + keyword)
- 💰 **Cost tracking** for API usage
- ⚡ **HNSW index** for fast similarity search
- 🔄 **Automatic embedding generation** on feed refresh
- 📈 **Embedding statistics** and management

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v24 or higher)
- **npm** or **yarn** or **pnpm**
- **Docker** and **Docker Compose** (for PostgreSQL with pgvector)

## Getting Started

### Quick Setup (Recommended)

Run the automated setup script:

```bash
./scripts/setup.sh
```

This will:
- Create `.env.local` file
- Start PostgreSQL with Docker
- Install dependencies
- Generate Prisma Client
- Push database schema
- Optionally seed sample data

Then start the dev server:

```bash
npm run dev
```

### Manual Setup

If you prefer to set up manually:

#### 1. Clone the repository

```bash
git clone <repository-url>
cd neureed
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Set up environment variables

Create a `.env.local` file (note: `.env.local` is gitignored, so you need to create it manually):

```bash
cat > .env.local << 'EOF'
# Database (using port 5433 to avoid conflicts with local PostgreSQL)
DATABASE_URL="postgresql://neureed:neureed_dev_password@127.0.0.1:5433/neureed"

# Node Environment
NODE_ENV="development"

# Embedding Configuration (Phase 3)
EMBEDDING_PROVIDER="local"  # "openai" or "local"
EMBEDDING_MODEL="text-embedding-3-small"
EMBEDDING_BATCH_SIZE="10"
EMBEDDING_AUTO_GENERATE="false"  # Set to "true" to auto-generate on feed refresh
# OPENAI_API_KEY="sk-..."  # Required if using openai provider
EOF

# Create symlink for Prisma (Prisma looks for .env by default)
ln -sf .env.local .env
```

**Note:** We use port 5433 instead of the default 5432 to avoid conflicts with any existing local PostgreSQL installations.

Or copy from the example:

```bash
cp .env.example .env.local
ln -sf .env.local .env
```

#### 4. Start PostgreSQL with pgvector

Start the PostgreSQL database using Docker Compose:

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL 16 with the pgvector extension
- Expose the database on port 5432
- Create a persistent volume for data storage
- Set up health checks

To check if the database is running:

```bash
docker-compose ps
```

To view database logs:

```bash
docker-compose logs -f postgres
```

#### 5. Run database migrations

Apply the database schema and enable pgvector:

```bash
npm run db:push
```

Or if you prefer to use migrations:

```bash
npm run db:migrate
```

#### 6. Generate Prisma Client

Generate the Prisma Client for type-safe database access:

```bash
npm run db:generate
```

#### 7. Seed the database (optional)

Populate the database with sample data:

```bash
npm run db:seed
```

This will create:
- Sample categories (Technology, AI & Machine Learning, Web Development)
- Sample RSS feeds (Hacker News, Vercel Blog, OpenAI Blog)
- Sample articles for testing

#### 8. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Available Scripts

### Development

- `npm run dev` - Start the Next.js development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint

### Database

- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database (for development)
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed the database with sample data
- `npm run db:reset` - Reset the database (⚠️ deletes all data)

## Project Structure

```
neureed/
├── app/                    # Next.js App Router pages and layouts
│   ├── api/               # API routes
│   │   └── health/        # Health check endpoint
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── prisma/                # Prisma schema and migrations
│   ├── migrations/        # Database migrations
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Database seed script
├── src/                   # Source code
│   ├── env.ts            # Type-safe environment variables
│   └── lib/              # Utility libraries
│       ├── api-response.ts  # API response helpers
│       ├── db.ts           # Prisma client singleton
│       └── logger.ts       # Logging utility
├── docker-compose.yml     # Docker configuration for PostgreSQL
├── .env.local            # Environment variables (gitignored)
├── .env.example          # Environment variables template
└── package.json          # Dependencies and scripts
```

## Database Access

### Using Prisma Studio

Prisma Studio provides a visual interface to view and edit your database:

```bash
npm run db:studio
```

This will open Prisma Studio at [http://localhost:5555](http://localhost:5555)

### Using psql (PostgreSQL CLI)

Connect to the database directly:

```bash
docker exec -it neureed-postgres psql -U neureed -d neureed
```

### Useful PostgreSQL Commands

```sql
-- List all tables
\dt

-- Describe a table
\d articles

-- Check if pgvector is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- View vector indexes
SELECT * FROM pg_indexes WHERE tablename = 'articles';
```

## Health Check

The application includes a health check endpoint that verifies:
- Database connectivity
- pgvector extension status

Access it at: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## Development Workflow

1. **Make schema changes**: Edit `prisma/schema.prisma`
2. **Apply changes**: Run `npm run db:push` (dev) or `npm run db:migrate` (production)
3. **Generate client**: Run `npm run db:generate`
4. **Test changes**: Use `npm run db:studio` to verify

## Troubleshooting

### Database connection issues

If you can't connect to the database:

1. Check if Docker is running: `docker ps`
2. Check database logs: `docker-compose logs postgres`
3. Verify the DATABASE_URL in `.env.local`
4. Restart the database: `docker-compose restart postgres`

### pgvector not working

If pgvector queries fail:

1. Check if the extension is enabled:
   ```bash
   docker exec -it neureed-postgres psql -U neureed -d neureed -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
   ```
2. If not enabled, enable it manually:
   ```bash
   docker exec -it neureed-postgres psql -U neureed -d neureed -c "CREATE EXTENSION IF NOT EXISTS vector;"
   ```

### Port conflicts

**Note:** This project uses port 5433 by default to avoid conflicts with local PostgreSQL installations.

If you still encounter port issues:

1. Check what's using the port: `lsof -i :5433`
2. Change the port in `docker-compose.yml` (e.g., `"5434:5432"`)
3. Update `DATABASE_URL` in `.env.local` to match the new port

## Semantic Search Usage

### Configuring Embedding Providers

NeuReed supports two embedding providers:

**1. Local Provider (Default)**
- Uses Transformers.js with bge-small-en-v1.5
- Free, no API costs
- Runs locally in Node.js
- Slower than OpenAI but private

```bash
EMBEDDING_PROVIDER="local"
```

**2. OpenAI Provider (Recommended for Production)**
- Uses text-embedding-3-small (1536 dimensions)
- Fast and high quality
- Costs ~$0.02 per 1M tokens
- Requires API key
- Supports OpenAI-compatible endpoints (Azure OpenAI, local proxies, etc.)

```bash
EMBEDDING_PROVIDER="openai"
OPENAI_API_KEY="sk-your-api-key-here"
# Optional: Use OpenAI-compatible endpoint
# OPENAI_BASE_URL="https://api.openai.com/v1"  # Default
# OPENAI_BASE_URL="https://your-azure-resource.openai.azure.com/openai/deployments/your-deployment"  # Azure
```

### Generating Embeddings

**Option 1: Automatic (Recommended)**
```bash
EMBEDDING_AUTO_GENERATE="true"
```
Embeddings are generated automatically when new articles are fetched.

**Option 2: Manual via UI**
1. Go to Settings page: [http://localhost:3000/settings](http://localhost:3000/settings)
2. Click "Generate Embeddings" button

**Option 3: Manual via API**
```bash
curl -X POST http://localhost:3000/api/jobs/generate-embeddings \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 50, "maxBatches": 10}'
```

### Using Semantic Search

**Real-time Search Bar**
- Available in the top navigation
- Type to search articles by meaning
- Shows top 5 results with similarity scores

**Advanced Search Page**
- Visit: [http://localhost:3000/search](http://localhost:3000/search)
- Choose between semantic and hybrid modes
- Adjust similarity threshold
- Filter by feeds and date range

**Related Articles**
- Automatically shown on article detail pages
- Based on content similarity
- Configurable minimum similarity threshold

### API Endpoints

**Semantic Search**
```bash
curl -X POST http://localhost:3000/api/articles/semantic-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "artificial intelligence",
    "limit": 10,
    "minScore": 0.7,
    "mode": "semantic"
  }'
```

**Find Related Articles**
```bash
curl http://localhost:3000/api/articles/ARTICLE_ID/related?limit=5
```

**Embedding Statistics**
```bash
curl http://localhost:3000/api/admin/embeddings
```

## Deployment

### Docker

Pre-built Docker images are available via GitHub Container Registry:

```bash
# Pull the latest image
docker pull ghcr.io/madpin/neureed:latest

# Run the container
docker run -d \
  --name neureed \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/neureed" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e AUTH_TRUST_HOST="true" \
  -e GITHUB_CLIENT_ID="your-id" \
  -e GITHUB_CLIENT_SECRET="your-secret" \
  -e OPENAI_API_KEY="your-key" \
  ghcr.io/madpin/neureed:latest
```

### Dokploy

For Dokploy deployment instructions, see:
- [Dokploy Deployment Guide](DOKPLOY_FIX.md) - Comprehensive deployment guide
- [Deployment Fix Summary](DEPLOYMENT_FIX_SUMMARY.md) - Quick reference

### CI/CD

GitHub Actions workflows automatically:
- ✅ Run tests and linting on every PR
- ✅ Build Docker images on every push
- ✅ Push images to GitHub Container Registry
- ✅ Create releases with changelogs

See [.github/workflows/README.md](.github/workflows/README.md) for details.

## Documentation

### User Guides
- [Content Extraction Guide](docs/guides/CONTENT_EXTRACTION.md) - Configure content extraction methods
- [Cookie Extraction Guide](docs/guides/COOKIE_EXTRACTION_GUIDE.md) - Extract cookies for authenticated feeds
- [Storage Management Guide](docs/guides/STORAGE_MANAGEMENT_GUIDE.md) - Monitor and manage database/cache storage

### Deployment Guides
- [Dokploy Deployment](DOKPLOY_FIX.md) - Deploy to Dokploy
- [Deployment Summary](DEPLOYMENT_FIX_SUMMARY.md) - Quick deployment reference
- [CI/CD Workflows](.github/workflows/README.md) - GitHub Actions setup

### Implementation Details
- [Cron System Implementation](docs/implementation/CRON_IMPLEMENTATION_SUMMARY.md) - Automated feed refresh and cleanup
- [Recency Scoring](docs/implementation/RECENCY_SCORING_IMPLEMENTATION.md) - Time-based search result ranking
- [Admin Recency Settings](docs/implementation/ADMIN_RECENCY_SETTINGS.md) - Configure default recency behavior
- [Timezone Fix](docs/implementation/TIMEZONE_FIX_SUMMARY.md) - Proper date/time handling across timezones
- [Cron Diagnosis](docs/implementation/CRON_DIAGNOSIS_RESULTS.md) - Troubleshooting cron jobs

### Project Planning
- [Changelog](CHANGELOG.md) - Version history and release notes
- [Feature Backlog](docs/BACKLOG.md) - Upcoming features and ideas

## Next Steps

### Current Status
- ✅ Phase 1: Foundation & Core Setup - COMPLETE
- ✅ Phase 2: Feed Management & Article Storage - COMPLETE
- ✅ Phase 3: Embeddings & Semantic Search - COMPLETE
- ✅ Phase 4: User System & Authentication - COMPLETE
- ✅ Phase 5: Advanced Content Extraction - COMPLETE
- ✅ Phase 6: Learning & Personalization - COMPLETE
- ✅ Phase 7: Advanced Features & Optimization - COMPLETE

See the [Changelog](CHANGELOG.md) for detailed version history and [Feature Backlog](docs/BACKLOG.md) for upcoming enhancements.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL 16 with pgvector
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Environment**: @t3-oss/env-nextjs

## License

[Your License Here]

## Contributing

[Your Contributing Guidelines Here]

# 🧠 NeuReed - Your RSS Reader, But Way Smarter

![Build & Deploy](https://github.com/madpin/Neureed/workflows/Build%20and%20Deploy/badge.svg)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node.js 24](https://img.shields.io/badge/node-24.x-brightgreen)
![Next.js 16](https://img.shields.io/badge/next.js-16-black)

**NeuReed is an RSS reader that actually understands what you read.** Using AI and semantic search, it learns your interests and surfaces content you'll actually care about. No more drowning in feeds - just the good stuff.

## ✨ Why NeuReed?

- **🤖 AI That Gets You**: The more you read, the better it understands your interests
- **🔍 Search That Actually Works**: Find articles by meaning, not just keywords
- **🎨 Beautiful & Customizable**: Dark mode, themes, reading preferences - make it yours
- **🚀 Blazing Fast**: Built on Next.js 16 with pgvector for instant semantic search
- **💰 Cost-Aware**: Track your OpenAI usage or use free local models
- **🔐 Privacy First**: Self-hosted, your data stays yours

## 🎯 What Makes It Different?

### Semantic Search That Blows Your Mind 🧠
Type "machine learning tutorials for beginners" and get relevant articles even if they never used those exact words. That's the power of vector embeddings.

###  Personal Learning Engine 📚
- Thumbs up articles you love, thumbs down ones you don't
- NeuReed learns from your reading patterns automatically
- Get personalized article scores based on your interests
- Articles you'll love float to the top

### Flexible AI Models 🔧
- **OpenAI GPT models**: Powerful summaries and embeddings
- **Local models**: Zero cost, complete privacy
- **Bring your own**: Use any OpenAI-compatible endpoint
- **Per-feature models**: Different models for summaries vs embeddings

### Feed Management Done Right 📰
- Organize feeds into categories that make sense
- Set refresh intervals per feed, category, or globally
- OPML import/export for easy migration
- Automatic cleanup of old articles

## 🚀 Quick Start

### Option 1: Automated Setup (Easiest!)

```bash
# Clone and setup
git clone https://github.com/madpin/neureed.git
cd neureed
./scripts/setup.sh

# Start developing
npm run dev
```

The setup script handles everything: environment files, Docker containers, dependencies, database setup, and even sample data if you want it.

### Option 2: Docker Compose (Production-ish)

```bash
# Start everything (app + database)
docker-compose up -d

# Check it out
open http://localhost:3000
```

### Option 3: Manual (You Like Pain?)

<details>
<summary>Click to expand manual setup</summary>

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start PostgreSQL with pgvector
docker-compose up -d postgres

# Setup database
npx prisma migrate dev
npx prisma db seed

# Start the app
npm run dev
```

</details>

## 🎮 First Steps

1. **Sign in** with GitHub or Google (or configure another OAuth provider)
2. **Add some feeds** - click the + button in the sidebar
3. **Read stuff** - articles auto-refresh every 30 minutes
4. **Give feedback** - thumbs up/down to train your personal AI
5. **Try semantic search** - type naturally, get smart results

## 📸 Screenshots

### Main Interface

<table>
  <tr>
    <td width="50%">
      <img src="screenshots/07-main-article-reading-panel.jpeg" alt="Article Reading Panel"/>
      <p align="center"><em>Split-pane reading interface</em></p>
    </td>
    <td width="50%">
      <img src="screenshots/19-main-article-list-view.jpeg" alt="Article List View"/>
      <p align="center"><em>Main article list with feed filtering</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="screenshots/18-article-fullpage-view.jpeg" alt="Full Page Article"/>
      <p align="center"><em>Full-page article reading experience</em></p>
    </td>
    <td width="50%">
      <img src="screenshots/20-main-collapsed-sidebar.jpeg" alt="Collapsed Sidebar"/>
      <p align="center"><em>Compact sidebar for more reading space</em></p>
    </td>
  </tr>
</table>

### Admin Dashboard

<table>
  <tr>
    <td width="50%">
      <img src="screenshots/01-admin-dashboard-overview.jpeg" alt="Admin Dashboard Overview"/>
      <p align="center"><em>System statistics and health monitoring</em></p>
    </td>
    <td width="50%">
      <img src="screenshots/02-admin-embeddings-search.jpeg" alt="Embeddings Management"/>
      <p align="center"><em>Vector embeddings coverage and status</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="screenshots/03-admin-users-management.jpeg" alt="User Management"/>
      <p align="center"><em>User roles and permissions</em></p>
    </td>
    <td width="50%">
      <img src="screenshots/04-admin-cron-jobs-logs.jpeg" alt="Cron Jobs"/>
      <p align="center"><em>Background job execution and logs</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="screenshots/05-admin-storage-database.jpeg" alt="Storage Management"/>
      <p align="center"><em>Database and Redis storage metrics</em></p>
    </td>
    <td width="50%">
      <img src="screenshots/06-admin-configuration-defaults.jpeg" alt="System Configuration"/>
      <p align="center"><em>Default preferences for new users</em></p>
    </td>
  </tr>
</table>

### User Preferences & Customization

<table>
  <tr>
    <td width="50%">
      <img src="screenshots/10-user-menu-preferences.jpeg" alt="User Menu"/>
      <p align="center"><em>Quick access to preferences and settings</em></p>
    </td>
    <td width="50%">
      <img src="screenshots/11-preferences-profile.jpeg" alt="Profile Settings"/>
      <p align="center"><em>User profile and authentication info</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="screenshots/12-preferences-appearance-themes.jpeg" alt="Theme Selection"/>
      <p align="center"><em>Multiple theme options (light, dark, and more)</em></p>
    </td>
    <td width="50%">
      <img src="screenshots/13-preferences-article-display.jpeg" alt="Article Display Settings"/>
      <p align="center"><em>Customize article density and visibility</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="screenshots/09-preferences-article-display-borders.jpeg" alt="Display Customization"/>
      <p align="center"><em>Fine-tune borders and spacing</em></p>
    </td>
    <td width="50%">
      <img src="screenshots/14-preferences-reading-panel.jpeg" alt="Reading Panel Config"/>
      <p align="center"><em>Configure split-pane reading experience</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="screenshots/15-preferences-learning-system.jpeg" alt="Learning System"/>
      <p align="center"><em>AI learning preferences and pattern detection</em></p>
    </td>
    <td width="50%">
      <img src="screenshots/16-preferences-llm-settings.jpeg" alt="User LLM Settings"/>
      <p align="center"><em>Personal LLM configuration and API keys</em></p>
    </td>
  </tr>
</table>

### Feed Management & Configuration

<table>
  <tr>
    <td width="50%">
      <img src="screenshots/08-feed-management-settings.jpeg" alt="Feed Management"/>
      <p align="center"><em>Advanced feed settings and organization</em></p>
    </td>
    <td width="50%">
      <img src="screenshots/17-admin-llm-configuration.jpeg" alt="Admin LLM Config"/>
      <p align="center"><em>System-wide LLM provider configuration</em></p>
    </td>
  </tr>
</table>

## 🎨 Features That'll Make You Happy

### Smart Article Discovery
- **Semantic search**: Find articles by meaning, not keywords
- **Related articles**: Discover content similar to what you're reading
- **Personalized scoring**: Articles ranked by how much you'll like them
- **Smart filtering**: Hide read articles, filter by feed or category

### Reading Experience
- **Customizable fonts**: Size, family, line height, spacing - all yours
- **Theme variety**: Light, dark, Nord, Solarized, and more fun themes
- **Reading panel**: Split-screen or full-page reading modes
- **Estimated reading time**: Know before you commit

### Feed Organization
- **Drag & drop**: Organize feeds intuitively
- **Category management**: Group feeds however makes sense to you
- **Per-feed settings**: Different refresh rates, retention policies
- **OPML support**: Import/export your subscriptions

### AI-Powered Features
- **Article summaries**: TL;DR powered by GPT
- **Embedding generation**: Automatic or on-demand
- **Cost tracking**: Know exactly what you're spending on AI
- **Provider flexibility**: OpenAI, local models, or custom endpoints

### Admin Dashboard
- **Cron job management**: Monitor and trigger background tasks
- **Embedding stats**: Track coverage and generation progress
- **User management**: See who's using your instance
- **System health**: Cache status, database stats, and more

## 📚 Documentation

- **[Getting Started](docs/README.md)** - Complete documentation index
- **[Deployment Guide](docs/deployment/deployment.md)** - Deploy to production
- **[Configuration Reference](docs/configuration/configuration-reference.md)** - All the settings
- **[API Documentation](docs/api/)** - If you're building integrations
- **[Architecture Docs](docs/architecture/)** - How it all works

## 🛠️ Tech Stack

We're standing on the shoulders of giants:

- **[Next.js 16](https://nextjs.org/)** - The React framework
- **[PostgreSQL](https://www.postgresql.org/)** + **[pgvector](https://github.com/pgvector/pgvector)** - Vector similarity search
- **[Prisma](https://www.prisma.io/)** - Type-safe database access
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication that just works
- **[TanStack Query](https://tanstack.com/query)** - Data fetching & caching
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling without the pain
- **[Redis](https://redis.io/)** - Caching layer for speed

## 🤝 Contributing

Found a bug? Have an idea? Contributions are welcome!

```bash
# Fork the repo, then:
git clone https://github.com/YOUR_USERNAME/neureed.git
cd neureed
npm install
./scripts/setup.sh

# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes, commit, and push
git commit -m "Add some amazing feature"
git push origin feature/amazing-feature

# Open a PR!
```

## 📝 Environment Variables

Here's what you'll need for a basic setup:

```bash
# Database (required)
DATABASE_URL="postgresql://user:pass@localhost:5433/neureed"

# Auth (required for login)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# OAuth (pick at least one)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-secret"
GITHUB_CLIENT_ID="your-github-client-id"  
GITHUB_CLIENT_SECRET="your-github-secret"

# AI Features (optional but recommended)
OPENAI_API_KEY="sk-your-api-key"

# Redis (optional, but makes things faster)
REDIS_URL="redis://localhost:6379"
```

See [Configuration Reference](docs/configuration/configuration-reference.md) for the complete list.

## 🐛 Troubleshooting

**Database connection fails?**
- Make sure PostgreSQL is running: `docker-compose ps`
- Check the port (we use 5433 to avoid conflicts)

**Build fails?**
- Clear node_modules and try again: `rm -rf node_modules && npm install`
- Make sure you're on Node.js 24+: `node --version`

**Embeddings not working?**
- Set your OpenAI API key or enable local embeddings
- Check admin dashboard → Search tab for provider status

**Still stuck?** Check [GitHub Issues](https://github.com/madpin/neureed/issues) or create a new one.

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details. Build cool stuff with it!

## 🙏 Acknowledgments

- Built with ❤️ by developers who got tired of crappy RSS readers
- Inspired by the need for actually intelligent content discovery
- Powered by the amazing open-source community

## 🌟 Star Us!

If NeuReed makes your RSS reading life better, give us a star! It helps others discover the project.

---

**Ready to take control of your content?** Get started now! 🚀

[Documentation](docs/README.md) • [Report Bug](https://github.com/madpin/neureed/issues) • [Request Feature](https://github.com/madpin/neureed/issues)

# Contributing to NeuReed

Thank you for your interest in contributing to NeuReed! This guide will help you get started.

---

## 🚀 Quick Start for Contributors

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/madpin/neureed.git
   cd neureed
   ```

2. **Automated setup (recommended)**
   ```bash
   ./scripts/setup.sh
   ```

   The setup script handles:
   - Environment file creation
   - Docker container setup
   - Dependency installation
   - Database migrations
   - Optional sample data

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open the application**
   ```
   http://localhost:3000
   ```

### Manual Setup

If you prefer manual setup:

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

---

## 📝 Development Guidelines

### Code Style

- **TypeScript** - All code must be properly typed
- **ESLint** - Run `npm run lint` before committing
- **Formatting** - Code is formatted using Prettier (configured in project)
- **Components** - Use functional components with hooks
- **Server Components** - Default to Server Components, only use Client Components when necessary

### Code Organization

```
neureed/
├── app/                    # Next.js App Router pages & components
├── src/
│   ├── lib/
│   │   ├── services/      # Business logic (stateless, composable)
│   │   └── jobs/          # Cron job definitions
│   ├── hooks/             # Custom React hooks
│   └── components/        # Shared React components
├── prisma/                # Database schema and migrations
├── docs/                  # Documentation
└── tests/                 # Test files
```

### Best Practices

1. **Service Layer Pattern** - Business logic goes in services, not in API routes or components
2. **Type Safety** - Use Zod for runtime validation, TypeScript for compile-time checking
3. **Error Handling** - Always handle errors gracefully with meaningful messages
4. **Testing** - Write tests for new features (we use Vitest)
5. **Documentation** - Update relevant docs for significant changes

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.ts
```

### Writing Tests

- Tests use **Vitest** and **Testing Library**
- Place tests in `/tests` directory
- Follow existing patterns in test files
- Aim for meaningful test descriptions

**Example:**
```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/app/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

---

## 📚 Documentation

### Update Documentation

When making changes that affect users or developers:

1. **README.md** - Update if changing core features or setup
2. **CHANGELOG.md** - Add entry for your changes
3. **docs/** - Update relevant guides if changing architecture or adding features
4. **CLAUDE.md** - Update if changing development patterns or adding services

### Documentation Standards

- Use clear, concise language
- Include code examples where helpful
- Update cross-references when moving/renaming docs
- Test that all internal links work

---

## 🔄 Pull Request Process

### Before Submitting

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Add tests for new functionality
   - Update relevant documentation

3. **Test locally**
   ```bash
   npm run lint        # Check code style
   npm test            # Run tests
   npm run build       # Verify build succeeds
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add awesome feature"
   ```

   Use [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

### Submitting Pull Request

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** on GitHub
   - Use a clear, descriptive title
   - Describe what changed and why
   - Reference any related issues (#123)
   - Include screenshots for UI changes

3. **Wait for review**
   - Address any feedback from reviewers
   - Keep your branch up to date with main
   - Be patient and respectful

### PR Review Criteria

Your PR should:
- ✅ Have clear, focused commits
- ✅ Include tests for new functionality
- ✅ Pass all CI checks (lint, build, tests)
- ✅ Update relevant documentation
- ✅ Not introduce TypeScript errors
- ✅ Follow existing code patterns
- ✅ Have a clear description

---

## 🐛 Reporting Issues

### Before Creating an Issue

1. **Search existing issues** - Your issue might already exist
2. **Verify the bug** - Make sure it's reproducible
3. **Check documentation** - Ensure it's not a configuration issue

### Creating a Good Issue

Include:
- **Clear title** - Describe the issue concisely
- **Description** - What happened vs what you expected
- **Steps to reproduce** - Exact steps to recreate the issue
- **Environment** - OS, Node version, browser (if relevant)
- **Screenshots** - If applicable
- **Logs** - Any error messages or console output

---

## 🎨 Feature Requests

We welcome feature suggestions! When proposing a feature:

1. **Check the backlog** - See [docs/planning/backlog.md](docs/planning/backlog.md)
2. **Open a discussion** - Start with a GitHub Discussion or Issue
3. **Explain the use case** - Why is this feature valuable?
4. **Consider alternatives** - Are there other ways to achieve this?
5. **Be patient** - Features require design, implementation, and testing

---

## 📖 Resources

### Documentation
- **[Main README](README.md)** - Project overview
- **[Documentation Hub](docs/README.md)** - All documentation
- **[CLAUDE.md](CLAUDE.md)** - Development guide for AI assistants
- **[Development Guides](docs/guides/development/)** - Implementation patterns

### Architecture
- **[Service Layer Pattern](docs/architecture/)** - How business logic is organized
- **[Server vs Client Components](docs/guides/architecture/server-vs-client-components.md)** - Decision tree

### Testing
- **[Test Infrastructure](docs/archive/2024-refactoring/PHASE_0_COMPLETION.md)** - Testing setup
- **[Testing Guide](docs/features/saved-searches/TESTING_SAVED_SEARCHES.md)** - Testing patterns

---

## 💬 Getting Help

### Questions?

- **GitHub Discussions** - For general questions
- **GitHub Issues** - For bug reports and feature requests
- **Code Comments** - Check inline documentation
- **CLAUDE.md** - Comprehensive development guide

### Community Guidelines

- Be respectful and constructive
- Help others when you can
- Follow the Code of Conduct
- Give credit where due
- Have fun building together!

---

## 🏆 Recognition

Contributors are recognized in:
- README.md contributors section
- CHANGELOG.md for significant contributions
- GitHub's built-in contributors graph

Thank you for contributing to NeuReed! 🎉

---

**Questions or issues with contributing?** [Open an issue](https://github.com/madpin/neureed/issues) and we'll help you out.

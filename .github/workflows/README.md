# GitHub Actions Workflows

This directory contains CI/CD workflows for the NeuReed project.

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
- **Lint and Type Check**: Runs ESLint and TypeScript type checking
- **Build Test**: Builds the Next.js application to verify it compiles
- **Prisma Validate**: Validates the Prisma schema
- **Docker Build Test**: Builds the Docker image to ensure it works
- **Summary**: Generates a summary of all checks

**Purpose**: Ensures code quality and that the application builds successfully before merging.

### 2. Docker Build and Push (`docker-build.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual workflow dispatch

**Jobs:**
- **Build**: Builds the Docker image
- **Test**: Runs basic tests on the built image
- **Push**: Pushes the image to GitHub Container Registry (only on push, not PRs)

**Image Registry**: `ghcr.io/madpin/neureed`

**Tags Generated:**
- `main` - Latest from main branch
- `develop` - Latest from develop branch
- `pr-{number}` - Pull request builds
- `sha-{commit}` - Specific commit builds
- `latest` - Latest stable (main branch only)

## Using the Docker Images

### Pull the Latest Image

```bash
# Latest stable version
docker pull ghcr.io/madpin/neureed:latest

# Specific branch
docker pull ghcr.io/madpin/neureed:main
docker pull ghcr.io/madpin/neureed:develop

# Specific commit
docker pull ghcr.io/madpin/neureed:main-abc1234
```

### Run the Image Locally

```bash
docker run -d \
  --name neureed \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/neureed" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your-secret-here" \
  -e GITHUB_CLIENT_ID="your-github-client-id" \
  -e GITHUB_CLIENT_SECRET="your-github-client-secret" \
  -e OPENAI_API_KEY="your-openai-api-key" \
  ghcr.io/madpin/neureed:latest
```

### Use in Docker Compose

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/madpin/neureed:latest
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/neureed
      NEXTAUTH_URL: http://localhost:3000
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID}
      GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      - db
  
  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: neureed
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Using in Dokploy

You can configure Dokploy to pull from GitHub Container Registry instead of building:

1. **Set up authentication** in Dokploy for GitHub Container Registry
2. **Configure the application** to use the pre-built image:
   - Image: `ghcr.io/madpin/neureed:latest`
   - Pull policy: Always
3. **Set environment variables** as needed

This approach is faster than building on Dokploy since the image is pre-built by GitHub Actions.

## Manual Workflow Dispatch

You can manually trigger the Docker build workflow:

1. Go to the **Actions** tab in GitHub
2. Select **Docker Build and Push** workflow
3. Click **Run workflow**
4. Select the branch
5. Click **Run workflow**

## Secrets Required

The workflows use the following secrets:

- `GITHUB_TOKEN` - Automatically provided by GitHub Actions for pushing to GHCR

No additional secrets need to be configured unless you want to push to other registries.

## Adding Additional Registries

To push to Docker Hub or other registries, update `docker-build.yml`:

```yaml
- name: Log in to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

Then add the corresponding secrets in GitHub repository settings.

## Build Cache

Both workflows use GitHub Actions cache to speed up builds:
- Docker layer caching
- npm package caching
- Node.js setup caching

This significantly reduces build times for subsequent runs.

## Status Badges

Add these badges to your README.md:

```markdown
![CI](https://github.com/madpin/Neureed/workflows/CI/badge.svg)
![Docker Build](https://github.com/madpin/Neureed/workflows/Docker%20Build%20and%20Push/badge.svg)
```

## Troubleshooting

### Build Fails on GitHub Actions

1. Check the workflow logs in the Actions tab
2. Verify that all required files are committed
3. Ensure the Dockerfile is valid
4. Check for any syntax errors in workflow files

### Cannot Pull Image

1. Ensure the repository visibility allows package access
2. Authenticate with GitHub Container Registry:
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
   ```
3. Check that the image was successfully pushed

### Image Works Locally but Fails in Production

1. Verify all environment variables are set correctly
2. Check database connectivity
3. Ensure PostgreSQL has pgvector extension installed
4. Review application logs for specific errors

## Best Practices

1. **Always test PRs**: The CI workflow runs on all PRs to catch issues early
2. **Use specific tags**: In production, use commit SHA tags for reproducibility
3. **Monitor workflow runs**: Check the Actions tab regularly for failures
4. **Keep workflows updated**: Update action versions periodically
5. **Review security**: Regularly audit secrets and permissions

## Future Enhancements

Potential improvements to consider:

- [ ] Add automated testing (unit tests, integration tests)
- [ ] Add security scanning (Trivy, Snyk)
- [ ] Add performance testing
- [ ] Add automated deployment to staging
- [ ] Add release automation with semantic versioning
- [ ] Add multi-architecture builds (ARM64)
- [ ] Add vulnerability scanning
- [ ] Add SBOM (Software Bill of Materials) generation


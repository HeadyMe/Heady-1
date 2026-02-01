# Heady Ecosystem - Infrastructure Architecture

## 🌐 Complete Stack Overview

The Heady Ecosystem is built entirely on **GitHub**, **Cloudflare**, **Render**, **Gists**, and **Drupal**, providing a modern, scalable, and secure infrastructure.

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge Layer                     │
├─────────────────────────────────────────────────────────────┤
│  • Workers (Edge Compute)                                    │
│  • CDN & Caching                                             │
│  • DDoS Protection                                           │
│  • Tunnel (Secure Access)                                    │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼──────────┐    ┌────────▼──────────┐
│   GitHub     │    │      Render       │
├──────────────┤    ├───────────────────┤
│ • Repos      │    │ • IDE Backend     │
│ • Actions    │    │ • HeadyConnection │
│ • Apps       │    │ • HeadySystems    │
│ • Gists      │    │ • PostgreSQL      │
│ • Registry   │    │ • Redis           │
└──────────────┘    └───────────────────┘
                             │
                    ┌────────▼──────────┐
                    │      Drupal       │
                    ├───────────────────┤
                    │ • CMS             │
                    │ • Content API     │
                    │ • MySQL           │
                    └───────────────────┘
```

## 🔧 Component Details

### 1. **GitHub Ecosystem**

#### **GitHub Repositories**
- **Main Repo**: `HeadySystems/heady-automation-ide`
- **Version Control**: Git with branch protection
- **Code Review**: Pull requests with required reviews
- **Issue Tracking**: GitHub Issues for task management

#### **GitHub Actions** (`.github/workflows/ci.yml`)
**Automated Workflows:**
- ✅ **Validate & Test** - Lint, typecheck, unit tests, E2E tests
- ✅ **Build Docker** - Build and push to GitHub Container Registry
- ✅ **Deploy to Render** - Automatic deployment on main branch
- ✅ **Deploy Cloudflare Workers** - Edge compute deployment
- ✅ **Create Deployment Gist** - Deployment summary storage

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests
- Manual workflow dispatch

#### **GitHub Apps** (`infra/github-app-config.json`)
**Permissions:**
- Contents: write
- Issues: write
- Pull requests: write
- Workflows: write
- Actions: write

**Webhooks:**
- Push events
- Pull request events
- Issue events
- Workflow runs
- Deployments

#### **GitHub Container Registry**
- **Images**: `ghcr.io/headysystems/heady-automation-ide/ide:latest`
- **Caching**: GitHub Actions cache for faster builds
- **Security**: Automatic vulnerability scanning

#### **GitHub Gists** (`src/server/services/gist-manager.ts`)
**Features:**
- Code snippet storage
- Deployment summaries
- Configuration templates
- Shareable code examples

**API Integration:**
- Create/update/delete Gists
- Search Gists by description
- Tag-based organization
- Public/private control

### 2. **Cloudflare Platform**

#### **Cloudflare Workers** (`infra/cloudflare-workers/`)
**Edge Router** (`edge-router.ts`):
- Intelligent request routing
- Edge caching with KV storage
- GitHub webhook verification
- Analytics tracking
- CORS handling

**Deployment:**
```bash
cd infra/cloudflare-workers
pnpm run deploy:production
```

**Environments:**
- **Production**: `headysystems.com`, `headyconnection.org`
- **Staging**: `staging.headysystems.com`
- **Development**: Local testing

#### **Cloudflare Tunnel** (`infra/cloudflare-tunnel/config.yml`)
**Secure Access:**
- Zero-trust network access
- No open ports required
- Automatic HTTPS
- Load balancing

**Routes:**
- `api.headysystems.com` → Render IDE Backend
- `headyconnection.org` → Render HeadyConnection
- `headysystems.com` → Render HeadySystems
- `dev.headysystems.com` → Local development

**Features:**
- Auto-updates every 24h
- Metrics on port 9126
- Connection retries: 5
- Grace period: 30s

#### **Cloudflare KV** (Key-Value Storage)
- API response caching (5 min TTL)
- Session storage
- Configuration storage

#### **Cloudflare Analytics**
- Request tracking
- Performance metrics
- Error monitoring

### 3. **Render.com Platform** (`infra/render.yaml`)

#### **Services Deployed**

**1. Heady Automation IDE**
- **Type**: Docker web service
- **Port**: 3000
- **Health Check**: `/api/health`
- **Region**: Oregon
- **Auto-deploy**: On main branch push

**2. HeadyConnection (Nonprofit)**
- **Type**: Node.js web service
- **Framework**: Next.js
- **Build**: `pnpm build --filter web-heady-connection`
- **Start**: `pnpm start --filter web-heady-connection`

**3. HeadySystems (C-Corp)**
- **Type**: Node.js web service
- **Framework**: Next.js
- **Build**: `pnpm build --filter web-heady-systems`
- **Start**: `pnpm start --filter web-heady-systems`

#### **Databases**

**PostgreSQL**
- **Name**: heady-postgres
- **Version**: 16
- **Plan**: Starter
- **Shared across**: All services

**Redis**
- **Name**: heady-redis
- **Version**: 7
- **Plan**: Starter
- **Policy**: allkeys-lru

#### **Environment Variables**
Managed via Render dashboard:
- `HC_AUTOMATION_API_KEY`
- `ANTHROPIC_API_KEY`
- `GITHUB_TOKEN`
- `HUGGINGFACE_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

### 4. **Drupal CMS** (`infra/drupal/`)

#### **Purpose**
- Content management for HeadyConnection nonprofit
- Blog and news articles
- Grant documentation
- Partner/donor information

#### **Stack**
- **Drupal**: 10 (Apache)
- **Database**: MySQL 8.0
- **Cache**: Redis 7
- **Port**: 8080

#### **Integration**
- REST API for content delivery
- JSON:API for headless CMS
- Webhooks to trigger deployments
- Content sync to Render services

#### **Deployment**
```bash
docker-compose -f infra/drupal/docker-compose.drupal.yml up -d
```

## 🔄 Deployment Flow

### Development → Production

```
1. Developer pushes to feature branch
   ↓
2. GitHub Actions runs validation
   ↓
3. Pull request created
   ↓
4. Code review and approval
   ↓
5. Merge to main branch
   ↓
6. GitHub Actions triggers:
   - Build Docker image → GitHub Container Registry
   - Deploy to Render → heady-automation-ide.onrender.com
   - Deploy Cloudflare Worker → Edge routing active
   - Create Gist → Deployment summary
   ↓
7. Cloudflare Tunnel routes traffic
   ↓
8. Users access via:
   - headysystems.com (Cloudflare → Render)
   - headyconnection.org (Cloudflare → Render)
   - api.headysystems.com (Cloudflare → Render API)
```

## 🔐 Security Architecture

### GitHub Security
- ✅ Branch protection on main
- ✅ Required status checks
- ✅ Signed commits (recommended)
- ✅ Dependabot security updates
- ✅ Secret scanning enabled

### Cloudflare Security
- ✅ DDoS protection
- ✅ WAF (Web Application Firewall)
- ✅ Zero-trust tunnel access
- ✅ Automatic HTTPS
- ✅ Rate limiting at edge

### Render Security
- ✅ Automatic HTTPS
- ✅ Environment variable encryption
- ✅ Private networking between services
- ✅ IP allowlisting for databases

### Application Security
- ✅ API key authentication
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection prevention (Prisma ORM)

## 📊 Monitoring & Observability

### GitHub
- Actions workflow status
- Container registry metrics
- Dependabot alerts

### Cloudflare
- Analytics Engine (requests, errors, latency)
- Worker metrics
- Tunnel health

### Render
- Service health dashboards
- Database metrics
- Log aggregation
- Uptime monitoring

## 🚀 Deployment Commands

### GitHub Actions (Automatic)
```bash
# Triggered on push to main
git push origin main
```

### Render (Manual)
```bash
# Using Render CLI
render deploy --service heady-automation-ide

# Or via API
curl -X POST https://api.render.com/v1/services/YOUR_SERVICE_ID/deploys \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

### Cloudflare Workers
```bash
cd infra/cloudflare-workers

# Deploy to production
pnpm run deploy:production

# Deploy to staging
pnpm run deploy:staging

# Local development
pnpm run dev
```

### Cloudflare Tunnel
```bash
# Start tunnel
cloudflared tunnel run --config infra/cloudflare-tunnel/config.yml

# Or via Docker
docker-compose up tunnel
```

### Drupal
```bash
# Start Drupal CMS
docker-compose -f infra/drupal/docker-compose.drupal.yml up -d

# Access at http://localhost:8080
```

## 🌍 Domain Configuration

### Production Domains
- **headysystems.com** → Cloudflare Worker → Render (HeadySystems)
- **headyconnection.org** → Cloudflare Worker → Render (HeadyConnection)
- **api.headysystems.com** → Cloudflare Worker → Render (IDE API)

### Staging Domains
- **staging.headysystems.com** → Cloudflare Worker → Render Staging
- **staging.headyconnection.org** → Cloudflare Worker → Render Staging

### Development
- **localhost:4100** → IDE API
- **localhost:5173** → IDE UI (Vite)
- **localhost:3000** → HeadyConnection (Next.js)
- **localhost:3001** → HeadySystems (Next.js)
- **localhost:8080** → Drupal CMS

## 💰 Cost Optimization

### GitHub
- **Free tier**: Public repos, Actions (2000 min/month)
- **Pro**: $4/user/month (more Actions minutes)

### Cloudflare
- **Free tier**: Workers (100k req/day), Tunnel (unlimited)
- **Workers Paid**: $5/month (10M req/month)
- **Analytics**: Included in paid plan

### Render
- **Starter**: $7/service/month
- **PostgreSQL**: $7/month
- **Redis**: $10/month
- **Estimated**: ~$40/month for full stack

### Total Estimated Cost
- **Development**: $0 (free tiers)
- **Staging**: ~$20/month
- **Production**: ~$60/month

## 🔄 Backup & Disaster Recovery

### GitHub
- **Code**: Versioned in Git
- **Gists**: Deployment summaries
- **Container Images**: Tagged and versioned

### Render
- **Database**: Automatic daily backups
- **Point-in-time recovery**: Available
- **Snapshots**: Manual snapshots supported

### Cloudflare
- **Worker Code**: Versioned deployments
- **KV Data**: Replicated globally
- **Rollback**: Instant rollback to previous versions

## 📝 Configuration Files

| File | Purpose |
|------|---------|
| `infra/render.yaml` | Render service configuration |
| `infra/cloudflare-workers/wrangler.toml` | Worker deployment config |
| `infra/cloudflare-tunnel/config.yml` | Tunnel routing rules |
| `infra/github-app-config.json` | GitHub App permissions |
| `.github/workflows/ci.yml` | CI/CD pipeline |
| `docker-compose.yml` | Local development stack |

## 🎯 Next Steps

1. **Configure Secrets** in GitHub repository settings:
   - `RENDER_API_KEY`
   - `RENDER_SERVICE_ID`
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `GITHUB_WEBHOOK_SECRET`

2. **Setup Cloudflare**:
   - Create KV namespaces
   - Configure DNS records
   - Setup Tunnel

3. **Deploy to Render**:
   - Connect GitHub repository
   - Configure environment variables
   - Deploy services

4. **Install Drupal**:
   - Run docker-compose for Drupal
   - Complete installation wizard
   - Configure REST API

5. **Verify Integration**:
   - Test GitHub Actions workflow
   - Verify Cloudflare Worker routing
   - Check Render service health
   - Test Gist creation

---

**Status**: Infrastructure fully configured and ready for deployment
**Last Updated**: 2026-01-31
**Architecture Version**: 2.0

---
<div align="center">
  <p>Made with ❤️ by Heady Systems</p>
</div>

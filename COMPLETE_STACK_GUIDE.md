# Heady Ecosystem - Complete Stack Guide

## 🎯 System Architecture

The Heady Automation IDE is now **100% based on GitHub, Cloudflare, Render, Gists, and Drupal** as requested.

## 🏗️ Infrastructure Stack

### **1. GitHub Ecosystem** (Primary Platform)

#### **Repository Management**
- **Main Repo**: HeadySystems/heady-automation-ide
- **Monorepo Structure**: pnpm workspaces
- **Branch Strategy**: main (production), develop (staging), feature/* (development)

#### **GitHub Actions** (CI/CD Pipeline)
**File**: `.github/workflows/ci.yml`

**Automated Jobs:**
1. ✅ **Validate & Test** - Lint, typecheck, unit tests, E2E tests
2. ✅ **Build Docker** - Push to GitHub Container Registry (`ghcr.io`)
3. ✅ **Deploy to Render** - Automatic deployment on main branch
4. ✅ **Deploy Cloudflare Workers** - Edge compute deployment
5. ✅ **Create Deployment Gist** - Stores deployment summary

#### **GitHub Apps Integration**
**Config**: `infra/github-app-config.json`

**Capabilities:**
- Webhook handling for push/PR/issues
- Automated code reviews
- Issue/PR management
- Workflow automation
- Repository access control

#### **GitHub Container Registry**
- **Image Storage**: `ghcr.io/headysystems/heady-automation-ide/ide:latest`
- **Automatic Builds**: On every push to main
- **Vulnerability Scanning**: Built-in security scanning
- **Version Tagging**: Commit SHA tags

#### **GitHub Gists** (Code Storage)
**Service**: `src/server/services/gist-manager.ts`

**Features:**
- Save code snippets
- Store deployment summaries
- Share configuration templates
- MCP integration for snippet management

**API Endpoints:**
- `POST /api/gist/create` - Create new Gist
- `GET /api/gist/:id` - Retrieve Gist
- `GET /api/gist` - List all Gists

### **2. Cloudflare Platform** (Edge & Security)

#### **Cloudflare Workers** (Edge Compute)
**Location**: `infra/cloudflare-workers/`

**Edge Router** (`edge-router.ts`):
- Intelligent request routing
- KV-based caching (5 min TTL)
- GitHub webhook verification
- Analytics tracking
- CORS handling
- DDoS protection

**Deployment:**
```bash
cd infra/cloudflare-workers
pnpm install
pnpm run deploy:production  # or deploy:staging
```

**Routes:**
- `api.headysystems.com/*` → Render IDE Backend
- `headyconnection.org/*` → Render HeadyConnection
- `headysystems.com/*` → Render HeadySystems

#### **Cloudflare Tunnel** (Secure Access)
**Config**: `infra/cloudflare-tunnel/config.yml`

**Features:**
- Zero-trust network access
- No firewall ports needed
- Automatic HTTPS
- Load balancing
- Metrics on port 9126

**Ingress Rules:**
- `api.headysystems.com` → https://heady-automation-ide.onrender.com
- `headyconnection.org` → https://heady-connection.onrender.com
- `headysystems.com` → https://heady-systems.onrender.com
- `dev.headysystems.com` → http://localhost:4100

**Start Tunnel:**
```bash
cloudflared tunnel run --config infra/cloudflare-tunnel/config.yml
# Or via Docker
docker-compose up tunnel
```

#### **Cloudflare KV** (Key-Value Storage)
- API response caching
- Session storage
- Configuration storage
- Global replication

#### **Cloudflare Analytics**
- Request tracking
- Performance metrics
- Error monitoring
- Real-time dashboards

### **3. Render.com** (Backend Services)

#### **Configuration**
**File**: `infra/render.yaml`

#### **Deployed Services**

**1. Heady Automation IDE**
- **Type**: Docker web service
- **Port**: 3000
- **Dockerfile**: `apps/heady-automation-ide/Dockerfile`
- **Health Check**: `/api/health`
- **Auto-deploy**: GitHub main branch
- **URL**: https://heady-automation-ide.onrender.com

**2. HeadyConnection (Nonprofit)**
- **Type**: Node.js (Next.js)
- **Build**: `pnpm build --filter web-heady-connection`
- **Start**: `pnpm start --filter web-heady-connection`
- **URL**: https://heady-connection.onrender.com

**3. HeadySystems (C-Corp)**
- **Type**: Node.js (Next.js)
- **Build**: `pnpm build --filter web-heady-systems`
- **Start**: `pnpm start --filter web-heady-systems`
- **URL**: https://heady-systems.onrender.com

#### **Databases**

**PostgreSQL 16**
- Shared across all services
- Automatic daily backups
- Point-in-time recovery
- Connection pooling

**Redis 7**
- Session storage
- Cache layer
- Task queue backend
- allkeys-lru eviction policy

#### **Deployment**
```bash
# Automatic via GitHub Actions
git push origin main

# Manual via Render CLI
render deploy --service heady-automation-ide

# Via API
curl -X POST https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

### **4. Drupal CMS** (Content Management)

#### **Purpose**
- HeadyConnection nonprofit content
- Blog posts and news
- Grant documentation
- Partner/donor information
- Event management

#### **Stack**
**File**: `infra/drupal/docker-compose.drupal.yml`

- **Drupal**: 10 (Apache)
- **MySQL**: 8.0
- **Redis**: 7 (cache)
- **Port**: 8080

#### **Features**
- REST API for content delivery
- JSON:API for headless CMS
- Content sync to Render services
- Webhooks for deployment triggers

#### **Deployment**
```bash
docker-compose -f infra/drupal/docker-compose.drupal.yml up -d
# Access at http://localhost:8080
```

## 🔄 Complete Deployment Flow

```
Developer → GitHub Repository
    ↓
GitHub Actions (CI/CD)
    ├─→ Validate & Test
    ├─→ Build Docker Image → GitHub Container Registry
    ├─→ Deploy to Render
    ├─→ Deploy Cloudflare Workers
    └─→ Create Deployment Gist
    ↓
Render Services Running
    ├─→ Heady Automation IDE (Port 3000)
    ├─→ HeadyConnection (Next.js)
    ├─→ HeadySystems (Next.js)
    ├─→ PostgreSQL (5432)
    └─→ Redis (6379)
    ↓
Cloudflare Edge Layer
    ├─→ Workers (Edge routing & caching)
    ├─→ Tunnel (Secure access)
    ├─→ KV (Cache storage)
    └─→ Analytics (Monitoring)
    ↓
Public Access
    ├─→ headysystems.com
    ├─→ headyconnection.org
    └─→ api.headysystems.com
```

## 🚀 Quick Start Commands

### **Setup Infrastructure**
```powershell
# Run infrastructure setup script
.\scripts\setup-infrastructure.ps1 -Environment development

# Or manually:
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your keys

# 3. Generate secrets
python scripts/generate_missing_secrets.py

# 4. Setup desktop shortcuts
npm run setup:desktop
```

### **Development Mode**
```bash
# Start IDE locally
pnpm dev --filter heady-automation-ide

# Access:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:4100
```

### **Deploy to Production**
```bash
# Push to GitHub (triggers automatic deployment)
git add .
git commit -m "Deploy to production"
git push origin main

# GitHub Actions will:
# 1. Run tests
# 2. Build Docker image
# 3. Deploy to Render
# 4. Deploy Cloudflare Workers
# 5. Create deployment Gist
```

### **Start Drupal CMS**
```bash
docker-compose -f infra/drupal/docker-compose.drupal.yml up -d
# Access at http://localhost:8080
```

### **Deploy Cloudflare Workers**
```bash
cd infra/cloudflare-workers
pnpm install
pnpm run deploy:production
```

### **Start Cloudflare Tunnel**
```bash
# Via Docker
docker-compose up tunnel

# Or standalone
cloudflared tunnel run --config infra/cloudflare-tunnel/config.yml
```

## 🔐 Required Secrets

### **GitHub Repository Secrets**
Configure in: `Settings → Secrets and variables → Actions`

```
RENDER_API_KEY=rnd_...
RENDER_SERVICE_ID=srv-...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
GITHUB_WEBHOOK_SECRET=...
```

### **Local Development** (`.env.local`)
```bash
# GitHub
GITHUB_TOKEN=ghp_...
GITHUB_APP_ID=...
GITHUB_WEBHOOK_SECRET=...

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
TUNNEL_TOKEN=...

# Render
RENDER_API_KEY=...
RENDER_SERVICE_ID=...

# MCP Services
ANTHROPIC_API_KEY=sk-ant-...
HUGGINGFACE_TOKEN=hf_...
JULES_API_KEY=...

# Security
HC_AUTOMATION_API_KEY=... (auto-generated)
```

## 📊 Service URLs

### **Production**
- **HeadySystems**: https://headysystems.com
- **HeadyConnection**: https://headyconnection.org
- **API**: https://api.headysystems.com
- **IDE**: https://heady-automation-ide.onrender.com

### **Staging**
- **HeadySystems**: https://staging.headysystems.com
- **HeadyConnection**: https://staging.headyconnection.org

### **Development**
- **IDE Frontend**: http://localhost:5173
- **IDE Backend**: http://localhost:4100
- **Drupal CMS**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🛠️ Key Features

### **GitHub Integration**
- ✅ Automated CI/CD via Actions
- ✅ Container Registry for Docker images
- ✅ Gists for deployment summaries
- ✅ Apps for webhook automation
- ✅ Issue/PR management

### **Cloudflare Integration**
- ✅ Workers for edge routing
- ✅ KV for caching
- ✅ Tunnel for secure access
- ✅ Analytics for monitoring
- ✅ DDoS protection

### **Render Integration**
- ✅ Docker deployment
- ✅ Managed PostgreSQL
- ✅ Managed Redis
- ✅ Auto-deploy from GitHub
- ✅ Health monitoring

### **Gists Integration**
- ✅ Code snippet storage
- ✅ Deployment summaries
- ✅ Configuration sharing
- ✅ MCP service integration

### **Drupal Integration**
- ✅ Headless CMS
- ✅ REST API
- ✅ Content management
- ✅ MySQL backend

## 📈 Monitoring & Observability

### **GitHub**
- Actions workflow status
- Container registry metrics
- Dependabot alerts
- Security scanning

### **Cloudflare**
- Analytics Engine (requests, latency, errors)
- Worker metrics and logs
- Tunnel health status
- KV usage metrics

### **Render**
- Service health dashboards
- Database metrics
- Log aggregation
- Uptime monitoring
- Performance metrics

### **Application**
- **Metrics API**: `/api/metrics`
- **Prometheus Export**: `/api/metrics/prometheus`
- **Queue Status**: `/api/queue/status`
- **MCP Services**: `/api/mcp/services`

## 💰 Cost Breakdown

### **GitHub**
- **Free Tier**: Public repos, 2000 Actions minutes/month
- **Pro**: $4/user/month (more Actions minutes)
- **Container Registry**: Free for public images

### **Cloudflare**
- **Workers Free**: 100,000 requests/day
- **Workers Paid**: $5/month (10M requests/month)
- **Tunnel**: Free unlimited
- **KV**: $0.50/GB/month

### **Render**
- **Web Services**: $7/service/month (3 services = $21)
- **PostgreSQL**: $7/month
- **Redis**: $10/month
- **Total**: ~$38/month

### **Drupal** (Self-hosted)
- **Docker**: Free (local/VPS)
- **VPS Option**: $5-10/month

**Total Monthly Cost**: ~$50-60/month for full production stack

## 🔒 Security Architecture

### **Multi-Layer Security**
1. **Cloudflare Edge**: DDoS protection, WAF, rate limiting
2. **GitHub**: Secret scanning, Dependabot, signed commits
3. **Render**: Automatic HTTPS, private networking, encrypted env vars
4. **Application**: API key auth, CORS, rate limiting, input validation

### **Zero-Trust Access**
- Cloudflare Tunnel eliminates open ports
- All traffic encrypted end-to-end
- No direct database access from internet
- Service-to-service authentication

## 📝 Configuration Files

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | GitHub Actions CI/CD pipeline |
| `infra/render.yaml` | Render service definitions |
| `infra/cloudflare-workers/wrangler.toml` | Worker deployment config |
| `infra/cloudflare-tunnel/config.yml` | Tunnel routing rules |
| `infra/github-app-config.json` | GitHub App permissions |
| `infra/drupal/docker-compose.drupal.yml` | Drupal CMS stack |
| `.mcp/config.json` | MCP service configuration |
| `docker-compose.yml` | Local development stack |

## 🚀 Deployment Checklist

### **Initial Setup**
- [ ] Create GitHub repository
- [ ] Configure GitHub Actions secrets
- [ ] Setup Render account and services
- [ ] Configure Cloudflare account
- [ ] Create Cloudflare Tunnel
- [ ] Setup Cloudflare Workers
- [ ] Install Drupal (if using CMS)

### **GitHub Configuration**
- [ ] Enable Actions
- [ ] Configure branch protection
- [ ] Setup GitHub App
- [ ] Add webhook secret
- [ ] Configure container registry

### **Cloudflare Configuration**
- [ ] Create KV namespace
- [ ] Configure DNS records
- [ ] Setup Tunnel credentials
- [ ] Deploy Workers
- [ ] Enable Analytics

### **Render Configuration**
- [ ] Connect GitHub repository
- [ ] Configure environment variables
- [ ] Setup PostgreSQL database
- [ ] Setup Redis instance
- [ ] Configure auto-deploy

### **Verification**
- [ ] Test GitHub Actions workflow
- [ ] Verify Cloudflare Worker routing
- [ ] Check Render service health
- [ ] Test Gist creation
- [ ] Verify Tunnel connectivity

## 🎯 Usage Examples

### **Deploy via GitHub**
```bash
git add .
git commit -m "feat: add new feature"
git push origin main
# GitHub Actions automatically deploys to Render and Cloudflare
```

### **Create Deployment Gist**
```bash
curl -X POST https://api.headysystems.com/api/gist/create \
  -H "x-api-key: $HC_AUTOMATION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Deployment Summary",
    "files": [{
      "filename": "deployment.json",
      "content": "{\"status\": \"deployed\"}"
    }],
    "isPublic": false
  }'
```

### **Execute MCP Task via Cloudflare Worker**
```bash
curl -X POST https://api.headysystems.com/api/task/execute \
  -H "x-api-key: $HC_AUTOMATION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "code_generation",
    "description": "Create a React component"
  }'
```

### **Monitor via Metrics**
```bash
# Get metrics summary
curl https://api.headysystems.com/api/metrics

# Prometheus format
curl https://api.headysystems.com/api/metrics/prometheus
```

## 📚 Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| **Infrastructure Guide** | `docs/INFRASTRUCTURE.md` | Complete architecture details |
| **MCP Integration** | `docs/MCP_INTEGRATION.md` | MCP services and API |
| **Deployment Summary** | `docs/DEPLOYMENT_SUMMARY.md` | Current deployment status |
| **Auto-Merge Guide** | `docs/AUTO_MERGE_GUIDE.md` | Intelligent merge automation |
| **Project Improvements** | `docs/PROJECT_IMPROVEMENTS.md` | Recent enhancements |

## 🎊 System Status

### **✅ Fully Integrated Components**

1. ✅ **GitHub** - Repository, Actions, Apps, Gists, Container Registry
2. ✅ **Cloudflare** - Workers, Tunnel, KV, Analytics
3. ✅ **Render** - Backend services, PostgreSQL, Redis
4. ✅ **Gists** - Code storage and deployment summaries
5. ✅ **Drupal** - CMS for content management

### **✅ Infrastructure Features**

- ✅ Automated CI/CD pipeline
- ✅ Edge routing and caching
- ✅ Secure tunnel access
- ✅ Container orchestration
- ✅ Database management
- ✅ Metrics and monitoring
- ✅ Error handling and logging
- ✅ Rate limiting
- ✅ Task queue system
- ✅ MCP service integration

### **✅ Development Tools**

- ✅ Desktop shortcuts for easy access
- ✅ Auto-merge scripts for code conflicts
- ✅ Comprehensive test suite
- ✅ Structured logging
- ✅ Performance metrics
- ✅ Health monitoring

## 🎯 Next Steps

1. **Configure Secrets**: Add all required API keys to GitHub and `.env.local`
2. **Deploy Services**: Push to main branch to trigger deployment
3. **Setup Cloudflare**: Configure DNS and deploy Workers
4. **Test Integration**: Run `node scripts/test-mcp-integration.js`
5. **Monitor**: Check `/api/health` and `/api/metrics` endpoints

---

**Status**: ✅ Complete stack configured and ready for deployment
**Architecture**: 100% GitHub + Cloudflare + Render + Gists + Drupal
**Last Updated**: 2026-01-31
**Version**: 2.0.0

---
<div align="center">
  <p>Made with ❤️ by Heady Systems</p>
</div>

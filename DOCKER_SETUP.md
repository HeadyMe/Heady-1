# 🐳 Docker Setup & Cloudflare Tunnel Guide

This guide covers how to run the Heady Automation IDE using Docker and expose it securely using Cloudflare Tunnel.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- A Cloudflare account (if using Tunnel).

## 🚀 Quick Start (Docker)

To start the full stack (IDE, Postgres, Redis):

```bash
docker-compose up -d --build
```

Access the services:
- **IDE**: http://localhost:3000
- **Postgres**: localhost:5432
- **Redis**: localhost:6379

## 🚇 Cloudflare Tunnel Setup (Optional)

To expose your local IDE securely to the internet (e.g., for webhooks or remote access):

1. **Install Cloudflared** (or use the containerized version included).
2. **Login to Cloudflare**:
   ```bash
   cloudflared tunnel login
   ```
3. **Create a Tunnel**:
   ```bash
   cloudflared tunnel create heady-ide
   ```
   Save the Tunnel ID.
4. **Configure DNS**:
   ```bash
   cloudflared tunnel route dns heady-ide ide.yourdomain.com
   ```
5. **Get the Token**:
   Get your tunnel token from the Cloudflare Dashboard (Access > Tunnels) or config file.
6. **Set Environment Variable**:
   Add `TUNNEL_TOKEN=your_token_here` to your `.env` or `.env.local` file.
7. **Run with Tunnel**:
   The `tunnel` service in `docker-compose.yml` will automatically start if `TUNNEL_TOKEN` is set.

## 🛠 Troubleshooting

- **Database Connection Failed**: Ensure the `DATABASE_URL` in `.env` uses `db` as the hostname when running inside Docker, but `localhost` when running locally with `pnpm dev`.
- **Ports in Use**: Stop other services on ports 3000, 5432, or 6379.
- **Tunnel Errors**: Check `docker-compose logs tunnel` for authentication issues.

## 🧹 Cleanup

To stop and remove containers/volumes:

```bash
docker-compose down -v
```

---
<div align="center">
  <p>Made with ❤️ by Heady Systems</p>
</div>

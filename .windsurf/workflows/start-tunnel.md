---
description: Start Cloudflare Tunnel (HeadySystems)
---

1. Ensure `TUNNEL_TOKEN` is set in `.env.local`

2. Start docker compose with tunnel profile enabled

- docker-compose --profile tunnel up -d --build

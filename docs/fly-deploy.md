# Fly.io deployment

This repo deploys as one Fly app with host-based routing:

- `admin.mewhit.com` serves `admin-web-app`
- `erp.mewhit.com` serves `user-portal-webapp`
- `erp-api.mewhit.com` proxies to `http-server`

## First deploy

```powershell
flyctl auth login
flyctl apps create mewhit-erp
flyctl secrets set DATABASE_URL="postgres://..." AUTH_TOKEN_SECRET="change-this"
flyctl deploy
```

## Domains

```powershell
flyctl certs add admin.mewhit.com -a mewhit-erp
flyctl certs add erp.mewhit.com -a mewhit-erp
flyctl certs add erp-api.mewhit.com -a mewhit-erp
```

After adding the certs, create the DNS records requested by `flyctl certs show`.

## Runtime layout

The container listens on port `8080` for Fly traffic. Caddy routes requests by
`Host` and forwards API traffic to the Node server on `127.0.0.1:3000`.

Fly terminates TLS before traffic reaches the container, so Caddy has
`auto_https off`.

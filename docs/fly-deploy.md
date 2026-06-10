# Fly.io deployment

This repo deploys as one Fly app with host-based routing:

- `erp-admin.mewhit.com` serves `admin-web-app`
- `erp.mewhit.com` serves `user-portal-webapp`
- `erp-api.mewhit.com` proxies to `http-server`

## First deploy

```powershell
flyctl auth login
flyctl apps create erp-vbwyww
flyctl secrets set DATABASE_URL="postgres://..." AUTH_TOKEN_SECRET="change-this"
flyctl deploy
```

Alternatively, fill the gitignored `http-server/.env.prod` file and import its values:

```powershell
Get-Content http-server/.env.prod | flyctl secrets import -a erp-vbwyww
```

## Domains

```powershell
flyctl certs add erp-admin.mewhit.com -a erp-vbwyww
flyctl certs add erp.mewhit.com -a erp-vbwyww
flyctl certs add erp-api.mewhit.com -a erp-vbwyww
```

After adding the certs, create the DNS records requested by `flyctl certs show`.

## Runtime layout

The container listens on port `8080` for Fly traffic. Caddy routes requests by
`Host` and forwards API traffic to the Node server configured by `API_UPSTREAM`.

Fly terminates TLS before traffic reaches the container, so Caddy has
`auto_https off`.

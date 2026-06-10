# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json yarn.lock ./
COPY http-server/package.json http-server/package.json
COPY admin-web-app/package.json admin-web-app/package.json
COPY user-portal-webapp/package.json user-portal-webapp/package.json
COPY e2e/package.json e2e/package.json

RUN yarn install --frozen-lockfile

FROM deps AS build

ARG VITE_API_BASE_URL=https://erp-api.mewhit.com
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY . .

RUN yarn build

FROM node:22-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache caddy

ENV NODE_ENV=production
ENV PORT=3000
ENV API_CLIENT_BASE_URL=http://127.0.0.1:3000
ENV API_UPSTREAM=127.0.0.1:3000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/yarn.lock ./yarn.lock
COPY --from=build /app/http-server ./http-server
COPY --from=build /app/admin-web-app/dist /srv/admin
COPY --from=build /app/user-portal-webapp/dist /srv/portal
COPY Caddyfile /etc/caddy/Caddyfile
COPY scripts/fly-start.sh /app/scripts/fly-start.sh

RUN chmod +x /app/scripts/fly-start.sh

EXPOSE 8080

CMD ["/app/scripts/fly-start.sh"]

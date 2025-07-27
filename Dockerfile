FROM oven/bun:1.2.19 AS builder
WORKDIR /app
COPY . .
RUN bun install
RUN bun run build

FROM caddy:2.10 AS runner
COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
#CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

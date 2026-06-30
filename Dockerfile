# syntax=docker/dockerfile:1.7

# ============================================================
# Stage 1 — build the static bundle with Vite
# ============================================================
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first to leverage Docker's layer cache.
# Copy only manifest files so this layer is reused unless deps change.
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the sources and build for production.
COPY . .

# Self-hosted model/wasm by default (offline, zero egress). Override via --build-arg.
ARG VITE_MEDIAPIPE_MODEL_URL=/models/hand_landmarker.task
ARG VITE_MEDIAPIPE_WASM_URL=/models/wasm
ENV VITE_MEDIAPIPE_MODEL_URL=${VITE_MEDIAPIPE_MODEL_URL}
ENV VITE_MEDIAPIPE_WASM_URL=${VITE_MEDIAPIPE_WASM_URL}

RUN npm run build

# ============================================================
# Stage 2 — serve the static bundle with hardened nginx (non-root)
# ============================================================
FROM nginx:1.27-alpine AS production

# Custom nginx.conf: the pid + temp paths live under /tmp so the unprivileged
# user (UID 101, set below) can write them. No `user` directive — the container
# already runs as 101 via USER, so the master and its workers are non-root.
COPY <<'EOF' /etc/nginx/nginx.conf
worker_processes auto;
pid /tmp/nginx.pid;
error_log /dev/stderr warn;

events { worker_connections 1024; }

http {
  client_body_temp_path /tmp/client_temp;
  proxy_temp_path       /tmp/proxy_temp;
  fastcgi_temp_path     /tmp/fastcgi_temp;
  uwsgi_temp_path       /tmp/uwsgi_temp;
  scgi_temp_path        /tmp/scgi_temp;

  include       /etc/nginx/mime.types;
  default_type  application/octet-stream;

  access_log /dev/stdout;
  sendfile          on;
  keepalive_timeout 65;
  include /etc/nginx/conf.d/*.conf;
}
EOF

# Server block: gzip + long-cache hashed assets + no-cache index.html + security
# headers + SPA fallback. Caching uses `expires` (not `add_header`), so the
# server-level security headers are inherited by every response.
RUN { \
      echo 'server {' ; \
      echo '  listen 8080;' ; \
      echo '  server_name _;' ; \
      echo '  root /usr/share/nginx/html;' ; \
      echo '  index index.html;' ; \
      echo '' ; \
      echo '  gzip on;' ; \
      echo '  gzip_comp_level 5;' ; \
      echo '  gzip_min_length 256;' ; \
      echo '  gzip_proxied any;' ; \
      echo '  gzip_types text/plain text/css application/javascript application/json image/svg+xml application/wasm;' ; \
      echo '' ; \
      echo '  add_header X-Content-Type-Options "nosniff" always;' ; \
      echo '  add_header X-Frame-Options "SAMEORIGIN" always;' ; \
      echo '  add_header Referrer-Policy "strict-origin-when-cross-origin" always;' ; \
      echo '' ; \
      echo '  location ~* \.(?:js|css|woff2?|png|jpe?g|gif|svg|task|wasm)$ { expires 1y; }' ; \
      echo '  location = /index.html { expires -1; }' ; \
      echo '  location / { try_files $uri $uri/ /index.html; }' ; \
      echo '}' ; \
    } > /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

# Run as the non-root nginx user (UID 101). busybox wget is the health probe.
USER 101
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

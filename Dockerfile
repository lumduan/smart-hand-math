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
FROM nginx:1.31-alpine AS production

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

# Security headers. Kept in a snippet because nginx `add_header` does NOT inherit into a location
# that declares any add_header of its own — so this must be re-included in every such location.
#
# CSP: `connect-src 'self'` makes the zero-egress guarantee browser-enforced — the MediaPipe model +
# wasm and the Mitr/Baloo fonts are all self-hosted, so the app contacts no external origin.
# `wasm-unsafe-eval` is required by the MediaPipe vision runtime; `worker-src blob:` covers the
# service worker and canvas-confetti's OffscreenCanvas worker; `style-src 'unsafe-inline'` covers
# framer-motion's injected rules and `img-src data:` the inline daisyui icons. `media-src 'self'`
# is safe: the camera feed is attached via `video.srcObject`, which CSP does not govern.
# Do NOT add `require-trusted-types-for` — the MediaPipe bundle calls createPolicy("goog#html").
#
# Permissions-Policy — two directives differ from the sibling opendys app:
#   * autoplay=(self) — CameraView auto-starts the camera with NO user gesture (cameraAutoStart is
#     persisted, so it fires on every return visit), and useHandTracker swallows the play()
#     rejection; the rAF loop then gates on a currentTime that never advances, so a blocked
#     autoplay surfaces as a silently frozen feed rather than an error. Chromium was measured to
#     play fine even under autoplay=() with --autoplay-policy=document-user-activation-required
#     (a muted MediaStream is exempt from its autoplay gate), so this is not load-bearing there —
#     but Safari/iOS is stricter and untested, and iPads are a primary target for this app. Given
#     the failure is silent and `frame-src 'none'` already bars third-party media, (self) costs
#     nothing and removes the risk.
#   * microphone=() — this app never records audio (getUserMedia({ audio: false })). Thai TTS uses
#     speechSynthesis, which is audio OUTPUT via an OS service and is not policy-gated.
COPY <<'EOF' /etc/nginx/snippets/security-headers.conf
add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; manifest-src 'self'; media-src 'self'; object-src 'none'; frame-src 'none'; frame-ancestors 'none'; form-action 'self'" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer" always;
add_header X-Frame-Options "DENY" always;
add_header Permissions-Policy "accelerometer=(), autoplay=(self), bluetooth=(), browsing-topics=(), camera=(self), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), hid=(), idle-detection=(), local-fonts=(), magnetometer=(), microphone=(), midi=(), payment=(), publickey-credentials-get=(), screen-wake-lock=(), serial=(), usb=(), xr-spatial-tracking=()" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;
EOF

# Server block: gzip + long-cache hashed assets + no-cache entry/SW documents + SPA fallback.
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
  listen 8080;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  gzip on;
  gzip_comp_level 5;
  gzip_min_length 256;
  gzip_proxied any;
  gzip_types text/plain text/css application/javascript application/json image/svg+xml application/wasm;

  include /etc/nginx/snippets/security-headers.conf;

  # The PWA service worker + its registration script are NOT content-hashed, so they must
  # revalidate: `registerType: 'autoUpdate'` can only ship a new build if a fresh sw.js is
  # reachable. Without these, they fall into the 1y bucket below and Cloudflare's edge pins
  # returning visitors to a stale precached shell (the edge does not honour a client's
  # revalidation request). Exact-match locations outrank the regex regardless of order.
  location = /sw.js {
    include /etc/nginx/snippets/security-headers.conf;
    add_header Cache-Control "no-cache";
  }
  location = /registerSW.js {
    include /etc/nginx/snippets/security-headers.conf;
    add_header Cache-Control "no-cache";
  }
  # nginx has no .webmanifest mime type — without default_type it ships as octet-stream.
  location = /manifest.webmanifest {
    include /etc/nginx/snippets/security-headers.conf;
    default_type application/manifest+json;
    add_header Cache-Control "no-cache";
  }

  # Content-hashed build assets + the self-hosted MediaPipe model/wasm — cache hard.
  # (.task needs no mime type: MediaPipe checks response.ok and reads .arrayBuffer().)
  location ~* \.(?:js|css|woff2?|png|jpe?g|gif|svg|task|wasm)$ {
    include /etc/nginx/snippets/security-headers.conf;
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Never cache the entry document so new deploys are picked up immediately.
  location = /index.html {
    include /etc/nginx/snippets/security-headers.conf;
    expires -1;
    add_header Cache-Control "no-cache";
  }

  # SPA fallback: unknown routes (/learn, /play, /lessons/:id) resolve to the app shell.
  location / {
    include /etc/nginx/snippets/security-headers.conf;
    try_files $uri $uri/ /index.html;
  }
}
EOF

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

# Run as the non-root nginx user (UID 101). busybox wget is the health probe.
USER 101
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

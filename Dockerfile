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

# Build-time env defaults; override with --build-arg for self-hosted models, etc.
ARG VITE_MEDIAPIPE_MODEL_URL=https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
ARG VITE_MEDIAPIPE_WASM_URL=https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm
ENV VITE_MEDIAPIPE_MODEL_URL=${VITE_MEDIAPIPE_MODEL_URL}
ENV VITE_MEDIAPIPE_WASM_URL=${VITE_MEDIAPIPE_WASM_URL}

RUN npm run build

# ============================================================
# Stage 2 — serve the static bundle with nginx
# ============================================================
FROM nginx:1.27-alpine AS production

# SPA fallback: route every unknown path to index.html for client-side routing.
RUN { \
      echo 'server {'; \
      echo '  listen 80;' ; \
      echo '  server_name _;' ; \
      echo '  root /usr/share/nginx/html;' ; \
      echo '  index index.html;' ; \
      echo '  location / { try_files $uri $uri/ /index.html; }' ; \
      echo '}' ; \
    } > /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# nginx stays in the foreground by default in the official image.
CMD ["nginx", "-g", "daemon off;"]

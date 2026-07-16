#!/usr/bin/env bash
# Tests that verify-deploy.sh actually FAILS on broken deployments.
#
# This exists because the bug it guards against was a check that could only ever pass:
# `... | grep -o X | sed ... || echo FAIL` never reports failure, since a pipeline's exit status
# is its last command's and sed succeeds on empty input. Proving the happy path is not evidence;
# a check is only worth having if you have watched it fail.
#
# Serves deliberately-broken variants of the real image with nginx and asserts the expected
# check trips. Requires docker. Takes ~30s.
#
#   ./scripts/test-verify-deploy.sh

set -uo pipefail
cd "$(dirname "$0")/.."
VERIFY=./scripts/verify-deploy.sh
IMG=ghcr.io/lumduan/smart-hand-math:v1.1.2
TMP=$(mktemp -d)
PORT=8099
PASS=0; FAIL=0

cleanup() { docker rm -f shm-verifytest >/dev/null 2>&1; rm -rf "$TMP"; }
trap cleanup EXIT

serve() { # $1 = extra docker run args
  docker rm -f shm-verifytest >/dev/null 2>&1
  # shellcheck disable=SC2086
  docker run -d --name shm-verifytest -p 127.0.0.1:$PORT:8080 $1 "$IMG" >/dev/null
  for _ in $(seq 1 40); do curl -sf -o /dev/null "http://127.0.0.1:$PORT/" 2>/dev/null && return 0; sleep 0.3; done
  echo "  (container never came up)"; return 1
}

# $1 = case name, $2 = expect "pass"|"fail", $3 = grep for this text when expecting fail
expect() {
  out=$($VERIFY "http://127.0.0.1:$PORT" 2>&1); rc=$?
  if [ "$2" = "pass" ]; then
    if [ $rc -eq 0 ]; then echo "  ✓ $1: passed as expected"; PASS=$((PASS+1));
    else echo "  ✗ $1: expected pass, got FAIL"; echo "$out" | sed 's/^/      /'; FAIL=$((FAIL+1)); fi
  else
    if [ $rc -ne 0 ] && grep -qi "$3" <<<"$out"; then
      echo "  ✓ $1: failed as expected"; PASS=$((PASS+1))
    else
      echo "  ✗ $1: expected FAIL matching '$3', got rc=$rc"; echo "$out" | sed 's/^/      /'; FAIL=$((FAIL+1))
    fi
  fi
}

echo "== control: the real v1.1.2 image should pass =="
serve "" && expect "healthy image" pass

echo
echo "== the bug that shipped: a duplicate precache entry =="
# Rebuild sw.js's manifest with favicon.svg listed twice, exactly as v1.1.0 had it.
docker run --rm --entrypoint sh "$IMG" -c 'cat /usr/share/nginx/html/sw.js' > "$TMP/sw.js"
sed -i 's|{url:"manifest.webmanifest"|{url:"assets/favicon.svg",revision:null},{url:"manifest.webmanifest"|' "$TMP/sw.js"
serve "-v $TMP/sw.js:/usr/share/nginx/html/sw.js:ro" && expect "duplicate precache entry" fail "only .* unique"

echo
echo "== sw.js long-cached (pre-1.1.0: pins returning visitors to a stale build) =="
cat > "$TMP/stale.conf" <<'EOF'
server {
  listen 8080; root /usr/share/nginx/html; index index.html;
  include /etc/nginx/snippets/security-headers.conf;
  location ~* \.(?:js|css|woff2?|png|jpe?g|gif|svg|task|wasm)$ {
    include /etc/nginx/snippets/security-headers.conf;
    expires 1y;
  }
  location / { include /etc/nginx/snippets/security-headers.conf; try_files $uri $uri/ /index.html; }
}
EOF
serve "-v $TMP/stale.conf:/etc/nginx/conf.d/default.conf:ro" && expect "sw.js long-cached" fail "expected no-cache"

echo
echo "== Permissions-Policy without camera=(self) (camera silently never starts) =="
docker run --rm --entrypoint sh "$IMG" -c 'cat /etc/nginx/snippets/security-headers.conf' > "$TMP/hdr.conf"
sed -i 's/camera=(self)/camera=()/' "$TMP/hdr.conf"
serve "-v $TMP/hdr.conf:/etc/nginx/snippets/security-headers.conf:ro" && expect "camera=() " fail "camera=(self) missing"

echo
echo "== no CSP at all =="
printf 'add_header X-Content-Type-Options "nosniff" always;\n' > "$TMP/nocsp.conf"
serve "-v $TMP/nocsp.conf:/etc/nginx/snippets/security-headers.conf:ro" && expect "CSP stripped" fail "Content-Security-Policy MISSING"

echo
echo "== broken SPA fallback (deep lesson links 404) =="
cat > "$TMP/nospa.conf" <<'EOF'
server {
  listen 8080; root /usr/share/nginx/html; index index.html;
  include /etc/nginx/snippets/security-headers.conf;
  location / { include /etc/nginx/snippets/security-headers.conf; try_files $uri $uri/ =404; }
}
EOF
serve "-v $TMP/nospa.conf:/etc/nginx/conf.d/default.conf:ro" && expect "no SPA fallback" fail "SPA fallback"

echo
[ "$FAIL" -eq 0 ] && { echo "PASS — $PASS/$((PASS+FAIL)) cases; every check was observed failing"; exit 0; }
echo "FAIL — $FAIL/$((PASS+FAIL)) cases did not behave as expected"; exit 1

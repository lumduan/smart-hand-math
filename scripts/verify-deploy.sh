#!/usr/bin/env bash
# Verify a smart-hand-math deployment. Works against the origin on the box
# (http://127.0.0.1:8081) or the public edge (https://handmath.org) — it detects which and
# adjusts the cache expectations, because Cloudflare rewrites some headers.
#
#   ./scripts/verify-deploy.sh                      # defaults to https://handmath.org
#   ./scripts/verify-deploy.sh http://127.0.0.1:8081  # on the box, inside the EIP window
#
# Exits non-zero if any check fails. See DEPLOY-AWS.md.
#
# NOTE ON STYLE: every check below ends in an explicit test ([ ... ] or grep -q), never a bare
# pipeline. A pipeline's exit status is its LAST command's, so `... | grep -o X | sed ... || echo
# FAIL` can never report a failure — sed succeeds on empty input. That mistake shipped a verify
# step here that printed "DUPLICATE STILL PRESENT" on a perfectly good deploy. A check that
# cannot fail is worse than no check, so each one is exercised against a known-bad fixture in
# scripts/test-verify-deploy.sh.

set -uo pipefail

ORIGIN="${1:-https://handmath.org}"
PASS=0
FAIL=0

ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS + 1)); }
bad()  { printf '  \033[31m✗\033[0m %s\n' "$1"; FAIL=$((FAIL + 1)); }
info() { printf '    %s\n' "$1"; }

echo "Verifying $ORIGIN"

head=$(curl -sI --max-time 15 "$ORIGIN/" 2>/dev/null)
body=$(curl -s  --max-time 15 "$ORIGIN/" 2>/dev/null)
sw=$(curl -s    --max-time 20 "$ORIGIN/sw.js" 2>/dev/null)
swhead=$(curl -sI --max-time 15 "$ORIGIN/sw.js" 2>/dev/null)

# Is there a CDN in front? Changes what correct looks like for caching.
if grep -qi '^cf-ray:' <<<"$head"; then EDGE=1; info "(behind Cloudflare)"; else EDGE=0; info "(direct origin)"; fi

# --- reachable -------------------------------------------------------------------------------
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$ORIGIN/" 2>/dev/null)
[ "$code" = "200" ] && ok "GET / -> 200" || bad "GET / -> ${code:-no response}"

# --- it is the built app, not a dev server ---------------------------------------------------
if grep -q '@vite/client' <<<"$body"; then
  bad "serving the VITE DEV SERVER, not the production build"
elif grep -q 'registerSW.js' <<<"$body"; then
  ok "serving the production build"
else
  bad "response looks like neither the dev server nor the built app"
fi

# --- THE big one: a single duplicate precache entry disables the whole service worker ---------
# workbox rejects two entries for one URL with different revisions. precacheAndRoute runs inside
# sw.js's async AMD factory, so the throw is swallowed: no install handler, no routes, nothing
# cached — while the SW still reports healthy. Silent, and it shipped for two weeks. See
# CLAUDE.md §15.
if [ -z "$sw" ]; then
  bad "could not fetch /sw.js"
else
  entries=$(grep -o '{url:"[^"]*"' <<<"$sw" | wc -l | tr -d ' ')
  uniques=$(grep -o '{url:"[^"]*"' <<<"$sw" | sort -u | wc -l | tr -d ' ')
  if [ "$entries" -eq 0 ]; then
    bad "/sw.js has no precache manifest at all"
  elif [ "$entries" -eq "$uniques" ]; then
    ok "precache manifest: $entries entries, no duplicates"
  else
    bad "precache manifest: $entries entries but only $uniques unique — the SW will cache NOTHING"
    grep -o '{url:"[^"]*"' <<<"$sw" | sed 's/{url:"//;s/"$//' | sort | uniq -d \
      | while read -r d; do info "duplicate: $d"; done
    info "fix: add it to workbox.globIgnores in vite.config.ts"
  fi
fi

# --- sw.js must stay revalidatable or deploys never reach returning visitors -------------------
cc=$(grep -i '^cache-control:' <<<"$swhead" | tr -d '\r' | sed 's/^[Cc]ache-[Cc]ontrol: //')
if [ "$EDGE" = "1" ]; then
  # Cloudflare rewrites the browser-facing header to its Browser Cache TTL (max-age=14400); that
  # is harmless because registerSW.js uses the default updateViaCache:'imports'. What actually
  # matters is that the EDGE revalidates against the origin rather than serving a stale copy.
  cfs=$(curl -sI --max-time 15 "$ORIGIN/sw.js" 2>/dev/null | grep -i '^cf-cache-status:' | tr -d '\r' | awk '{print $2}')
  case "$cfs" in
    REVALIDATED|MISS|DYNAMIC|EXPIRED|BYPASS) ok "sw.js edge cache: $cfs (revalidates against origin)" ;;
    HIT) bad "sw.js served from edge cache as HIT — returning visitors can be pinned to a stale build" ;;
    *)   bad "sw.js unexpected cf-cache-status: ${cfs:-none}" ;;
  esac
  info "browser-facing Cache-Control: ${cc:-none} (Cloudflare's TTL; fine given updateViaCache:'imports')"
else
  grep -qi 'no-cache' <<<"$cc" \
    && ok "sw.js Cache-Control: $cc" \
    || bad "sw.js Cache-Control is '${cc:-none}', expected no-cache — a CDN would pin a stale service worker"
fi

# --- security headers, and the two that gate the camera --------------------------------------
grep -qi '^content-security-policy:' <<<"$head" \
  && ok "Content-Security-Policy present" \
  || bad "Content-Security-Policy MISSING"

pp=$(grep -i '^permissions-policy:' <<<"$head" | tr -d '\r')
grep -q 'camera=(self)' <<<"$pp" \
  && ok "Permissions-Policy: camera=(self)" \
  || bad "Permissions-Policy camera=(self) missing — the camera will not start"
grep -q 'autoplay=(self)' <<<"$pp" \
  && ok "Permissions-Policy: autoplay=(self)" \
  || bad "Permissions-Policy autoplay=(self) missing — the gesture-less camera start can freeze silently"

# --- SPA fallback (BrowserRouter; /lessons/:id is depth-2) ------------------------------------
spa_bad=0
for p in /learn /play /lessons /lessons/five-and-more; do
  c=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$ORIGIN$p" 2>/dev/null)
  [ "$c" = "200" ] || { bad "SPA fallback $p -> ${c:-none}"; spa_bad=1; }
done
[ "$spa_bad" = "0" ] && ok "SPA fallback: /learn /play /lessons /lessons/:id all 200"

# --- nothing is injected at the edge ----------------------------------------------------------
# Only meaningful through a CDN, and invisible to a plain curl: Cloudflare injects its analytics
# beacon for real browsers only. Comparing the two is the only way to see it. See DEPLOY-AWS.md.
if [ "$EDGE" = "1" ]; then
  UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'
  asbrowser=$(curl -s --max-time 15 -H "User-Agent: $UA" "$ORIGIN/" 2>/dev/null)
  if [ "$asbrowser" = "$body" ]; then
    ok "edge injects nothing (browser and curl get identical HTML)"
  else
    bad "the edge is INJECTING into the HTML — a third-party script the CSP will block"
    grep -o 'src="[^"]*"' <<<"$asbrowser" | grep -v "$ORIGIN" | head -3 | while read -r s; do info "$s"; done
    info "turn it off at the zone (e.g. Web Analytics); do NOT widen the CSP"
  fi
fi

echo
if [ "$FAIL" -eq 0 ]; then
  echo "PASS — $PASS checks"
  echo "Note: this cannot prove the PWA works. Only cutting the network can:"
  echo "  devtools console -> (await caches.keys()).length  must be > 0"
  echo "  devtools Network -> Offline -> reload -> the app must still render"
  exit 0
fi
echo "FAIL — $FAIL failed, $PASS passed"
exit 1

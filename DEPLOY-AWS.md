# Deploying SmartHand Math on AWS EC2 behind a Cloudflare Tunnel

How `handmath.org` runs in production: a **static nginx container** on a small EC2 instance with
**no public IPv4 address**. Inbound arrives through a **Cloudflare Tunnel**; the box has no open
ports and no public IP.

This app **shares its instance with [opendys](https://github.com/lumduan/opendys)** — see that
repo's `DEPLOY-AWS.md` for the one-time VPC/subnet/egress-only-IGW/SSM setup, which is not repeated
here.

## Why this shape

- **Inbound:** `cloudflared` dials *out* to Cloudflare's edge, so the origin needs no inbound rule
  and no public IP. Requests flow `Browser → Cloudflare → tunnel → 127.0.0.1:8081`.
- **Outbound: none.** Unlike opendys, this app makes **zero** runtime network calls — the MediaPipe
  model + wasm and the Baloo 2 / Mitr fonts are all baked into the image and served same-origin.
  The CSP (`default-src 'self'`, `connect-src 'self'`) makes that browser-enforced.
- **The one IPv4-only dependency is pulling the image** (`ghcr.io` publishes no AAAA record).
  Handle it with a **temporary Elastic IP** during install/updates only, then release it.

```
Browser ──HTTPS──> Cloudflare edge ──tunnel (IPv6)──> cloudflared ─┬─> 127.0.0.1:8080  opendys
                                                                    └─> 127.0.0.1:8081  smart-hand-math
```

## How this differs from opendys on the same box

| | opendys | smart-hand-math |
| --- | --- | --- |
| Port | `8080` | **`8081`** (8080 is taken) |
| Docker network | `--network host` (needs IPv6 egress for the Typhoon API) | **default bridge**, `-p 127.0.0.1:8081:8080` — no egress needed, so the container stays off the host network |
| Runtime config | `--env-file /opt/opendys/.env` (`TYPHOON_API`, resolver flags) | **none** — every `VITE_*` var is baked in at build time |
| Image tag | `:latest` | **pinned `:vX.Y.Z`** — makes what's running knowable and rollback a one-liner |
| Tunnel | its own Public Hostname | **a second Public Hostname on the same tunnel** — no second `cloudflared`, no extra token |

> The tunnel target is `http://127.0.0.1:8081`, **not** `localhost:8081` — the container publishes on
> IPv4 loopback only, and on an IPv6-primary host `localhost` costs a wasted `::1` connect attempt.

## Install / update (during a temporary EIP window)

`ghcr.io` is IPv4-only, and SSM is only reachable while the EIP is attached, so both need the same
brief window.

1. **Attach an Elastic IP** to the instance (AWS console, or `aws ec2 allocate-address` +
   `associate-address`). Wait for SSM to report `Online` — typically ~1 minute.
2. **Connect** via SSM Session Manager (EC2 → *Connect* → *Session Manager*). No SSH key, no open port.

   > ⏱️ **RunCommand lags after the agent reconnects.** If you drive the box with
   > `aws ssm send-command` instead of an interactive session, expect several minutes of
   > `Pending` / `Delayed` *after* `PingStatus` already reads `Online` — the heartbeat comes back
   > before command delivery does. It resolves on its own; just resend. Don't burn time debugging
   > it: `ssm:ListCommands` is denied to the provisioning IAM user, and the
   > `AWS-StartNonInteractiveCommands` document doesn't exist in `ap-southeast-7`.
3. On the box — pull and (re)create. The image is **public**, so no registry login:
   ```bash
   sudo docker pull ghcr.io/lumduan/smart-hand-math:v1.1.2
   sudo docker rm -f smart-hand-math 2>/dev/null || true
   sudo docker run -d --name smart-hand-math --restart unless-stopped \
     -p 127.0.0.1:8081:8080 ghcr.io/lumduan/smart-hand-math:v1.1.2
   ```
4. **Verify** before releasing the IP — [`scripts/verify-deploy.sh`](scripts/verify-deploy.sh)
   checks reachability, the production build, the precache manifest, `sw.js` caching, CSP,
   `Permissions-Policy` (`camera` / `autoplay`), SPA fallback, and edge injection. It detects
   whether it's talking to the origin or Cloudflare and adjusts expectations. Non-zero exit on
   any failure.

   The box is provisioned with **Docker only — there is no repo checkout on it**, so fetch the
   script rather than trying to run it from a working copy. `:8081` is bound to loopback, so this
   has to run *on* the box; the EIP window is also the only time it has the IPv4 to fetch anything:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/lumduan/smart-hand-math/main/scripts/verify-deploy.sh \
     | bash -s http://127.0.0.1:8081
   ```
   **Then check the neighbour.** This instance also runs
   [opendys](https://github.com/lumduan/opendys) on `:8080`, and it has its own script — use it
   instead of a `curl -I` glance, because the ways a deploy here could hurt it are not visible in a
   status line (a port collision, or the 1 GB box running out of memory and the kernel picking a
   victim). It also checks things only opendys knows about, like whether its `/api` proxy is still
   served rather than swallowed by its SPA fallback, and whether `TYPHOON_API` survived:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/lumduan/opendys/main/scripts/verify-deploy.sh \
     | bash -s http://127.0.0.1:8080
   ```
   Once the tunnel points at the new container, run both against their public URLs from anywhere:
   ```bash
   ./scripts/verify-deploy.sh https://handmath.org                    # from a checkout
   ./scripts/verify-deploy.sh https://opendys.com                     # opendys repo's copy
   ```
   Every check in both is exercised against a deliberately-broken deployment by each repo's
   `scripts/test-verify-deploy.sh` — because the earlier version of this step was a pipeline that
   could only ever print "pass" (see the note below).

   **`verify-deploy.sh` passing does not mean the PWA works** — it can only read headers and the
   manifest. The one test that counts is cutting the network: in devtools,
   `(await caches.keys()).length` must be `> 0`, then Network → Offline → reload → the app must
   still render.
5. **Release the Elastic IP** — *release*, not just disassociate: an idle EIP still bills.
   The site keeps serving; the tunnel is outbound over IPv6 and never needed the IP.

For a first-time hostname setup: Cloudflare **Zero Trust → Networks → Tunnels →** the instance's
tunnel **→ Public Hostname → Add**: `handmath.org` → service **HTTP** → `127.0.0.1:8081`. TLS
terminates at Cloudflare (the container serves plain HTTP on purpose); enable **HSTS** at the edge.

## Releasing a new version

See [`RELEASING.md`](./RELEASING.md) — tag `vX.Y.Z` → the *Release (GHCR)* workflow builds and
pushes `ghcr.io/lumduan/smart-hand-math:vX.Y.Z`. Then run the EIP window above with the new tag.

**Rollback** is the same procedure with the previous tag — nothing else to undo:
```bash
sudo docker rm -f smart-hand-math
sudo docker run -d --name smart-hand-math --restart unless-stopped \
  -p 127.0.0.1:8081:8080 ghcr.io/lumduan/smart-hand-math:v1.1.0
```

## Notes

- **The image is amd64-only** (`release.yml` sets no `platforms:`), so the instance must be x86_64
  (t3.*), **not** Graviton/t4g. Add `platforms: linux/amd64,linux/arm64` to the release workflow
  before moving to arm64.
- **Reboots** need no action — `--restart unless-stopped` brings the container back.
- **Cost:** compute is shared with opendys (**+$0**); the image is ~80 MB on the existing gp3 root
  volume. The only new charge is the EIP during a window (~$0.005/hr). Steady state: **$0**.
- **Never long-cache `sw.js`.** The service worker and `registerSW.js` are not content-hashed; the
  image deliberately serves them `Cache-Control: no-cache` so `registerType: 'autoUpdate'` can ship
  new builds. Long-caching them lets the Cloudflare edge pin returning visitors to a stale shell.
  Verified in production: `/sw.js` comes back `cf-cache-status: REVALIDATED`, i.e. the edge checks
  the origin on every request and never serves a stale copy. Cloudflare *does* rewrite the
  browser-facing header to `max-age=14400` (its default Browser Cache TTL) — harmless, because
  `registerSW.js` registers with the default `updateViaCache: 'imports'`, so browsers bypass their
  HTTP cache for the SW script anyway. `index.html` keeps `no-cache` (`DYNAMIC`), which is what
  makes a new deploy visible immediately.
- **A duplicate precache entry silently disables the whole service worker.** Cost us a broken PWA
  from `1.0.0` to `1.1.2`: `assets/favicon.svg` was precached both by `globPatterns: '**/*.svg'`
  (`revision: null`) and as the webmanifest icon (with a revision). Workbox rejects conflicting
  entries for the same URL, and because `precacheAndRoute` runs inside the generated `sw.js`'s async
  AMD factory, the throw is swallowed — no install handler, no navigation route, no `/models/`
  runtime cache. **The SW still installs, activates, reports healthy and controls every page while
  caching nothing**, so nothing looks wrong: the site works, it just has no offline support and
  every navigation quietly hits the network. `vite.config.ts` now sets
  `globIgnores: ['assets/favicon.svg']`. Adding any file that both a glob and the manifest reference
  will reintroduce it — `scripts/verify-deploy.sh` catches it.

  **The real acceptance test is still cutting the network**, since a healthy-looking SW proves
  nothing and no header check can see this:
  ```bash
  # in a browser devtools console on https://handmath.org, after a load or two:
  (await caches.keys()).length          # must be > 0
  # then: DevTools → Network → Offline → reload → the app must still render
  ```
- **Write verify checks that you have watched fail.** The first version of the verify step here
  ended in `... | grep -o X | sed ... || echo FAIL`. A pipeline's exit status is its **last**
  command's, and `sed` succeeds on empty input, so the `||` never fired — and a sibling check using
  `uniq -d && echo "DUPLICATE"` printed `DUPLICATE STILL PRESENT` on a perfectly good deploy, since
  `uniq` exits 0 whether or not it prints anything. Both were noise pretending to be verification.
  `scripts/verify-deploy.sh` therefore ends every check in an explicit `[ ... ]` or `grep -q`, and
  `scripts/test-verify-deploy.sh` serves deliberately-broken variants to prove each one trips.
- **Cloudflare Web Analytics is OFF for `handmath.org` — keep it that way.** Disabled 2026-07-15
  (also on the `opendys.com` zone). When enabled, Cloudflare injects
  `static.cloudflareinsights.com/beacon.min.js` into the HTML **at the edge**, which would make the
  app contact a third party on every page load — contradicting the no-data-leaves-the-device promise
  it makes to children and their parents, and [ADR-0001](docs/plans/adr/ADR-0001-client-side-no-backend.md).
  `script-src 'self'` blocks the beacon, so while it was enabled it produced a console CSP error on
  every visit and collected nothing. **Never "fix" that error by widening the CSP** — the block is
  the privacy guarantee working. Turn the injection off instead (Analytics & Logs → Web Analytics →
  the site → Manage site → Automatic Setup off, or Delete site). This only affects the client-side
  RUM beacon; zone-level traffic analytics are server-side and unaffected.

  Any edge feature that rewrites HTML has the same problem (Rocket Loader, Email Obfuscation,
  Mirage, etc.) — the CSP will block the injected script and the app is what breaks, not the feature.

  **Regression check** (works for any zone; the injection only targets real browsers, so a plain
  `curl` will *not* reveal it — you must compare the two):
  ```bash
  UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'
  diff <(curl -s -H "User-Agent: $UA" https://handmath.org/) <(curl -s https://handmath.org/) \
    && echo "clean: edge injects nothing"
  ```
  Identical output means a browser receives byte-for-byte what nginx serves. Confirmed 2026-07-15.
- **Camera needs a secure context** — Cloudflare terminates TLS at the edge, so `getUserMedia` works
  even though the origin container speaks plain HTTP.
- **The app is playable without a camera** (on-screen number pad), which is also how it's tested
  headlessly.

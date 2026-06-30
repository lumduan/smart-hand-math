# Releasing SmartHand Math

This project ships as a **Docker image** (ghcr.io) and a **GitHub Release**.
Releases are **tag-driven**: pushing a `v*` tag builds + publishes the image and
tags the release. There is no npm publish (it's a static app).

## Prerequisites

- `main` is green (CI: lint → typecheck → test → build).
- You know the next version number ([semver](https://semver.org)): `MAJOR.MINOR.PATCH`.

## Steps

1. **Bump the version** in `package.json` (`"version": "X.Y.Z"`).
2. **Update [`CHANGELOG.md`](./CHANGELOG.md)** — add a `## [X.Y.Z] — YYYY-MM-DD`
   section under `## [Unreleased]` (or at the top) summarising Added/Changed/Fixed.
3. **Commit + push to `main`:**
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore(release): vX.Y.Z"
   git push origin main
   ```
4. **Tag + push the tag** (this triggers the GHCR build):
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
5. **Wait for the [Release (GHCR)](./.github/workflows/release.yml) workflow** to
   finish (Actions tab) — it pushes `ghcr.io/lumduan/smart-hand-math:vX.Y.Z` and
   `:latest`.
6. **Publish the GitHub Release** (uses the changelog section as notes):
   ```bash
   gh release create vX.Y.Z --title "vX.Y.Z" --notes-file <(awk '/## \[X.Y.Z\]/{f=1} f{print}' CHANGELOG.md | sed -e '${/^$/d}')
   ```
   (Or paste the `## [X.Y.Z]` block from `CHANGELOG.md` into `gh release create`
   interactively.)

## Verify a release

```bash
docker pull ghcr.io/lumduan/smart-hand-math:latest
docker run --rm -p 8080:8080 ghcr.io/lumduan/smart-hand-math:latest
# → open http://localhost:8080
gh release view vX.Y.Z
```

## Notes

- The Docker image includes the self-hosted MediaPipe model+wasm (~40 MB), so the
  image is ~80 MB+. That's expected (offline + zero-egress).
- A fresh clone runs prod via `docker compose --profile prod up` (pulls `:latest`;
  builds locally if the image isn't pullable).
- If a release is bad, treat it like any semver project: **don't delete the tag**;
  cut a new patch (`vX.Y.Z+1`) and mark the bad release as a pre-release/yanked.

# Releasing

## Versioning pattern

Use simple semantic version tags:

- `v0.1.0`
- `v0.1.1`
- `v0.2.0`
- `v1.0.0`

Guidance:

- Patch: fixes, docs, non-breaking workflow/config updates
- Minor: new features, new admin tools, non-breaking UI or API additions
- Major: breaking changes to config, routes, deployment, or behavior

## Release process

1. Update [CHANGELOG.md](../CHANGELOG.md)
2. Commit to `main`
3. Create a tag:

```bash
git tag v0.1.1
git push origin main
git push origin v0.1.1
```

4. The GHCR workflow will publish the image
5. Create or update the GitHub release notes if needed

## Image tags

Current publish targets:

- `ghcr.io/biller007/seerr-episode-search:latest`
- `ghcr.io/biller007/seerr-episode-search:vX.Y.Z`
- `ghcr.io/biller007/seerr-episode-search:sha-...`

## Upstream policy

This fork does not auto-track upstream Seerr.

If you want upstream changes:

```bash
git fetch upstream
git merge upstream/main
```

Review changes before pushing to `origin/main`.

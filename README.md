# Episode Search Fork For Seerr

This repository is a standalone Seerr fork with an added admin-only `Episode Search` page for running missing Sonarr and Radarr searches from inside the Seerr UI.

## What this fork adds

- Admin sidebar entry: `Episode Search`
- Missing Sonarr search logic limited to episodes that have already aired
- Missing Radarr movie search controls
- Manual scan support
- Built-in schedule options:
  - manual only
  - once hourly
  - once every 12 hours
  - once every 24 hours
- Episode Search counters and activity log

## Upstream behavior

This fork does **not** auto-update when upstream Seerr changes.

- Nothing is pulled from `seerr-team/seerr` automatically
- Upstream merges are manual
- You control if and when this fork is rebased or merged with upstream changes

## Install

Start with the install guide:

- [docs/INSTALL.md](./docs/INSTALL.md)

For Docker Compose using a GHCR image, see:

- [docker-compose.ghcr.yml](./docker-compose.ghcr.yml)

## Container image

The included GitHub Actions workflow publishes a multi-arch image to:

```text
ghcr.io/biller007/seerr-episode-search:latest
```

## Local development

Install dependencies:

```bash
corepack pnpm install
```

Run locally:

```bash
PORT=9715 corepack pnpm exec ts-node -r tsconfig-paths/register --files --project server/tsconfig.json server/index.ts
```

Then open:

```text
http://<machine-ip>:9715
```

## Notes

- Seerr uses a setup flow on first run, so the app may redirect to `/setup` until initialization is complete.
- The Episode Search page is admin-only.
- The default internal container port remains `5055`. The example Compose file maps host port `9715`.
- The default example timezone is `UTC`.

## Credit

This fork is based on [Seerr](https://github.com/seerr-team/seerr) and keeps Seerr's existing license and core application structure.

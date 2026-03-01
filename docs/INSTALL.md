# Install Guide

## Option 1: Docker Compose with GHCR

1. Push this fork to your GitHub repository.
2. Enable GitHub Packages for the repository.
3. Run the `GHCR Docker Build` workflow or push to `main`.
4. Pull the image from:

```text
ghcr.io/<github-owner>/<github-repo>:latest
```

Use the example file:

```bash
cp docker-compose.ghcr.yml docker-compose.yml
```

Edit the image name if needed, then start:

```bash
docker compose up -d
```

Open:

```text
http://<server-ip>:9715
```

## Option 2: Local run

Requirements:

- Node.js 22
- Corepack

Install:

```bash
corepack pnpm install
```

Run:

```bash
PORT=9715 corepack pnpm exec ts-node -r tsconfig-paths/register --files --project server/tsconfig.json server/index.ts
```

Open:

```text
http://<server-ip>:9715
```

## Persistence

Mount the `config` directory so Seerr settings, setup state, and Episode Search settings/logs persist across restarts.

## No automatic upstream sync

This fork does not update from upstream Seerr on its own.

- If upstream changes, your running install stays on the version you built/pulled
- If you want upstream changes later, merge them manually into this repository

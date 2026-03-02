# Repository Instructions

## Purpose

This fork tracks stable upstream Seerr releases while preserving the fork-specific Episode Search functionality and deployment changes.

## Upstream Update Workflow

When the user asks to update this repository from upstream, always follow this workflow unless they explicitly request a different process.

1. Confirm the repo is on `main`.
2. Fetch upstream refs:
   - `git fetch upstream`
3. Merge from stable upstream, not the development branch:
   - merge `upstream/main` into `main`
   - do not use `upstream/develop` unless the user explicitly asks for it
4. Use [`docs/FORK_CHANGES.md`](/home/biller007/seerr/docs/FORK_CHANGES.md) as the merge guide:
   - preserve fork-specific Episode Search files and wiring
   - review fork-touched files carefully if upstream changed them
   - keep the fork-specific nav config, routes, settings, docs, and GHCR workflow intact unless the user asks otherwise
5. After the merge, verify the repo still builds cleanly:
   - run the TypeScript checks if possible
   - if `pnpm` is not on `PATH`, use `corepack pnpm exec ...`
6. Determine the current upstream stable version tag from `upstream/main`.
7. Update [`package.json`](/home/biller007/seerr/package.json) `version` to match that upstream stable version number without the `v` prefix.
   - example: upstream tag `v3.1.0` means `package.json` version must be `3.1.0`
8. Keep [`server/utils/appVersion.ts`](/home/biller007/seerr/server/utils/appVersion.ts) behavior aligned with stable releases:
   - stable builds should report `v${version}`
   - the legacy `develop-${commitTag}` fallback only applies if `package.json` is ever set back to `0.1.0`
9. Commit the merge and version update changes.
10. Push `main` to `origin`.
11. Create or update the matching release tag on the fork:
   - tag name must match the upstream stable tag, for example `v3.1.0`
   - push that tag to `origin`
12. Create a GitHub Release for that tag if GitHub CLI is authenticated:
   - prefer `gh api` or `gh release create`
   - generate release notes when appropriate

## Versioning Rules

- This fork tracks stable upstream Seerr releases from `upstream/main`.
- The app version shown in the UI/runtime should match the stable upstream tag.
- `package.json` stores the numeric version like `3.1.0`.
- The runtime app version should display with a `v` prefix like `v3.1.0`.

## Merge Notes

- Do not remove fork-specific Episode Search functionality during upstream merges.
- Pay special attention to the files listed in [`docs/FORK_CHANGES.md`](/home/biller007/seerr/docs/FORK_CHANGES.md).
- If upstream changes conflict with fork changes, resolve them in favor of preserving the fork features unless the user says otherwise.

## Git Notes

- Prefer normal merge commits for upstream updates unless the user explicitly requests a rebase.
- Do not amend existing commits unless the user explicitly asks.
- If Husky hooks fail in the non-interactive shell because of `/dev/tty`, it is acceptable to use `HUSKY=0` for the required commit.

## Release Notes

- Pushing a tag is not the same as creating a GitHub Release object.
- If the user asks for a release, create the GitHub Release after the tag is pushed.
- Before creating a release, check whether that release already exists on GitHub to avoid duplicate API calls.

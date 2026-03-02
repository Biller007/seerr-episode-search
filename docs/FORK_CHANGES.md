## Files modified from upstream

| File | Change |
|------|--------|
| server/routes/index.ts | Added episode search route import and registration (2 lines) |
| server/lib/settings/index.ts | Added `episodeSearch` config block |
| server/api/github.ts | Changed upstream commit lookup to track `seerr-team/seerr` `main` |
| src/components/Layout/Sidebar/index.tsx | Added `episodeSearchSidebarLink` import and splice into `SidebarLinks` |
| src/components/Layout/MobileMenu/index.tsx | Added `episodeSearchMobileLink` import and splice into `menuLinks` |
| src/i18n/locale/en.json | Added `episodesearch` translation key |
| src/components/Settings/SettingsAbout/index.tsx | Changed update links/text to reference stable upstream `main` |
| CONTRIBUTING.md | Changed fork update instructions from `upstream/develop` to `upstream/main` |
| docs/RELEASING.md | Changed upstream merge instructions from `upstream/develop` to `upstream/main` |

## Files added (new, no upstream conflict)

- server/lib/episodeSearch.ts
- server/routes/episodeSearch.ts
- src/components/EpisodeSearch/index.tsx
- src/pages/episode-search.tsx
- src/config/episodeSearchNavItem.ts
- docker-compose.ghcr.yml
- docs/INSTALL.md
- .github/workflows/ghcr.yml

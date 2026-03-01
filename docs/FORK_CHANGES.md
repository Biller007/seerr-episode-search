## Files modified from upstream

| File | Change |
|------|--------|
| server/routes/index.ts | Added episode search route import and registration (2 lines) |
| server/lib/settings/index.ts | Added `episodeSearch` config block |
| src/components/Layout/Sidebar/index.tsx | Added `episodeSearchSidebarLink` import and splice into `SidebarLinks` |
| src/components/Layout/MobileMenu/index.tsx | Added `episodeSearchMobileLink` import and splice into `menuLinks` |
| src/i18n/locale/en.json | Added `episodesearch` translation key |

## Files added (new, no upstream conflict)

- server/lib/episodeSearch.ts
- server/routes/episodeSearch.ts
- src/components/EpisodeSearch/index.tsx
- src/pages/episode-search.tsx
- src/config/episodeSearchNavItem.ts
- docker-compose.ghcr.yml
- docs/INSTALL.md
- .github/workflows/ghcr.yml

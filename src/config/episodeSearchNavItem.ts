import { Permission } from '@app/hooks/useUser';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon as FilledMagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { createElement } from 'react';

export const episodeSearchSidebarLink = {
  href: '/episode-search',
  messagesKey: 'episodesearch' as const,
  svgIcon: createElement(MagnifyingGlassIcon, {
    className: 'mr-3 h-6 w-6',
  }),
  activeRegExp: /^\/episode-search/,
  requiredPermission: Permission.ADMIN,
  dataTestId: 'sidebar-menu-episode-search',
};

export const episodeSearchMobileLink = {
  href: '/episode-search',
  svgIcon: createElement(MagnifyingGlassIcon, {
    className: 'h-6 w-6',
  }),
  svgIconSelected: createElement(FilledMagnifyingGlassIcon, {
    className: 'h-6 w-6',
  }),
  activeRegExp: /^\/episode-search/,
  requiredPermission: Permission.ADMIN,
  dataTestId: 'sidebar-menu-episode-search',
};

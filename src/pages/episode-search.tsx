import EpisodeSearch from '@app/components/EpisodeSearch';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission } from '@app/hooks/useUser';
import type { NextPage } from 'next';

const EpisodeSearchPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);

  return <EpisodeSearch />;
};

export default EpisodeSearchPage;

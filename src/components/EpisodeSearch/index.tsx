import RadarrLogo from '@app/assets/services/radarr.svg';
import SonarrLogo from '@app/assets/services/sonarr.svg';
import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import defineMessages from '@app/utils/defineMessages';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages('components.EpisodeSearch', {
  title: 'Episode Search',
  description:
    'Run missing episode and movie searches using the Sonarr and Radarr servers already configured in Seerr.',
  maxItems: 'Max items per run',
  maxPages: 'Max Sonarr pages',
  schedule: 'Schedule',
  manual: 'Manual only',
  hourly: 'Once hourly',
  twelveHours: 'Once every 12 hours',
  twentyFourHours: 'Once every 24 hours',
  saveSettings: 'Save Settings',
  manualScan: 'Run Manual Scan',
  refresh: 'Refresh',
  checks: 'Checks completed',
  manualChecks: 'Manual checks',
  scheduledChecks: 'Scheduled checks',
  episodeTriggers: 'Episode searches triggered',
  movieTriggers: 'Movie searches triggered',
  lastChecked: 'Last checked',
  nextRun: 'Next run',
  lastSource: 'Last run source',
  sonarrTitle: 'Aired Missing Episodes',
  radarrTitle: 'Missing Movies Ready To Search',
  noSonarr: 'No Sonarr servers are configured yet.',
  noRadarr: 'No Radarr servers are configured yet.',
  lastRunResult: 'Last run result',
  errorTitle: 'Error',
  connected: 'Connected',
  notConnected: 'Not connected',
  activityLog: 'Activity Log',
  noLogEntries: 'No Episode Search activity yet.',
});

type ServiceSummary = {
  id: number;
  name: string;
  is4k: boolean;
  isDefault: boolean;
  missingCount: number | null;
  error?: string;
};

type EpisodeSearchResponse = {
  sonarr: ServiceSummary[];
  radarr: ServiceSummary[];
  config: {
    interval: 'manual' | 'hourly' | '12hours' | '24hours';
    maxItems: number;
    maxSonarrPages: number;
  };
  stats: {
    totalChecks: number;
    manualChecks: number;
    scheduledChecks: number;
    totalEpisodeSearchesTriggered: number;
    totalMovieSearchesTriggered: number;
    lastCheckedAt?: string;
    lastRunSource?: 'manual' | 'scheduled';
  };
  logs: {
    timestamp: string;
    message: string;
  }[];
  nextRunAt: string | null;
  isRunning: boolean;
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const EpisodeSearch = () => {
  const intl = useIntl();
  const { data, error, isLoading, mutate } = useSWR<EpisodeSearchResponse>(
    '/api/v1/episode-search'
  );
  const [maxItems, setMaxItems] = useState(5);
  const [maxPages, setMaxPages] = useState(5);
  const [interval, setIntervalValue] =
    useState<EpisodeSearchResponse['config']['interval']>('manual');
  const [busyAction, setBusyAction] = useState<'save' | 'run' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      return;
    }

    setMaxItems(data.config.maxItems);
    setMaxPages(data.config.maxSonarrPages);
    setIntervalValue(data.config.interval);
  }, [data]);

  const saveSettings = async () => {
    setBusyAction('save');
    setMessage(null);

    try {
      await axios.post('/api/v1/episode-search/settings', {
        interval,
        maxItems,
        maxSonarrPages: maxPages,
      });
      setMessage('Episode Search settings saved.');
      await mutate();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to save settings.');
    } finally {
      setBusyAction(null);
    }
  };

  const runManualScan = async () => {
    setBusyAction('run');
    setMessage(null);

    try {
      const response = await axios.post<{
        ok: boolean;
        episodeSearchesTriggered: number;
        movieSearchesTriggered: number;
      }>('/api/v1/episode-search/run');

      setMessage(
        `${response.data.episodeSearchesTriggered} episode searches and ${response.data.movieSearchesTriggered} movie searches triggered.`
      );
      await mutate();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to run manual scan.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <>
      <PageTitle title={intl.formatMessage(messages.title)} />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {intl.formatMessage(messages.title)}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-300">
            {intl.formatMessage(messages.description)}
          </p>
        </div>

        {error && (
          <Alert title={intl.formatMessage(messages.errorTitle)} type="error">
            <span>Unable to load the Episode Search page.</span>
          </Alert>
        )}

        {message && (
          <Alert title={intl.formatMessage(messages.lastRunResult)} type="info">
            <span>{message}</span>
          </Alert>
        )}

        <div className="grid gap-4 rounded-lg border border-gray-700 bg-gray-900/60 p-4 md:grid-cols-4">
          <label className="flex flex-col gap-2 text-sm text-gray-300">
            <span>{intl.formatMessage(messages.schedule)}</span>
            <select
              value={interval}
              onChange={(e) =>
                setIntervalValue(
                  e.target.value as EpisodeSearchResponse['config']['interval']
                )
              }
              className="rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white"
            >
              <option value="manual">
                {intl.formatMessage(messages.manual)}
              </option>
              <option value="hourly">
                {intl.formatMessage(messages.hourly)}
              </option>
              <option value="12hours">
                {intl.formatMessage(messages.twelveHours)}
              </option>
              <option value="24hours">
                {intl.formatMessage(messages.twentyFourHours)}
              </option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-gray-300">
            <span>{intl.formatMessage(messages.maxItems)}</span>
            <input
              type="number"
              min={1}
              max={100}
              value={maxItems}
              onChange={(e) =>
                setMaxItems(Math.max(1, Number(e.target.value) || 1))
              }
              className="rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-gray-300">
            <span>{intl.formatMessage(messages.maxPages)}</span>
            <input
              type="number"
              min={1}
              max={20}
              value={maxPages}
              onChange={(e) =>
                setMaxPages(Math.max(1, Number(e.target.value) || 1))
              }
              className="rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white"
            />
          </label>

          <div className="flex items-end gap-2">
            <Button
              buttonType="ghost"
              onClick={saveSettings}
              disabled={busyAction !== null}
            >
              {busyAction === 'save' ? (
                <LoadingSpinner />
              ) : (
                intl.formatMessage(messages.saveSettings)
              )}
            </Button>
            <Button
              buttonType="primary"
              onClick={runManualScan}
              disabled={busyAction !== null || !!data?.isRunning}
            >
              {busyAction === 'run' || data?.isRunning ? (
                <LoadingSpinner />
              ) : (
                intl.formatMessage(messages.manualScan)
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
            <div className="text-sm text-gray-300">
              {intl.formatMessage(messages.checks)}
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {data?.stats.totalChecks ?? 0}
            </div>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
            <div className="text-sm text-gray-300">
              {intl.formatMessage(messages.manualChecks)}
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {data?.stats.manualChecks ?? 0}
            </div>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
            <div className="text-sm text-gray-300">
              {intl.formatMessage(messages.scheduledChecks)}
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {data?.stats.scheduledChecks ?? 0}
            </div>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
            <div className="text-sm text-gray-300">
              {intl.formatMessage(messages.episodeTriggers)}
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {data?.stats.totalEpisodeSearchesTriggered ?? 0}
            </div>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
            <div className="text-sm text-gray-300">
              {intl.formatMessage(messages.movieTriggers)}
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {data?.stats.totalMovieSearchesTriggered ?? 0}
            </div>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
            <div className="text-sm text-gray-300">
              {intl.formatMessage(messages.lastSource)}
            </div>
            <div className="mt-2 text-lg font-semibold text-white">
              {data?.stats.lastRunSource ?? '--'}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
            <div className="text-sm text-gray-300">
              {intl.formatMessage(messages.lastChecked)}
            </div>
            <div className="mt-2 text-lg font-semibold text-white">
              {formatDateTime(data?.stats.lastCheckedAt)}
            </div>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
            <div className="text-sm text-gray-300">
              {intl.formatMessage(messages.nextRun)}
            </div>
            <div className="mt-2 text-lg font-semibold text-white">
              {formatDateTime(data?.nextRunAt)}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-lg border border-gray-700 bg-gray-900/60 p-6">
              <div className="mb-4 flex items-center gap-3">
                <SonarrLogo className="h-10 w-10" />
                <h2 className="text-lg font-semibold text-white">
                  {intl.formatMessage(messages.sonarrTitle)}
                </h2>
              </div>

              {data && data.sonarr.length === 0 ? (
                <Alert type="info">
                  <span>{intl.formatMessage(messages.noSonarr)}</span>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {data?.sonarr.map((server) => (
                    <div
                      key={server.id}
                      className="rounded-lg border border-gray-700 bg-gray-800/70 p-4"
                    >
                      <div className="text-base font-medium text-white">
                        {server.name}
                        {server.isDefault ? ' (Default)' : ''}
                        {server.is4k ? ' 4K' : ''}
                      </div>
                      <div className="mt-1 text-sm text-gray-300">
                        {server.error
                          ? intl.formatMessage(messages.notConnected)
                          : intl.formatMessage(messages.connected)}
                      </div>
                      {server.error && (
                        <div className="mt-2 text-sm text-red-300">
                          {server.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-gray-700 bg-gray-900/60 p-6">
              <div className="mb-4 flex items-center gap-3">
                <RadarrLogo className="h-10 w-10" />
                <h2 className="text-lg font-semibold text-white">
                  {intl.formatMessage(messages.radarrTitle)}
                </h2>
              </div>

              {data && data.radarr.length === 0 ? (
                <Alert type="info">
                  <span>{intl.formatMessage(messages.noRadarr)}</span>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {data?.radarr.map((server) => (
                    <div
                      key={server.id}
                      className="rounded-lg border border-gray-700 bg-gray-800/70 p-4"
                    >
                      <div className="text-base font-medium text-white">
                        {server.name}
                        {server.isDefault ? ' (Default)' : ''}
                        {server.is4k ? ' 4K' : ''}
                      </div>
                      <div className="mt-1 text-sm text-gray-300">
                        {server.error
                          ? intl.formatMessage(messages.notConnected)
                          : intl.formatMessage(messages.connected)}
                      </div>
                      {server.error && (
                        <div className="mt-2 text-sm text-red-300">
                          {server.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        <div className="flex">
          <Button
            buttonType="ghost"
            onClick={() => mutate()}
            disabled={busyAction !== null}
          >
            {intl.formatMessage(messages.refresh)}
          </Button>
        </div>

        <section className="rounded-lg border border-gray-700 bg-gray-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">
            {intl.formatMessage(messages.activityLog)}
          </h2>
          <div className="mt-4 space-y-3">
            {data?.logs?.length ? (
              data.logs
                .slice()
                .reverse()
                .map((entry, index) => (
                  <div
                    key={`${entry.timestamp}-${index}`}
                    className="rounded-lg border border-gray-700 bg-gray-800/70 px-4 py-3"
                  >
                    <div className="text-xs uppercase tracking-wide text-gray-400">
                      {formatDateTime(entry.timestamp)}
                    </div>
                    <div className="mt-1 text-sm text-gray-200">
                      {entry.message}
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-sm text-gray-300">
                {intl.formatMessage(messages.noLogEntries)}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default EpisodeSearch;

import type { RadarrMovie } from '@server/api/servarr/radarr';
import RadarrAPI from '@server/api/servarr/radarr';
import SonarrAPI from '@server/api/servarr/sonarr';
import {
  getSettings,
  type EpisodeSearchInterval,
  type EpisodeSearchLogEntry,
  type RadarrSettings,
  type SonarrSettings,
} from '@server/lib/settings';
import logger from '@server/logger';
import schedule from 'node-schedule';

type TriggerSource = 'manual' | 'scheduled';

type SonarrSummary = {
  id: number;
  name: string;
  is4k: boolean;
  isDefault: boolean;
  missingCount: number | null;
  error?: string;
};

type RadarrSummary = SonarrSummary;

const intervalToCron: Record<
  Exclude<EpisodeSearchInterval, 'manual'>,
  string
> = {
  hourly: '0 0 * * * *',
  '12hours': '0 0 */12 * * *',
  '24hours': '0 0 0 * * *',
};

class EpisodeSearchManager {
  private job: schedule.Job | null = null;

  private running = false;

  private appendLog(message: string) {
    const settings = getSettings();
    const entry: EpisodeSearchLogEntry = {
      timestamp: new Date().toISOString(),
      message,
    };

    settings.episodeSearch = {
      ...settings.episodeSearch,
      logs: [...settings.episodeSearch.logs, entry].slice(-100),
    };
  }

  private isReleased(movie: RadarrMovie, now: Date): boolean {
    if (movie.isAvailable) {
      return true;
    }

    const releaseDates = [
      movie.digitalRelease,
      movie.physicalRelease,
      movie.inCinemas,
    ]
      .filter(Boolean)
      .map((value) => new Date(value as string))
      .filter((value) => !Number.isNaN(value.getTime()));

    return releaseDates.some((value) => value <= now);
  }

  private async getEligibleSonarr(server: SonarrSettings) {
    const settings = getSettings().episodeSearch;
    const api = new SonarrAPI({
      apiKey: server.apiKey,
      url: SonarrAPI.buildUrl(server, '/api/v3'),
    });
    const now = new Date();
    const allEligibleIds: number[] = [];
    let totalRecords = 0;

    for (let page = 1; page <= settings.maxSonarrPages; page += 1) {
      const missing = await api.getMissingEpisodes({ page, pageSize: 1000 });
      totalRecords = missing.totalRecords ?? totalRecords;

      for (const episode of missing.records) {
        if (
          episode.monitored &&
          !episode.hasFile &&
          episode.airDateUtc &&
          new Date(episode.airDateUtc) <= now
        ) {
          allEligibleIds.push(episode.id);
        }
      }

      if (page * 1000 >= totalRecords) {
        break;
      }
    }

    return {
      summary: {
        id: server.id,
        name: server.name,
        is4k: server.is4k,
        isDefault: server.isDefault,
        missingCount: allEligibleIds.length,
      } satisfies SonarrSummary,
      eligibleIds: allEligibleIds,
      triggeredIds: allEligibleIds.slice(0, settings.maxItems),
      api,
    };
  }

  private async getEligibleRadarr(server: RadarrSettings) {
    const settings = getSettings().episodeSearch;
    const api = new RadarrAPI({
      apiKey: server.apiKey,
      url: RadarrAPI.buildUrl(server, '/api/v3'),
    });
    const now = new Date();
    const movies = await api.getMovies();
    const eligibleIds = movies
      .filter(
        (movie) =>
          movie.monitored && !movie.hasFile && this.isReleased(movie, now)
      )
      .map((movie) => movie.id);

    return {
      summary: {
        id: server.id,
        name: server.name,
        is4k: server.is4k,
        isDefault: server.isDefault,
        missingCount: eligibleIds.length,
      } satisfies RadarrSummary,
      eligibleIds,
      triggeredIds: eligibleIds.slice(0, settings.maxItems),
      api,
    };
  }

  public async getOverview(): Promise<{
    sonarr: SonarrSummary[];
    radarr: RadarrSummary[];
    nextRunAt: string | null;
    isRunning: boolean;
  }> {
    const settings = getSettings();

    const sonarr = await Promise.all(
      settings.sonarr.map(async (server) => {
        try {
          const result = await this.getEligibleSonarr(server);
          return result.summary;
        } catch (e) {
          logger.warn('Failed to load Sonarr episode search overview', {
            label: 'Episode Search',
            serverId: server.id,
            errorMessage: e.message,
          });

          return {
            id: server.id,
            name: server.name,
            is4k: server.is4k,
            isDefault: server.isDefault,
            missingCount: null,
            error: e.message,
          };
        }
      })
    );

    const radarr = await Promise.all(
      settings.radarr.map(async (server) => {
        try {
          const result = await this.getEligibleRadarr(server);
          return result.summary;
        } catch (e) {
          logger.warn('Failed to load Radarr episode search overview', {
            label: 'Episode Search',
            serverId: server.id,
            errorMessage: e.message,
          });

          return {
            id: server.id,
            name: server.name,
            is4k: server.is4k,
            isDefault: server.isDefault,
            missingCount: null,
            error: e.message,
          };
        }
      })
    );

    return {
      sonarr,
      radarr,
      nextRunAt: this.job?.nextInvocation()?.toISOString() ?? null,
      isRunning: this.running,
    };
  }

  public async run(source: TriggerSource): Promise<{
    episodeSearchesTriggered: number;
    movieSearchesTriggered: number;
  }> {
    if (this.running) {
      throw new Error('Episode Search is already running.');
    }

    this.running = true;

    try {
      const settings = getSettings();
      let episodeSearchesTriggered = 0;
      let movieSearchesTriggered = 0;

      this.appendLog(`Episode Search run started (${source}).`);

      for (const server of settings.sonarr) {
        const result = await this.getEligibleSonarr(server);
        if (result.triggeredIds.length > 0) {
          await result.api.searchEpisodes(result.triggeredIds);
          episodeSearchesTriggered += result.triggeredIds.length;
          this.appendLog(
            `${server.name}: triggered ${result.triggeredIds.length} aired missing episode search(es).`
          );
        } else {
          this.appendLog(`${server.name}: no aired missing episodes eligible.`);
        }
      }

      for (const server of settings.radarr) {
        const result = await this.getEligibleRadarr(server);
        if (result.triggeredIds.length > 0) {
          await result.api.searchMovies(result.triggeredIds);
          movieSearchesTriggered += result.triggeredIds.length;
          this.appendLog(
            `${server.name}: triggered ${result.triggeredIds.length} missing movie search(es).`
          );
        } else {
          this.appendLog(`${server.name}: no missing movies eligible.`);
        }
      }

      settings.episodeSearch = {
        ...settings.episodeSearch,
        stats: {
          ...settings.episodeSearch.stats,
          totalChecks: settings.episodeSearch.stats.totalChecks + 1,
          manualChecks:
            settings.episodeSearch.stats.manualChecks +
            (source === 'manual' ? 1 : 0),
          scheduledChecks:
            settings.episodeSearch.stats.scheduledChecks +
            (source === 'scheduled' ? 1 : 0),
          totalEpisodeSearchesTriggered:
            settings.episodeSearch.stats.totalEpisodeSearchesTriggered +
            episodeSearchesTriggered,
          totalMovieSearchesTriggered:
            settings.episodeSearch.stats.totalMovieSearchesTriggered +
            movieSearchesTriggered,
          lastCheckedAt: new Date().toISOString(),
          lastRunSource: source,
        },
        logs: settings.episodeSearch.logs,
      };
      this.appendLog(
        `Episode Search run finished (${source}) with ${episodeSearchesTriggered} episode search(es) and ${movieSearchesTriggered} movie search(es).`
      );
      await settings.save();

      return { episodeSearchesTriggered, movieSearchesTriggered };
    } catch (error) {
      this.appendLog(`Episode Search run failed: ${error.message}`);
      await getSettings().save();
      throw error;
    } finally {
      this.running = false;
    }
  }

  public async updateSettings(input: {
    interval: EpisodeSearchInterval;
    maxItems: number;
    maxSonarrPages: number;
  }) {
    const settings = getSettings();
    settings.episodeSearch = {
      ...settings.episodeSearch,
      interval: input.interval,
      maxItems: Math.min(100, Math.max(1, input.maxItems)),
      maxSonarrPages: Math.min(20, Math.max(1, input.maxSonarrPages)),
    };
    this.appendLog(
      `Episode Search settings updated: interval=${input.interval}, maxItems=${Math.min(100, Math.max(1, input.maxItems))}, maxSonarrPages=${Math.min(20, Math.max(1, input.maxSonarrPages))}.`
    );
    await settings.save();
    this.start();
  }

  public start() {
    if (this.job) {
      this.job.cancel();
      this.job = null;
    }

    const interval = getSettings().episodeSearch.interval;
    if (interval === 'manual') {
      return;
    }

    this.job = schedule.scheduleJob(intervalToCron[interval], () => {
      logger.info('Starting scheduled Episode Search run', {
        label: 'Episode Search',
        interval,
      });
      this.run('scheduled').catch((error) => {
        logger.error('Scheduled Episode Search failed', {
          label: 'Episode Search',
          errorMessage: error.message,
        });
      });
    });
  }
}

const episodeSearchManager = new EpisodeSearchManager();

export default episodeSearchManager;

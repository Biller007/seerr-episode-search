import episodeSearchManager from '@server/lib/episodeSearch';
import { getSettings, type EpisodeSearchInterval } from '@server/lib/settings';
import { Router } from 'express';

const episodeSearchRoutes = Router();

episodeSearchRoutes.get('/', async (_req, res) => {
  const settings = getSettings().episodeSearch;
  const overview = await episodeSearchManager.getOverview();

  return res.status(200).json({
    sonarr: overview.sonarr,
    radarr: overview.radarr,
    config: {
      interval: settings.interval,
      maxItems: settings.maxItems,
      maxSonarrPages: settings.maxSonarrPages,
    },
    stats: settings.stats,
    logs: settings.logs,
    nextRunAt: overview.nextRunAt,
    isRunning: overview.isRunning,
  });
});

episodeSearchRoutes.post('/run', async (_req, res, next) => {
  try {
    const result = await episodeSearchManager.run('manual');
    return res.status(200).json({
      ok: true,
      ...result,
    });
  } catch (e) {
    return next({ status: 500, message: e.message });
  }
});

episodeSearchRoutes.post('/settings', async (req, res, next) => {
  try {
    const interval = (req.body?.interval ?? 'manual') as EpisodeSearchInterval;
    if (!['manual', 'hourly', '12hours', '24hours'].includes(interval)) {
      return next({ status: 400, message: 'Invalid Episode Search interval.' });
    }

    await episodeSearchManager.updateSettings({
      interval,
      maxItems: Number(req.body?.maxItems) || 5,
      maxSonarrPages: Number(req.body?.maxSonarrPages) || 5,
    });

    return res.status(200).json(getSettings().episodeSearch);
  } catch (e) {
    return next({ status: 500, message: e.message });
  }
});

export default episodeSearchRoutes;

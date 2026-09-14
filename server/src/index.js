import express from 'express';
import config, { isAiEnabled, isWhatsappLive } from './config.js';
import logger from './utils/logger.js';
import { getDb, initDb } from './db/index.js';
import webhookRouter from './routes/webhook.js';
import paymentsRouter from './routes/payments.js';
import apiRouter from './routes/api.js';
import adminRouter from './routes/admin.js';
import { processDueListings } from './matching/engine.js';
import { runSelfCheck } from './utils/selfcheck.js';

export const createApp = () => {
  const app = express();

  // Imza dogrulamasi icin ham govdeyi sakla
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) =>
    res.json({
      ok: true,
      dryRun: config.dryRun,
      whatsappLive: isWhatsappLive(),
      aiEnabled: isAiEnabled(),
      paymentProvider: config.payments.provider,
    })
  );

  // Derin saglik: tum API baglantilarini canli dogrular.
  app.get('/health/deep', async (_req, res) => {
    try {
      const result = await runSelfCheck();
      res.status(result.ok ? 200 : 503).json(result);
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.use(webhookRouter);
  app.use(paymentsRouter);
  app.use(apiRouter);
  app.use(adminRouter);

  return app;
};

// Toplama penceresi dolan ilanlari periyodik isle (dakikada bir)
export const startScheduler = () => {
  const tick = async () => {
    try {
      const n = await processDueListings();
      if (n > 0) logger.info(`Scheduler: ${n} ilan eslestirmeye alindi`);
    } catch (err) {
      logger.error('Scheduler hatasi', err.message);
    }
  };
  return setInterval(tick, 60 * 1000);
};

const isMain = process.argv[1] && process.argv[1].endsWith('index.js');
if (isMain) {
  const boot = async () => {
    await initDb();
    const app = createApp();
    app.listen(config.port, () => {
      logger.info(`Benim Bakicim eslestirme sistemi calisiyor: ${config.publicBaseUrl} (port ${config.port})`);
      logger.info(
        `Mod: dryRun=${config.dryRun}, whatsappLive=${isWhatsappLive()}, ai=${isAiEnabled()}, odeme=${config.payments.provider}`
      );
      runSelfCheck()
        .then((r) => logger.info(`Self-check: ${JSON.stringify(r.checks)}`))
        .catch((err) => logger.warn('Self-check hatasi:', err.message));
    });
    startScheduler();
  };
  boot().catch((err) => {
    logger.error('Sunucu baslatilamadi', err.message);
    process.exit(1);
  });
}

export default createApp;

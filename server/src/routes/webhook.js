import express from 'express';
import config from '../config.js';
import logger from '../utils/logger.js';
import wa from '../whatsapp/client.js';
import { processWebhookPayload } from '../whatsapp/webhook.js';

const router = express.Router();

// Meta webhook dogrulama (GET)
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    logger.info('WhatsApp webhook dogrulandi');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Gelen mesajlar (POST)
router.post('/webhook', async (req, res) => {
  const signature = req.get('x-hub-signature-256');
  logger.info(`Webhook POST alindi (imza: ${signature ? 'var' : 'yok'})`);
  let rawBody = req.rawBody;
  // serverless-http yedegi: Lambda event govdesinden al
  if (!rawBody && req.apiGateway?.event?.body != null) {
    const ev = req.apiGateway.event;
    rawBody = ev.isBase64Encoded
      ? Buffer.from(ev.body, 'base64')
      : Buffer.from(ev.body, 'utf8');
  }
  if (!wa.verifySignature(rawBody, signature)) {
    logger.warn('WhatsApp webhook imza dogrulanamadi');
    return res.sendStatus(401);
  }
  // Serverless'ta yanit dondukten sonra calisma donar; bekleyen is yarim kalir ve
  // bir sonraki istekte devam ederek mesajlarin tekrar gonderilmesine yol acar.
  // Bu yuzden isi bitirmeden 200 donmuyoruz (Meta 20 sn tolere eder).
  try {
    await processWebhookPayload(req.body);
  } catch (err) {
    logger.error('Webhook isleme hatasi', err.message);
  }
  res.sendStatus(200);
});

export default router;

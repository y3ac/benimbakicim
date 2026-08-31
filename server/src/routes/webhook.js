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
  if (!wa.verifySignature(req.rawBody, signature)) {
    logger.warn('WhatsApp webhook imza dogrulanamadi');
    return res.sendStatus(401);
  }
  // Meta 20 sn icinde 200 bekler; isi asenkron yap.
  res.sendStatus(200);
  try {
    await processWebhookPayload(req.body);
  } catch (err) {
    logger.error('Webhook isleme hatasi', err.message);
  }
});

export default router;

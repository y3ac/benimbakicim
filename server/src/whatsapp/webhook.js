import logger from '../utils/logger.js';
import { handleInbound } from '../bot/stateMachine.js';
import { conversations, processedMessages } from '../repositories/index.js';
import {
  loadConversation,
  saveConversation,
  claimRemoteMessage,
} from '../store/blobs.js';

const digits = (id) => String(id || '').replace(/\D/g, '');

// Meta WhatsApp webhook payload'unu normalize edip bot'a iletir.
export const processWebhookPayload = async (body) => {
  const results = [];
  const entries = body?.entry || [];
  for (const entry of entries) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const contacts = value.contacts || [];
      const nameByWaId = {};
      contacts.forEach((c) => {
        const id = digits(c.wa_id) || c.wa_id;
        if (id) nameByWaId[id] = c.profile?.name;
      });

      for (const msg of value.messages || []) {
        const waId = digits(msg.from) || msg.from;
        const name = nameByWaId[waId] || nameByWaId[msg.from];

        const remoteClaim = await claimRemoteMessage(msg.id);
        if (!remoteClaim || !processedMessages.claim(msg.id)) {
          logger.info(`Tekrar gonderilen mesaj atlandi: ${msg.id}`);
          results.push({ waId, ok: true, skipped: true });
          continue;
        }

        const saved = await loadConversation(waId);
        if (saved?.state && saved.state !== 'start') {
          conversations.save(waId, {
            role: saved.role,
            state: saved.state,
            context: saved.context || {},
          });
          logger.info(`Konusma geri yuklendi ${waId} [${saved.state}]`);
        }

        const inbound = { waId, name, text: null, buttonId: null };

        if (msg.type === 'text') {
          inbound.text = msg.text?.body || '';
        } else if (msg.type === 'interactive') {
          const it = msg.interactive;
          if (it?.type === 'button_reply') {
            inbound.buttonId = it.button_reply?.id || null;
            inbound.text = it.button_reply?.title || null;
          } else if (it?.type === 'list_reply') {
            inbound.buttonId = it.list_reply?.id || null;
            inbound.text = it.list_reply?.title || null;
          }
        } else if (msg.type === 'button') {
          inbound.text = msg.button?.text || '';
          inbound.buttonId = msg.button?.payload || null;
        } else {
          inbound.text = '';
        }

        try {
          await handleInbound(inbound);
          const after = conversations.get(waId);
          await saveConversation(waId, after || { state: 'start', role: null, context: {} });
          logger.info(`Konusma kaydedildi ${waId} [${after?.state || 'start'}]`);
          results.push({ waId, ok: true });
        } catch (err) {
          logger.error('handleInbound hatasi', err.message, err.stack);
          results.push({ waId, ok: false, error: err.message });
        }
      }
    }
  }
  return results;
};

export default { processWebhookPayload };

import logger from '../utils/logger.js';
import { handleInbound } from '../bot/stateMachine.js';

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
        if (c.wa_id) nameByWaId[c.wa_id] = c.profile?.name;
      });

      for (const msg of value.messages || []) {
        const waId = msg.from;
        const name = nameByWaId[waId];
        const inbound = { waId, name, text: null, buttonId: null };

        if (msg.type === 'text') {
          inbound.text = msg.text?.body || '';
        } else if (msg.type === 'interactive') {
          const it = msg.interactive;
          if (it?.type === 'button_reply') inbound.buttonId = it.button_reply.id;
          else if (it?.type === 'list_reply') inbound.buttonId = it.list_reply.id;
        } else if (msg.type === 'button') {
          // Sablon quick-reply
          inbound.text = msg.button?.text || '';
          inbound.buttonId = msg.button?.payload || null;
        } else {
          inbound.text = '';
        }

        try {
          await handleInbound(inbound);
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

import config, { isWhatsappLive } from '../config.js';
import logger from '../utils/logger.js';
import { publications } from '../repositories/index.js';
import { logEvent } from '../services/audit.js';

// Yayin ciktilari (test/simulasyon icin bellekte).
export const publishOutbox = [];

const postText = (listing) => {
  const body = listing.ai_text || listing.aiText || '';
  return (
    `🔔 Yeni İş İlanı — ${listing.code}\n\n` +
    `${body}\n\n` +
    `Başvurmak için WhatsApp: ${config.whatsapp.businessPhoneDisplay}\n` +
    `Başvururken ilan kodunu (${listing.code}) yazın.`
  );
};

// --- Kanal adaptorleri ---
// Her adaptor { publish(listing) } -> { status, externalRef, detail }

const waGroupAdapter = (groupTag) => ({
  channel: `wa_group:${groupTag}`,
  async publish(listing) {
    // NOT: Resmi WhatsApp Cloud API klasik gruplara serbest post desteklemez.
    // Uretim secenekleri: (1) WhatsApp Channel, (2) yonetici hesabiyla kontrollu post,
    // (3) grup uyelerine tek tek sablon (izinli). Burada kayit + cikti uretilir.
    const text = postText(listing);
    publishOutbox.push({ channel: `wa_group:${groupTag}`, listingCode: listing.code, text });
    return { status: 'sent', externalRef: null, detail: `grup:${groupTag} (kontrollu yayin)` };
  },
});

const instagramAdapter = {
  channel: 'instagram',
  async publish(listing) {
    const text = postText(listing);
    publishOutbox.push({ channel: 'instagram', listingCode: listing.code, text });
    if (!config.publishing.igUserId || !config.publishing.metaContentToken) {
      return { status: 'skipped', detail: 'IG kimlik bilgisi yok (yari otomatik)' };
    }
    // Uretim: Instagram Content Publishing API (media container + publish).
    return { status: 'sent', detail: 'IG icerik API' };
  },
};

const facebookAdapter = {
  channel: 'facebook',
  async publish(listing) {
    const text = postText(listing);
    publishOutbox.push({ channel: 'facebook', listingCode: listing.code, text });
    if (!config.publishing.fbPageId || !config.publishing.metaContentToken) {
      return { status: 'skipped', detail: 'FB sayfa bilgisi yok (yari otomatik)' };
    }
    // Uretim: POST /{page-id}/feed
    return { status: 'sent', detail: 'FB Page feed' };
  },
};

// Faz 2: WhatsApp Kanali (Channels). Yalnizca WHATSAPP_CHANNEL_ID tanimliysa aktif.
const waChannelAdapter = {
  channel: 'wa_channel',
  async publish(listing) {
    const text = postText(listing);
    publishOutbox.push({ channel: 'wa_channel', listingCode: listing.code, text });
    // Uretim: WhatsApp Channels yayin API'si entegre edilir.
    return { status: 'sent', detail: `kanal:${config.publishing.waChannelId}` };
  },
};

// Faz 2: Sahibinden.com. Resmi otomatik post riskli; yari otomatik "manual" cikti uretir.
const sahibindenAdapter = {
  channel: 'sahibinden',
  async publish(listing) {
    const text = postText(listing);
    publishOutbox.push({ channel: 'sahibinden', listingCode: listing.code, text });
    // Elle yayin icin hazir sablon; otomatik post ToS riski tasidigindan varsayilan degil.
    return { status: 'manual', detail: 'Elle yayin sablonu hazirlandi' };
  },
};

// Bir ilani tum kanallara yayinla.
export const publishListing = async (listing) => {
  const adapters = [
    ...config.publishing.waGroups.map((g) => waGroupAdapter(g)),
    instagramAdapter,
    facebookAdapter,
    ...(config.publishing.waChannelId ? [waChannelAdapter] : []),
    ...(config.publishing.sahibindenEnabled ? [sahibindenAdapter] : []),
  ];
  const results = [];
  for (const adapter of adapters) {
    try {
      const r = await adapter.publish(listing);
      publications.add({
        listingCode: listing.code,
        channel: adapter.channel,
        status: r.status,
        externalRef: r.externalRef,
        detail: r.detail,
      });
      results.push({ channel: adapter.channel, ...r });
    } catch (err) {
      logger.error(`Yayin hatasi (${adapter.channel})`, err.message);
      publications.add({
        listingCode: listing.code,
        channel: adapter.channel,
        status: 'failed',
        detail: err.message,
      });
      results.push({ channel: adapter.channel, status: 'failed', detail: err.message });
    }
  }
  logger.info(
    `Ilan ${listing.code} yayinlandi: ${results.map((r) => `${r.channel}=${r.status}`).join(', ')}` +
      (isWhatsappLive() ? '' : ' [simulasyon]')
  );
  logEvent({
    type: 'publication',
    listingCode: listing.code,
    detail: {
      simulated: !isWhatsappLive(),
      channels: results.map((r) => ({ channel: r.channel, status: r.status })),
    },
  });
  return results;
};

export default { publishListing, publishOutbox, postText };

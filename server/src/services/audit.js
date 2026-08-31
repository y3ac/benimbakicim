import logger from '../utils/logger.js';
import { events } from '../repositories/index.js';

// Tek noktadan aksiyon/olay kaydi. Operator ve AI, ilan gecmisini buradan takip eder.
// type: listing_created | payment_created | payment_paid | published | offer_sent
//       | candidate_revealed | matching_pending | matching_finalized | publication | note
export const logEvent = ({ type, listingCode, waId, actor = 'system', detail }) => {
  try {
    events.add({ type, listingCode, waId, actor, detail });
  } catch (err) {
    logger.warn(`Event kaydi basarisiz (${type}): ${err.message}`);
  }
};

export default { logEvent };

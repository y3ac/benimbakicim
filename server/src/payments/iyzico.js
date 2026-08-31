import config from '../config.js';
import logger from '../utils/logger.js';

// iyzico resmi Node SDK'si (CommonJS) ESM icine varsayilan import ile alinir.
let Iyzipay;
let client;

const getClient = async () => {
  if (client) return client;
  if (!config.payments.iyzico.apiKey || !config.payments.iyzico.secretKey) return null;
  if (!Iyzipay) {
    const mod = await import('iyzipay');
    Iyzipay = mod.default || mod;
  }
  client = new Iyzipay({
    apiKey: config.payments.iyzico.apiKey,
    secretKey: config.payments.iyzico.secretKey,
    uri: config.payments.iyzico.baseUrl,
  });
  return client;
};

const promisify = (fn, arg) =>
  new Promise((resolve, reject) => {
    fn(arg, (err, result) => (err ? reject(err) : resolve(result)));
  });

// Hosted odeme sayfasi baslat -> { link, providerRef(token) }
export const createCheckoutLink = async ({ reference, amountTl, listing, waId, buyerName }) => {
  const iyzipay = await getClient();
  if (!iyzipay) return null; // kimlik yok -> ust katman fallback yapar

  const price = Number(amountTl).toFixed(2);
  const gsm = `+${String(waId).replace(/\D/g, '')}`;
  const request = {
    locale: 'tr',
    conversationId: reference,
    price,
    paidPrice: price,
    currency: 'TRY',
    basketId: listing?.code || reference,
    paymentGroup: 'PRODUCT',
    callbackUrl: `${config.publicBaseUrl}/payments/iyzico/callback`,
    buyer: {
      id: waId,
      name: buyerName || 'Musteri',
      surname: 'Benim Bakicim',
      gsmNumber: gsm,
      email: `${waId}@benimbakicim.com`,
      identityNumber: '11111111111',
      registrationAddress: 'Istanbul',
      ip: '85.34.78.112',
      city: 'Istanbul',
      country: 'Turkey',
    },
    billingAddress: {
      contactName: buyerName || 'Musteri',
      city: 'Istanbul',
      country: 'Turkey',
      address: 'Istanbul',
    },
    basketItems: [
      {
        id: listing?.code || reference,
        name: 'Benim Bakicim ilan/aday paketi',
        category1: 'Hizmet',
        itemType: 'VIRTUAL',
        price,
      },
    ],
  };

  const result = await promisify(iyzipay.checkoutFormInitialize.create.bind(iyzipay.checkoutFormInitialize), request);
  if (result.status !== 'success') {
    throw new Error(`iyzico initialize hata: ${result.errorMessage || result.errorCode}`);
  }
  return { link: result.paymentPageUrl, providerRef: result.token };
};

// Token ile odeme durumunu sorgula -> true/false
export const isCheckoutPaid = async (token) => {
  const iyzipay = await getClient();
  if (!iyzipay || !token) return false;
  try {
    const result = await promisify(
      iyzipay.checkoutForm.retrieve.bind(iyzipay.checkoutForm),
      { locale: 'tr', token }
    );
    return result.status === 'success' && result.paymentStatus === 'SUCCESS';
  } catch (err) {
    logger.warn('iyzico durum sorgu hatasi:', err.message);
    return false;
  }
};

export default { createCheckoutLink, isCheckoutPaid };

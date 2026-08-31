// Ilan kodu ve referans uretimi. Karisikligi azaltmak icin belirsiz karakterler (0/O, 1/I) kullanilmaz.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const randomBlock = (len) => {
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
};

// Ilan kodu: ILN-XXXX
export const generateListingCode = () => `ILN-${randomBlock(4)}`;

// Odeme referansi: benzersiz izleme numarasi (WhatsApp/odeme saglayici akisi boyunca kullanilir)
export const generateReference = (prefix = 'PAY') =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomBlock(3)}`;

export default { generateListingCode, generateReference };

/* Benim Bakıcım — Site Configuration */
const SITE = {
  email: 'info@benimbakicim.com',
  whatsappNumber: '905355963545',
  whatsappDisplay: '0535 596 35 45',
  whatsappUrl: 'https://wa.me/905355963545',
  formProvider: 'cloudflare',
  formEndpoint: '/api/form',
  thankYouUrl: '/pages/tesekkur.html',
  // Ödeme yalnızca WhatsApp katalog üzerinden alınır.
  paymentMethod: 'whatsapp_catalog',
  catalogPaymentMessage:
    'Merhaba, ilan paketi satın almak istiyorum. WhatsApp katalog üzerinden ödeme yapacağım; ödeme sonrası ilanımı oluşturmak istiyorum.',
  catalogPaymentUrl:
    'https://wa.me/905355963545?text=' +
    encodeURIComponent(
      'Merhaba, ilan paketi satın almak istiyorum. WhatsApp katalog üzerinden ödeme yapacağım; ödeme sonrası ilanımı oluşturmak istiyorum.'
    ),
  applicantsPerPackage: 3,
  listingPackages: [
    {
      id: 'standart',
      name: 'İlan Paketi',
      price: 1000,
      priceLabel: '1.000 TL',
      badge: '3 Başvuru',
      description:
        'WhatsApp katalogdan ödeme sonrası ilanınız yayınlanır. Paket başına en fazla 3 başvuran numarası iletilir.',
      features: [
        'Ödeme yalnızca WhatsApp katalog üzerinden',
        'Ödeme sonrası ilanınızı oluşturursunuz',
        'Bakıcı / yardımcı havuzunda yayın',
        'Paket başına en fazla 3 başvuran numarası',
        'Referans kontrolü / ön görüşme yok'
      ]
    },
    {
      id: 'ek',
      name: 'Ek 3 Başvuru Paketi',
      price: 1000,
      priceLabel: '1.000 TL',
      badge: '+3 Numara',
      description: 'Daha fazla numara için WhatsApp katalogdan aynı paketi tekrar satın alın.',
      features: [
        'Ödeme WhatsApp katalog üzerinden',
        'Mevcut ilanınıza +3 numara',
        'Her paket yalnızca 3 numara içerir',
        'İstediğiniz kadar tekrarlanabilir'
      ]
    }
  ],
  address: 'Cevizli, Zuhal Cd., 34846 Maltepe/İstanbul, Ritim İstanbul Avm D Blok Kat 12',
  instagram: 'https://instagram.com/yatili.bakici',
  instagramHandle: '@yatili.bakici',
}

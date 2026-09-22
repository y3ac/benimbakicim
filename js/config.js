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
    'Merhaba, Standart İlan Paketi (1.000 TL) satın almak istiyorum. WhatsApp katalog üzerinden ödeme yapacağım; ödeme sonrası ilanımı oluşturmak istiyorum.',
  catalogPaymentUrl:
    'https://wa.me/905355963545?text=' +
    encodeURIComponent(
      'Merhaba, Standart İlan Paketi (1.000 TL) satın almak istiyorum. WhatsApp katalog üzerinden ödeme yapacağım; ödeme sonrası ilanımı oluşturmak istiyorum.'
    ),
  applicantsPerPackage: 3,
  listingPackages: [
    {
      id: 'standart',
      name: 'Standart İlan Paketi',
      price: 1000,
      priceLabel: '1.000 TL',
      badge: 'Önerilen',
      description:
        'WhatsApp katalogdan ödeme sonrası ilanınız yayınlanır. Paket başına en fazla 3 başvuran numarası iletilir.',
      whatsappMessage:
        'Merhaba, Standart İlan Paketi (1.000 TL) satın almak istiyorum. WhatsApp katalog üzerinden ödeme yapacağım; ödeme sonrası ilanımı oluşturmak istiyorum.',
      features: [
        'Ödeme yalnızca WhatsApp katalog üzerinden',
        'Ödeme sonrası ilanınızı oluşturursunuz',
        'Bakıcı / yardımcı havuzunda yayın',
        'Paket başına en fazla 3 başvuran numarası',
        'Referans kontrolü / ön görüşme yok'
      ]
    },
    {
      id: 'acil',
      name: 'Acil İlan Paketi',
      price: 1500,
      priceLabel: '1.500 TL',
      badge: 'Hızlı',
      description:
        'Öncelikli yayın ve daha hızlı başvuru iletimi. Paket başına yine en fazla 3 numara iletilir.',
      whatsappMessage:
        'Merhaba, Acil İlan Paketi (1.500 TL) satın almak istiyorum. WhatsApp katalog üzerinden ödeme yapacağım; ödeme sonrası ilanımı oluşturmak istiyorum.',
      features: [
        'Standart paketin tüm avantajları',
        'Öncelikli yayın sırası',
        'Daha hızlı WhatsApp başvuru iletimi',
        'Paket başına en fazla 3 başvuran numarası',
        'Daha fazla numara için ek paket alınabilir'
      ]
    }
  ],
  address: 'Cevizli, Zuhal Cd., 34846 Maltepe/İstanbul, Ritim İstanbul Avm D Blok Kat 12',
  instagram: 'https://instagram.com/yatili.bakici',
  instagramHandle: '@yatili.bakici',
}

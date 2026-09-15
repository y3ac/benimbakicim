/* Benim Bakıcım — Site Configuration */
const SITE = {
  email: 'info@benimbakicim.com',
  whatsappNumber: '905355963545',
  whatsappDisplay: '0535 596 35 45',
  whatsappUrl: 'https://wa.me/905355963545',
  formProvider: 'cloudflare',
  formEndpoint: '/api/form',
  thankYouUrl: '/pages/tesekkur.html',
  listingPaymentPage: '/pages/odeme.html',
  // PayTR / iyzico / banka ödeme linki hazır olunca buraya yapıştırın.
  // Boş bırakılırsa ödeme adımı WhatsApp üzerinden yönlendirir.
  listingPaymentUrl: '',
  listingPackages: [
    {
      id: 'standart',
      name: 'Standart İlan Paketi',
      price: 1000,
      priceLabel: '1.000 TL',
      badge: 'Önerilen',
      description: 'İlanınız yayınlanır; uygun adaylar WhatsApp üzerinden size iletilir.',
      features: [
        'İlanınız aday havuzunda yayınlanır',
        'Başvuran adayların telefon ve bilgileri WhatsApp ile paylaşılır',
        'Kısa sürede eşleştirme desteği',
        'Tek seferlik paket ücreti'
      ]
    },
    {
      id: 'oncelikli',
      name: 'Öncelikli İlan Paketi',
      price: 1500,
      priceLabel: '1.500 TL',
      badge: 'Hızlı',
      description: 'Öncelikli yayın ve daha hızlı aday paylaşımı ile süreci hızlandırın.',
      features: [
        'Standart paketin tüm avantajları',
        'Öncelikli yayın sırası',
        'Daha hızlı WhatsApp aday paylaşımı',
        'Öncelikli danışman takibi'
      ]
    }
  ],
  address: 'Cevizli, Zuhal Cd., 34846 Maltepe/İstanbul, Ritim İstanbul Avm D Blok Kat 12',
  instagram: 'https://instagram.com/yatili.bakici',
  instagramHandle: '@yatili.bakici',
}
